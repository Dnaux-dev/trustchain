"""
payments.py
The core TrustChain endpoint.
POST /payments/verify-session  — score session, gate payment
POST /payments/challenge       — re-score after behavioral challenge
GET  /payments/confirm         — Squad callback handler
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from datetime import datetime
from bson import ObjectId
from models.session import (
    VerifySessionRequest, ChallengeSubmitRequest,
    VerifySessionResponse, SessionDecision, ScoreBreakdown,
)
from services.signal_processor import extract_feature_vector, signals_quality_score
from services.biometric_engine import score_session, classify_decision
from services.profile_manager import (
    get_or_create_profile, get_helper_profile,
    update_profile, get_user_helpers,
)
from services.squad_service import account_lookup, initiate_payment, verify_transaction
from auth import get_current_user
from database import get_db
from config import settings

router = APIRouter(prefix="/payments", tags=["Payments"])


# ── Helper: build a session document ─────────────────────────────
def _new_session(user_id: str, amount: float) -> dict:
    return {
        "user_id": user_id,
        "behavioral_score": 0.0,
        "stage1_score": 0.0,
        "stage2_score": None,
        "profile_confidence": 0.0,
        "payment_amount": amount,
        "decision": "PENDING",
        "block_reason": None,
        "squad_txn_ref": None,
        "squad_confirmed": False,
        "challenge_attempts": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


# ── POST /payments/verify-session ────────────────────────────────
@router.post("/verify-session", response_model=VerifySessionResponse)
async def verify_session(
    body: VerifySessionRequest,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    user_id = user["id"]

    # ── 1. Create session record ──────────────────────────────────
    session_doc = _new_session(user_id, body.paymentAmount)
    result = await db.sessions.insert_one(session_doc)
    session_id = str(result.inserted_id)

    # ── 2. Extract feature vector ─────────────────────────────────
    signals_dict = body.behavioralData.signals.model_dump()
    quality = signals_quality_score(signals_dict)
    live_vector = extract_feature_vector(signals_dict)

    # ── 3. Load profile and score ─────────────────────────────────
    profile = await get_or_create_profile(user_id)
    score_result = score_session(live_vector, profile)
    behavioral_score = score_result["behavioral_score"]

    # Apply quality penalty — thin signal data = less confident score
    if quality < 0.5:
        behavioral_score = behavioral_score * (0.7 + 0.3 * quality)
        behavioral_score = round(behavioral_score, 1)

    decision = classify_decision(behavioral_score)

    breakdown = ScoreBreakdown(
        stage1_isolation_forest=score_result["stage1_score"],
        stage2_cosine_similarity=score_result.get("stage2_score") or 0.0,
        combined=behavioral_score,
        sessions_in_profile=score_result["sessions_in_profile"],
        profile_confidence=score_result["profile_confidence"],
    )

    # ── 4. Update session with scores ─────────────────────────────
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {
            "behavioral_score": behavioral_score,
            "stage1_score": score_result["stage1_score"],
            "stage2_score": score_result.get("stage2_score"),
            "profile_confidence": score_result["profile_confidence"],
            "signal_quality": quality,
            "signal_hash": body.behavioralData.signals.dict().get("signalHash", ""),
            "decision": decision,
            "updated_at": datetime.utcnow(),
        }}
    )

    # ── 5. BLOCKED ────────────────────────────────────────────────
    if decision == "BLOCKED":
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"block_reason": "behavioral_score_below_50"}}
        )
        return VerifySessionResponse(
            decision=SessionDecision.BLOCKED,
            behavioral_score=behavioral_score,
            breakdown=breakdown,
            session_id=session_id,
            block_reason="Behavioral pattern does not match account owner. Payment blocked.",
        )

    # ── 6. CHALLENGE ──────────────────────────────────────────────
    if decision == "CHALLENGE":
        helpers = await get_user_helpers(user_id)
        enrolled_helpers = [
            {"helper_id": h["helper_id"], "helper_name": h["helper_name"], "relationship": h["relationship"]}
            for h in helpers if h.get("is_enrolled")
        ]
        return VerifySessionResponse(
            decision=SessionDecision.CHALLENGE,
            behavioral_score=behavioral_score,
            breakdown=breakdown,
            session_id=session_id,
            challenge_message=(
                "We noticed this interaction feels a little different. "
                "Please complete the short verification below, or select a trusted person helping you."
            ),
            has_trusted_helpers=len(enrolled_helpers) > 0,
            trusted_helpers=enrolled_helpers,
        )

    # ── 7. APPROVED — run Squad pipeline ─────────────────────────
    try:
        # Step 1: Verify recipient account
        lookup = await account_lookup(body.recipientBankCode, body.recipientAccount)
        recipient_name = lookup["account_name"]

        # Step 2: Initiate Squad payment
        checkout_url, txn_ref = await initiate_payment(
            user=user,
            amount_naira=body.paymentAmount,
            recipient_name=recipient_name,
            session_id=session_id,
            behavioral_score=behavioral_score,
        )

        # Step 3: Update session with Squad refs
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {
                "squad_txn_ref": txn_ref,
                "decision": "APPROVED",
                "updated_at": datetime.utcnow(),
            }}
        )

        # Step 4: Update behavioral profile (continuous learning)
        await update_profile(user_id, live_vector.tolist())

        return VerifySessionResponse(
            decision=SessionDecision.APPROVED,
            behavioral_score=behavioral_score,
            breakdown=breakdown,
            session_id=session_id,
            checkout_url=checkout_url,
            recipient_name=recipient_name,
        )

    except ValueError as e:
        await db.sessions.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"decision": "BLOCKED", "block_reason": str(e)}}
        )
        raise HTTPException(502, f"Payment gateway error: {str(e)}")


# ── POST /payments/challenge ──────────────────────────────────────
@router.post("/challenge", response_model=VerifySessionResponse)
async def submit_challenge(
    body: ChallengeSubmitRequest,
    user: dict = Depends(get_current_user),
):
    """
    Called when user completes the behavioral re-challenge screen.
    Re-scores with fresh signals.
    If helper — scores against the helper's profile instead.
    Purely behavioral — no OTP, no PIN, no camera.
    """
    db = get_db()
    user_id = user["id"]

    # Load original session
    session = await db.sessions.find_one({"_id": ObjectId(body.sessionId)})
    if not session or session["user_id"] != user_id:
        raise HTTPException(404, "Session not found")

    if session.get("challenge_attempts", 0) >= 2:
        raise HTTPException(403, "Maximum challenge attempts reached. Payment blocked.")

    # Extract fresh vector from challenge interaction
    signals_dict = body.behavioralData.signals.model_dump()
    live_vector = extract_feature_vector(signals_dict)

    # Decide which profile to score against
    is_helper = body.challengeType == "helper" and body.helperId
    if is_helper:
        profile = await get_helper_profile(user_id, body.helperId)
        if not profile:
            raise HTTPException(404, "Trusted helper not found")
        profile_label = f"helper:{body.helperId}"
    else:
        profile = await get_or_create_profile(user_id)
        profile_label = "owner"

    score_result = score_session(live_vector, profile)
    behavioral_score = score_result["behavioral_score"]
    decision = classify_decision(behavioral_score)

    # Increment challenge attempt counter
    await db.sessions.update_one(
        {"_id": ObjectId(body.sessionId)},
        {"$inc": {"challenge_attempts": 1},
         "$set": {
             "challenge_type": profile_label,
             "challenge_score": behavioral_score,
             "updated_at": datetime.utcnow(),
         }}
    )

    breakdown = ScoreBreakdown(
        stage1_isolation_forest=score_result["stage1_score"],
        stage2_cosine_similarity=score_result.get("stage2_score") or 0.0,
        combined=behavioral_score,
        sessions_in_profile=score_result["sessions_in_profile"],
        profile_confidence=score_result["profile_confidence"],
    )

    # BLOCKED after challenge
    if decision == "BLOCKED" or (decision == "CHALLENGE" and session.get("challenge_attempts", 0) >= 1):
        await db.sessions.update_one(
            {"_id": ObjectId(body.sessionId)},
            {"$set": {"decision": "BLOCKED", "block_reason": "challenge_failed"}}
        )
        return VerifySessionResponse(
            decision=SessionDecision.BLOCKED,
            behavioral_score=behavioral_score,
            breakdown=breakdown,
            session_id=body.sessionId,
            block_reason="Could not verify identity through behavioral pattern. Payment blocked.",
        )

    # APPROVED after challenge — run Squad pipeline
    try:
        lookup = await account_lookup(
            session.get("recipient_bank_code", ""),
            session.get("recipient_account", ""),
        )
        recipient_name = lookup["account_name"]

        # Reload user for payment info
        from bson import ObjectId as OID
        user_doc = await db.users.find_one({"_id": OID(user_id)})

        checkout_url, txn_ref = await initiate_payment(
            user=user_doc,
            amount_naira=session["payment_amount"],
            recipient_name=recipient_name,
            session_id=body.sessionId,
            behavioral_score=behavioral_score,
            metadata={"challenge_type": profile_label},
        )

        await db.sessions.update_one(
            {"_id": ObjectId(body.sessionId)},
            {"$set": {
                "squad_txn_ref": txn_ref,
                "decision": "APPROVED",
                "updated_at": datetime.utcnow(),
            }}
        )

        # Update the correct profile
        if is_helper:
            await update_profile(user_id, live_vector.tolist(), is_helper=True, helper_id=body.helperId)
        else:
            await update_profile(user_id, live_vector.tolist())

        return VerifySessionResponse(
            decision=SessionDecision.APPROVED,
            behavioral_score=behavioral_score,
            breakdown=breakdown,
            session_id=body.sessionId,
            checkout_url=checkout_url,
            recipient_name=recipient_name,
        )

    except ValueError as e:
        raise HTTPException(502, str(e))


# ── GET /payments/confirm ─────────────────────────────────────────
@router.get("/confirm")
async def payment_confirm(transaction_ref: str):
    """
    Squad callback after checkout completion.
    Verifies the transaction and marks session as COMPLETE.
    """
    db = get_db()
    try:
        txn_data = await verify_transaction(transaction_ref)
    except ValueError:
        return {"status": "verification_failed", "transaction_ref": transaction_ref}

    if txn_data.get("transaction_status") != "Success":
        return {"status": "payment_not_successful"}

    await db.sessions.update_one(
        {"squad_txn_ref": transaction_ref},
        {"$set": {
            "decision": "COMPLETE",
            "squad_confirmed": True,
            "squad_gateway_ref": txn_data.get("gateway_ref"),
            "completed_at": datetime.utcnow(),
        }}
    )
    return {"status": "success", "transaction_ref": transaction_ref}
