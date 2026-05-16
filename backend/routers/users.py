from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from models.user import TrustedHelperAdd, UserOut
from services.profile_manager import (
    get_or_create_profile, add_trusted_helper, get_user_helpers
)
from auth import get_current_user
from database import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    user["id"] = str(user["_id"])
    return UserOut(**{
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user["phone"],
        "account_number": user["account_number"],
        "bank_code": user["bank_code"],
        "verified_account_name": user.get("verified_account_name"),
        "is_enrolled": user.get("is_enrolled", False),
        "enrollment_sessions": user.get("enrollment_sessions", 0),
        "trusted_helpers": user.get("trusted_helpers", []),
        "created_at": user["created_at"],
    })


@router.get("/me/profile")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Returns behavioral profile stats — not the raw vectors."""
    profile = await get_or_create_profile(user["id"])
    return {
        "user_id": user["id"],
        "is_enrolled": profile.get("is_enrolled", False),
        "enrollment_sessions": profile.get("enrollment_sessions", 0),
        "sessions_needed_for_enrollment": max(
            0, 3 - profile.get("enrollment_sessions", 0)
        ),
        "total_vectors_stored": len(profile.get("vectors", [])),
        "last_updated": profile.get("last_updated"),
    }


@router.get("/me/sessions")
async def get_my_sessions(
    limit: int = 20,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    cursor = db.sessions.find(
        {"user_id": user["id"]},
        {"_id": 1, "behavioral_score": 1, "decision": 1,
         "payment_amount": 1, "squad_txn_ref": 1, "created_at": 1,
         "challenge_type": 1, "block_reason": 1}
    ).sort("created_at", -1).limit(limit)

    sessions = []
    async for s in cursor:
        s["id"] = str(s.pop("_id"))
        sessions.append(s)
    return sessions


@router.post("/me/helpers", status_code=201)
async def add_helper(
    body: TrustedHelperAdd,
    user: dict = Depends(get_current_user),
):
    """
    Add a trusted person (e.g. son/daughter) who can make payments
    on the account owner's behalf using their OWN behavioral profile.
    """
    db = get_db()
    existing_helpers = user.get("trusted_helpers", [])
    if len(existing_helpers) >= 3:
        raise HTTPException(400, "Maximum 3 trusted helpers per account")

    helper_id = await add_trusted_helper(user["id"], body.model_dump())
    return {
        "message": "Trusted helper added successfully",
        "helper_id": helper_id,
        "helper_name": body.helper_name,
        "note": (
            f"{body.helper_name} needs to complete 3 payment sessions "
            "to enroll their behavioral profile."
        ),
    }


@router.get("/me/helpers")
async def list_helpers(user: dict = Depends(get_current_user)):
    helpers = await get_user_helpers(user["id"])
    return helpers


@router.delete("/me/helpers/{helper_id}", status_code=200)
async def remove_helper(
    helper_id: str,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$pull": {"trusted_helpers": {"helper_id": helper_id}}}
    )
    await db.helper_profiles.delete_one({
        "user_id": user["id"],
        "helper_id": helper_id,
    })
    return {"message": "Trusted helper removed"}
