import os
from motor.motor_asyncio import AsyncIOMotorClient

_client = None
_db = None


def get_db():
    global _client, _db

    if _db is not None:
        return _db

    mongo_url = os.getenv("MONGODB_URL", "")
    db_name = os.getenv("DATABASE_NAME", "trustchain")

    if not mongo_url:
        raise RuntimeError(
            "MONGODB_URL is not set. "
            "Go to Render → Environment → Add MONGODB_URL"
        )

    _client = AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
        maxPoolSize=10,
    )
    _db = _client[db_name]
    return _db
