"""
fraud_intelligence.py
Real-time fraud feed, war room stats, behavioral drift detection,
behavioral credit score, and alert system.
"""
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from bson import ObjectId
from database import get_db
from auth import get_current_user
import random

router = APIRouter(prefix="/intelligence", tags=["Fraud Intelligence"])


# ── WAR ROOM — live fraud feed ─────────────────────────────────────
@router.get("/war-room")
async def get_war_room(user: dict = Depends(get_current_user)):
    """
    Returns aggregated fraud intelligence across the platform.
    In production this aggregates across all users.
    For demo: combines real user data with simulated platform data.
    """
    db = get_db()

    # Real blocked sessions from this user
    real_blocked = await db.sessions.count_documents({"decision": "BLOCKED"})
    real_approved = await db.sessions.count_documents({"decision": {"$in": ["APPROVED", "COMPLETE"]}})
    real_challenged = await db.sessions.count_documents({"decision": "CHALLENGE"})
    real_total = await db.sessions.count_documents({})

    # Real amount blocked
    pipeline = [
        {"$match": {"decision": "BLOCKED"}},
        {"$group": {"_id": None, "total": {"$sum": "$payment_amount"}}}
    ]
    blocked_amount = await db.sessions.aggregate(pipeline).to_list(1)
    total_blocked_naira = blocked_amount[0]["total"] if blocked_amount else 0

    # Simulate platform-wide scale for demo
    platform_multiplier = 1247  # simulates thousands of users
    platform_blocked_naira = total_blocked_naira * platform_multiplier + 4_200_000

    # Live feed — last 10 blocked sessions enriched with location data
    NIGERIAN_LOCATIONS = [
        "Yaba, Lagos", "Ikeja, Lagos", "VI, Lagos", "Lekki, Lagos",
        "Wuse, Abuja", "Maitama, Abuja", "Garki, Abuja",
        "Port Harcourt, Rivers", "Kano, Kano", "Ibadan, Oyo",
        "Enugu, Enugu", "Owerri, Imo", "Benin City, Edo",
        "Uyo, Akwa Ibom", "Calabar, Cross River"
    ]
    FRAUD_TYPES = [
        "SIM-swap attack", "Account takeover", "Behavioral anomaly",
        "Unusual device tilt", "Keystroke mismatch", "Tap pattern fraud",
        "High-speed typing detected", "Paste-based form fill"
    ]

    cursor = db.sessions.find(
        {"decision": "BLOCKED"},
        {"behavioral_score": 1, "payment_amount": 1, "created_at": 1}
    ).sort("created_at", -1).limit(8)

    feed = []
    async for s in cursor:
        feed.append({
            "id": str(s["_id"]),
            "location": random.choice(NIGERIAN_LOCATIONS),
            "fraud_type": random.choice(FRAUD_TYPES),
            "amount_protected": s.get("payment_amount", 0),
            "behavioral_score": s.get("behavioral_score", 0),
            "timestamp": s.get("created_at", datetime.utcnow()).isoformat(),
            "seconds_ago": int((datetime.utcnow() - s.get("created_at", datetime.utcnow())).total_seconds()),
        })

    # Score distribution for chart
    pipeline2 = [
        {"$group": {
            "_id": {
                "$switch": {
                    "branches": [
                        {"case": {"$gte": ["$behavioral_score", 70]}, "then": "approved"},
                        {"case": {"$gte": ["$behavioral_score", 50]}, "then": "challenge"},
                    ],
                    "default": "blocked"
                }
            },
            "count": {"$sum": 1}
        }}
    ]
    dist_raw = await db.sessions.aggregate(pipeline2).to_list(3)
    distribution = {d["_id"]: d["count"] for d in dist_raw}

    return {
        "platform_stats": {
            "total_blocked_naira": platform_blocked_naira,
            "total_sessions": real_total * platform_multiplier,
            "fraud_attempts_blocked": real_blocked * platform_multiplier,
            "payments_approved": real_approved * platform_multiplier,
            "active_users": 12847,
            "fraud_prevention_rate": round((real_blocked / max(real_total, 1)) * 100, 1),
        },
        "your_stats": {
            "sessions": real_total,
            "blocked": real_blocked,
            "approved": real_approved,
            "challenged": real_challenged,
            "amount_protected": total_blocked_naira,
        },
        "live_feed": feed,
        "distribution": distribution,
    }


# ── BEHAVIORAL DRIFT DETECTION ─────────────────────────────────────
@router.get("/drift")
async def get_drift_analysis(user: dict = Depends(get_current_user)):
    """
    Computes behavioral drift — how much the user's pattern has
    changed over time. Flags significant drift as an alert.
    """
    db = get_db()
    profile = await db.behavioral_profiles.find_one({"user_id": user["id"]})
    if not profile or len(profile.get("vectors", [])) < 4:
        return {"drift_detected": False, "drift_score": 0, "message": "Not enough data yet"}

    import numpy as np
    vectors = np.array(profile["vectors"], dtype=np.float32)

    # Compare first half vs second half
    mid = len(vectors) // 2
    early = vectors[:mid]
    recent = vectors[mid:]

    early_centroid = np.mean(early, axis=0)
    recent_centroid = np.mean(recent, axis=0)

    from scipy.spatial.distance import cosine
    drift = float(cosine(early_centroid, recent_centroid))
    drift_pct = round(drift * 100, 1)

    drift_level = "none"
    if drift_pct > 30:
        drift_level = "high"
    elif drift_pct > 15:
        drift_level = "medium"
    elif drift_pct > 8:
        drift_level = "low"

    alert = drift_level in ["medium", "high"]

    # Log alert if significant
    if alert:
        existing = await db.alerts.find_one({
            "user_id": user["id"],
            "type": "drift",
            "resolved": False
        })
        if not existing:
            await db.alerts.insert_one({
                "user_id": user["id"],
                "type": "drift",
                "drift_score": drift_pct,
                "drift_level": drift_level,
                "message": f"Your behavioral pattern has shifted {drift_pct}% from your baseline.",
                "action": "refresh_profile",
                "resolved": False,
                "created_at": datetime.utcnow(),
            })

    return {
        "drift_detected": alert,
        "drift_score": drift_pct,
        "drift_level": drift_level,
        "sessions_analyzed": len(vectors),
        "message": (
            f"Your behavioral pattern has shifted {drift_pct}% from your baseline."
            if alert else
            f"Your behavioral pattern is stable. Drift: {drift_pct}%"
        ),
        "recommendation": "Refresh your behavioral profile" if alert else None,
    }


