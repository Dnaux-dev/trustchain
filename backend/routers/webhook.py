"""
webhook.py
Receives and verifies Squad webhook events.
Closes the audit loop after payment confirmation.
"""
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException
from datetime import datetime
from database import get_db
from config import settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def _verify_squad_signature(body_bytes: bytes, signature: str) -> bool:
    """
    Verifies the Squad webhook signature.
    Squad signs webhooks with HMAC-SHA512 using your secret key.
    """
    if not settings.SQUAD_WEBHOOK_SECRET:
        # Skip verification in dev if secret not set
        return True
    expected = hmac.new(
        settings.SQUAD_WEBHOOK_SECRET.encode(),
        body_bytes,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/squad")
async def squad_webhook(request: Request):
    body_bytes = await request.body()
    signature = request.headers.get("x-squad-encrypted-body", "")

    if not _verify_squad_signature(body_bytes, signature):
        raise HTTPException(401, "Invalid webhook signature")

    payload = await request.json()
    event = payload.get("Event")
    body = payload.get("Body", {})

    db = get_db()

    # ── charge_successful ─────────────────────────────────────────
    if event == "charge_successful":
        txn_ref = body.get("transaction_ref")
        await db.sessions.update_one(
            {"squad_txn_ref": txn_ref},
            {"$set": {
                "squad_confirmed": True,
                "decision": "COMPLETE",
                "squad_gateway_ref": body.get("gateway_ref"),
                "squad_amount": body.get("amount"),
                "confirmed_at": datetime.utcnow(),
            }}
        )

    # ── transfer_complete ─────────────────────────────────────────
    elif event == "transfer_complete":
        txn_ref = body.get("transaction_reference")
        await db.sessions.update_one(
            {"squad_txn_ref": txn_ref},
            {"$set": {
                "squad_confirmed": True,
                "decision": "COMPLETE",
                "squad_nip_ref": body.get("nip_transaction_reference"),
                "confirmed_at": datetime.utcnow(),
            }}
        )

    # Log all webhook events
    await db.webhook_logs.insert_one({
        "event": event,
        "body": body,
        "received_at": datetime.utcnow(),
    })

    return {"status": "received"}
