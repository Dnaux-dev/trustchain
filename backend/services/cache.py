"""
cache.py
Async Redis client for behavioral profile hot-caching.
Reduces MongoDB reads on the critical payment scoring path.

Cache is purely additive — all reads fall back to MongoDB on miss/error.
Cache failure is non-fatal; the app degrades gracefully without Redis.
"""
import json
from datetime import datetime
from typing import Optional

import redis.asyncio as aioredis
from bson import ObjectId

from config import settings

_redis: Optional[aioredis.Redis] = None

PROFILE_TTL = 300  # seconds — safety ceiling; writes invalidate immediately
PROFILE_KEY_PREFIX = "profile:"
HELPER_PROFILE_KEY_PREFIX = "helper_profile:"


# ── Serialization ─────────────────────────────────────────────────

def _json_serial(obj):
    """Custom JSON encoder for MongoDB types."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, ObjectId):
        return str(obj)
    raise TypeError(f"Type {type(obj)} not JSON serializable")


# ── Lifecycle ─────────────────────────────────────────────────────

async def connect_cache():
    """
    Open async Redis connection.
    Logs a warning and continues if Redis is unavailable — cache is optional.
    """
    global _redis
    try:
        _redis = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=2,
        )
        await _redis.ping()
        print("✅ Connected to Redis cache")
    except Exception as e:
        _redis = None
        print(f"⚠️  Redis unavailable — running without cache: {e}")


async def close_cache():
    global _redis
    if _redis:
        await _redis.aclose()
        _redis = None
        print("Redis connection closed")


# ── Owner profile cache ───────────────────────────────────────────

async def get_cached_profile(user_id: str) -> Optional[dict]:
    """Return cached behavioral profile dict or None on miss/error."""
    if not _redis:
        return None
    try:
        raw = await _redis.get(f"{PROFILE_KEY_PREFIX}{user_id}")
        if raw:
            return json.loads(raw)
    except Exception:
        pass
    return None


async def set_cached_profile(user_id: str, profile: dict):
    """Serialize and cache profile with TTL. Failure is silently ignored."""
    if not _redis:
        return
    try:
        serialized = json.dumps(profile, default=_json_serial)
        await _redis.setex(f"{PROFILE_KEY_PREFIX}{user_id}", PROFILE_TTL, serialized)
    except Exception:
        pass


async def invalidate_profile(user_id: str):
    """Remove cached profile after a write. Failure is silently ignored."""
    if not _redis:
        return
    try:
        await _redis.delete(f"{PROFILE_KEY_PREFIX}{user_id}")
    except Exception:
        pass


# ── Helper profile cache ──────────────────────────────────────────

async def get_cached_helper_profile(user_id: str, helper_id: str) -> Optional[dict]:
    """Return cached helper profile dict or None on miss/error."""
    if not _redis:
        return None
    try:
        raw = await _redis.get(f"{HELPER_PROFILE_KEY_PREFIX}{user_id}:{helper_id}")
        if raw:
            return json.loads(raw)
    except Exception:
        pass
    return None


async def set_cached_helper_profile(user_id: str, helper_id: str, profile: dict):
    """Serialize and cache helper profile with TTL. Failure is silently ignored."""
    if not _redis:
        return
    try:
        serialized = json.dumps(profile, default=_json_serial)
        await _redis.setex(
            f"{HELPER_PROFILE_KEY_PREFIX}{user_id}:{helper_id}",
            PROFILE_TTL,
            serialized,
        )
    except Exception:
        pass


async def invalidate_helper_profile(user_id: str, helper_id: str):
    """Remove cached helper profile after a write. Failure is silently ignored."""
    if not _redis:
        return
    try:
        await _redis.delete(f"{HELPER_PROFILE_KEY_PREFIX}{user_id}:{helper_id}")
    except Exception:
        pass
