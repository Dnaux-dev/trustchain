from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    """Personal stats for the logged-in user."""
    db = get_db()
    user_id = user["id"]

    total = await db.sessions.count_documents({"user_id": user_id})
    approved = await db.sessions.count_documents({"user_id": user_id, "decision": {"$in": ["APPROVED", "COMPLETE"]}})
    challenged = await db.sessions.count_documents({"user_id": user_id, "decision": "CHALLENGE"})
    blocked = await db.sessions.count_documents({"user_id": user_id, "decision": "BLOCKED"})

    # Total amount protected (blocked sessions)
    blocked_sessions = db.sessions.find(
        {"user_id": user_id, "decision": "BLOCKED"},
        {"payment_amount": 1}
    )
    total_protected = 0
    async for s in blocked_sessions:
        total_protected += s.get("payment_amount", 0)

    # Average behavioral score (approved sessions only)
    pipeline = [
        {"$match": {"user_id": user_id, "decision": {"$in": ["APPROVED", "COMPLETE"]}}},
        {"$group": {"_id": None, "avg_score": {"$avg": "$behavioral_score"}}}
    ]
    avg_result = await db.sessions.aggregate(pipeline).to_list(1)
    avg_score = round(avg_result[0]["avg_score"], 1) if avg_result else 0.0

    return {
        "total_sessions": total,
        "approved": approved,
        "challenged": challenged,
        "blocked": blocked,
        "total_amount_protected_naira": total_protected,
        "average_behavioral_score": avg_score,
        "is_enrolled": user.get("is_enrolled", False),
        "enrollment_sessions": user.get("enrollment_sessions", 0),
    }


@router.get("/risk-feed")
async def get_risk_feed(
    limit: int = 10,
    user: dict = Depends(get_current_user),
):
    """Recent blocked and challenged sessions for the risk monitor."""
    db = get_db()
    cursor = db.sessions.find(
        {
            "user_id": user["id"],
            "decision": {"$in": ["BLOCKED", "CHALLENGE"]},
        },
        {
            "_id": 1, "behavioral_score": 1, "decision": 1,
            "payment_amount": 1, "block_reason": 1, "created_at": 1,
        }
    ).sort("created_at", -1).limit(limit)

    feed = []
    async for s in cursor:
        s["id"] = str(s.pop("_id"))
        feed.append(s)
    return feed
