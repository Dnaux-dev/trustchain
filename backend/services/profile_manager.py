"""
profile_manager.py
Handles user behavioral profile storage, enrollment,
trusted helper profiles, and continuous learning updates.
"""
from datetime import datetime
from typing import Optional
from bson import ObjectId
from database import get_db
from config import settings
from services.cache import (
    get_cached_profile, set_cached_profile, invalidate_profile,
    get_cached_helper_profile, set_cached_helper_profile, invalidate_helper_profile,
)


async def get_or_create_profile(user_id: str) -> dict:
    cached = await get_cached_profile(user_id)
    if cached:
        return cached

    db = get_db()
    profile = await db.behavioral_profiles.find_one({"user_id": user_id})
    if not profile:
        profile = {
            "user_id": user_id,
            "vectors": [],
            "enrollment_sessions": 0,
            "is_enrolled": False,
            "created_at": datetime.utcnow(),
            "last_updated": datetime.utcnow(),
        }
        await db.behavioral_profiles.insert_one(profile)

    await set_cached_profile(user_id, profile)
    return profile


async def get_helper_profile(user_id: str, helper_id: str) -> Optional[dict]:
    cached = await get_cached_helper_profile(user_id, helper_id)
    if cached:
        return cached

    db = get_db()
    profile = await db.helper_profiles.find_one({
        "user_id": user_id,
        "helper_id": helper_id,
    })
    if profile:
        await set_cached_helper_profile(user_id, helper_id, profile)
    return profile


async def update_profile(user_id: str, new_vector: list, is_helper: bool = False, helper_id: str = None):
    """
    Adds new session vector to the rolling profile window.
    Marks user as enrolled after ENROLLMENT_SESSIONS_REQUIRED sessions.
    """
    db = get_db()

    if is_helper and helper_id:
        collection = db.helper_profiles
        query = {"user_id": user_id, "helper_id": helper_id}
    else:
        collection = db.behavioral_profiles
        query = {"user_id": user_id}

    profile = await collection.find_one(query)
    if not profile:
        return

    vectors = profile.get("vectors", []) + [new_vector]

    # Rolling window — drop oldest beyond MAX
    max_vecs = settings.MAX_PROFILE_VECTORS
    if len(vectors) > max_vecs:
        vectors = vectors[-max_vecs:]

    enrollment_count = len(vectors)
    is_enrolled = enrollment_count >= settings.ENROLLMENT_SESSIONS_REQUIRED

    await collection.update_one(
        query,
        {"$set": {
            "vectors": vectors,
            "enrollment_sessions": enrollment_count,
            "is_enrolled": is_enrolled,
            "last_updated": datetime.utcnow(),
        }}
    )

    # Invalidate cache so next read fetches the updated profile from MongoDB
    if is_helper and helper_id:
        await invalidate_helper_profile(user_id, helper_id)
    else:
        await invalidate_profile(user_id)

    # Also update is_enrolled on user document
    if not is_helper:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "is_enrolled": is_enrolled,
                "enrollment_sessions": enrollment_count,
            }}
        )


async def add_trusted_helper(user_id: str, helper_data: dict) -> str:
    """
    Registers a new trusted helper under the account owner.
    Creates an empty behavioral profile for the helper.
    Returns the helper_id.
    """
    db = get_db()
    helper_id = str(ObjectId())

    helper_entry = {
        "helper_id": helper_id,
        "helper_name": helper_data["helper_name"],
        "helper_phone": helper_data["helper_phone"],
        "relationship": helper_data["relationship"],
        "is_enrolled": False,
        "enrollment_sessions": 0,
        "added_at": datetime.utcnow(),
    }

    # Add to user's trusted_helpers list
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"trusted_helpers": helper_entry}}
    )

    # Create empty behavioral profile for helper
    await db.helper_profiles.insert_one({
        "user_id": user_id,
        "helper_id": helper_id,
        "helper_name": helper_data["helper_name"],
        "vectors": [],
        "enrollment_sessions": 0,
        "is_enrolled": False,
        "created_at": datetime.utcnow(),
        "last_updated": datetime.utcnow(),
    })

    return helper_id


async def get_user_helpers(user_id: str) -> list:
    """Returns list of trusted helpers with their enrollment status."""
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return []
    helpers = user.get("trusted_helpers", [])
    # Enrich with live enrollment status from helper_profiles
    enriched = []
    for h in helpers:
        hp = await db.helper_profiles.find_one({
            "user_id": user_id,
            "helper_id": h["helper_id"]
        })
        enriched.append({
            **h,
            "is_enrolled": hp.get("is_enrolled", False) if hp else False,
            "enrollment_sessions": hp.get("enrollment_sessions", 0) if hp else 0,
        })
    return enriched
