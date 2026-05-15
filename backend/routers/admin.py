"""
admin.py
Internal endpoints for model management and monitoring.
Protected by a simple API key header (ADMIN_API_KEY from env).
"""
from fastapi import APIRouter, HTTPException, Header
from database import get_db
from services.biometric_engine import retrain_model
from config import settings
import os

router = APIRouter(prefix="/admin", tags=["Admin"])

_ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "trustchain-admin-dev")


def _check_key(x_admin_key: str | None):
    if not x_admin_key or x_admin_key != _ADMIN_KEY:
        raise HTTPException(403, "Forbidden — invalid admin key")


@router.post("/retrain")
async def trigger_retrain(x_admin_key: str | None = Header(default=None)):
    """
    Retrains the Isolation Forest model using all stored behavioral vectors.
    Call this nightly / after significant data growth.
    Returns the number of vectors used.
    """
    _check_key(x_admin_key)
    db = get_db()

    # Collect all stored vectors from all behavioral profiles
    all_vectors = []
    async for profile in db.behavioral_profiles.find({}, {"vectors": 1}):
        all_vectors.extend(profile.get("vectors", []))

    # Also include helper profiles
    async for profile in db.helper_profiles.find({}, {"vectors": 1}):
        all_vectors.extend(profile.get("vectors", []))

    if len(all_vectors) < 10:
        return {
            "status": "skipped",
            "reason": f"Only {len(all_vectors)} vectors available — need at least 10 to retrain meaningfully.",
            "vectors_available": len(all_vectors),
        }

    count = retrain_model(all_vectors)
    return {
        "status": "success",
        "vectors_used": count,
        "message": f"Model retrained on {count} real behavioral sessions.",
    }


@router.get("/stats")
async def platform_stats(x_admin_key: str | None = Header(default=None)):
    """Platform-wide aggregate stats for monitoring."""
    _check_key(x_admin_key)
    db = get_db()

    total_users = await db.users.count_documents({})
    enrolled_users = await db.users.count_documents({"is_enrolled": True})
    total_sessions = await db.sessions.count_documents({})
    approved = await db.sessions.count_documents({"decision": {"$in": ["APPROVED", "COMPLETE"]}})
    challenged = await db.sessions.count_documents({"decision": "CHALLENGE"})
    blocked = await db.sessions.count_documents({"decision": "BLOCKED"})

    pipeline = [
        {"$group": {"_id": None, "avg": {"$avg": "$behavioral_score"}}}
    ]
    avg_result = await db.sessions.aggregate(pipeline).to_list(1)
    avg_score = round(avg_result[0]["avg"], 1) if avg_result else 0.0

    # Count total stored vectors
    vector_count = 0
    async for p in db.behavioral_profiles.find({}, {"vectors": 1}):
        vector_count += len(p.get("vectors", []))

    return {
        "users": {"total": total_users, "enrolled": enrolled_users},
        "sessions": {
            "total": total_sessions,
            "approved": approved,
            "challenged": challenged,
            "blocked": blocked,
        },
        "ml": {
            "total_profile_vectors": vector_count,
            "platform_avg_score": avg_score,
        },
    }