# ── ALERTS ─────────────────────────────────────────────────────────
@router.get("/alerts")
async def get_alerts(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.alerts.find(
        {"user_id": user["id"]},
        sort=[("created_at", -1)]
    ).limit(20)
    alerts = []
    async for a in cursor:
        a["id"] = str(a.pop("_id"))
        alerts.append(a)
    return alerts


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    await db.alerts.update_one(
        {"_id": ObjectId(alert_id), "user_id": user["id"]},
        {"$set": {"resolved": True, "resolved_at": datetime.utcnow()}}
    )
    return {"status": "resolved"}


# ── BEHAVIORAL CREDIT SCORE ────────────────────────────────────────
@router.get("/credit-score")
async def get_credit_score(user: dict = Depends(get_current_user)):
    """
    Computes a TrustScore (0–1000) based on:
    - Payment consistency (40%)
    - Behavioral score average (30%)
    - Profile maturity (20%)
    - Zero fraud attempts (10%)
    """
    db = get_db()

    total = await db.sessions.count_documents({"user_id": user["id"]})
    approved = await db.sessions.count_documents({
        "user_id": user["id"],
        "decision": {"$in": ["APPROVED", "COMPLETE"]}
    })
    blocked = await db.sessions.count_documents({
        "user_id": user["id"], "decision": "BLOCKED"
    })

    profile = await db.behavioral_profiles.find_one({"user_id": user["id"]})
    vectors_count = len(profile.get("vectors", [])) if profile else 0

    # Avg behavioral score
    pipeline = [
        {"$match": {"user_id": user["id"], "behavioral_score": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$behavioral_score"}}}
    ]
    avg_result = await db.sessions.aggregate(pipeline).to_list(1)
    avg_score = avg_result[0]["avg"] if avg_result else 0

    if total == 0:
        return {
            "trust_score": 0,
            "grade": "N/A",
            "breakdown": {},
            "message": "Make your first payment to start building your TrustScore",
            "perks": []
        }

    # Component scores
    consistency = (approved / max(total, 1)) * 100          # 0-100
    behavior_avg = avg_score                                   # 0-100
    maturity = min(100, (vectors_count / 50) * 100)           # 0-100
    fraud_free = max(0, 100 - (blocked * 20))                 # loses 20pts per block

    # Weighted TrustScore (0-1000)
    raw = (
        consistency * 0.40 +
        behavior_avg * 0.30 +
        maturity * 0.20 +
        fraud_free * 0.10
    )
    trust_score = round(raw * 10)  # scale to 0-1000

    # Grade
    if trust_score >= 850:
        grade, color = "AAA", "#22C55E"
    elif trust_score >= 700:
        grade, color = "AA", "#86EFAC"
    elif trust_score >= 550:
        grade, color = "A", "#F59E0B"
    elif trust_score >= 400:
        grade, color = "BBB", "#FB923C"
    else:
        grade, color = "B", "#EF4444"

    # Perks unlocked
    perks = []
    if trust_score >= 400:
        perks.append("Instant transfers up to ₦50,000")
    if trust_score >= 550:
        perks.append("Higher daily limit (₦500,000)")
    if trust_score >= 700:
        perks.append("Challenge zone threshold lowered to 45")
    if trust_score >= 850:
        perks.append("Trusted user — skip challenge zone entirely")
        perks.append("Priority fraud support")

    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"trust_score": trust_score, "trust_grade": grade}}
    )

    return {
        "trust_score": trust_score,
        "grade": grade,
        "color": color,
        "breakdown": {
            "consistency": round(consistency, 1),
            "behavior_average": round(behavior_avg, 1),
            "profile_maturity": round(maturity, 1),
            "fraud_free_score": round(fraud_free, 1),
        },
        "total_sessions": total,
        "perks": perks,
        "message": f"Your TrustScore is {trust_score}/1000 — Grade {grade}",
    }


# ── PROFILE REFRESH (re-enrollment) ───────────────────────────────
@router.post("/refresh-profile")
async def refresh_profile(user: dict = Depends(get_current_user)):
    """
    Resets the behavioral profile to trigger re-enrollment.
    User keeps their history but starts fresh profile vectors.
    """
    db = get_db()
    await db.behavioral_profiles.update_one(
        {"user_id": user["id"]},
        {"$set": {
            "vectors": [],
            "enrollment_sessions": 0,
            "is_enrolled": False,
            "refreshed_at": datetime.utcnow(),
        }}
    )
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"is_enrolled": False, "enrollment_sessions": 0}}
    )
    await db.alerts.update_many(
        {"user_id": user["id"], "type": "drift"},
        {"$set": {"resolved": True}}
    )
    return {"status": "ok", "message": "Profile reset. Complete 3 training sessions to re-enroll."}
