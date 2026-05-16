"""
retrain_worker.py
Nightly model retraining job.
Pulls all behavioral vectors from MongoDB and retrains
the Isolation Forest on real Nigerian session data.

Schedule with Redis RQ or run directly:
  python retrain_worker.py

Or add to cron:
  0 23 * * * cd /path/to/backend && python retrain_worker.py
"""
import asyncio
import numpy as np
import joblib
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from sklearn.ensemble import IsolationForest
from config import settings

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml/models/isolation_forest.pkl')
LOG_PATH   = os.path.join(os.path.dirname(__file__), 'ml/retrain_log.json')


async def collect_all_vectors() -> list:
    """Pull all behavioral vectors from all enrolled user profiles."""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    all_vectors = []
    cursor = db.behavioral_profiles.find(
        {"is_enrolled": True, "vectors": {"$exists": True, "$ne": []}},
        {"vectors": 1}
    )
    async for profile in cursor:
        for vec in profile.get("vectors", []):
            if len(vec) == 24:
                all_vectors.append(vec)

    # Also include helper profiles
    cursor2 = db.helper_profiles.find(
        {"is_enrolled": True},
        {"vectors": 1}
    )
    async for profile in cursor2:
        for vec in profile.get("vectors", []):
            if len(vec) == 24:
                all_vectors.append(vec)

    client.close()
    return all_vectors


def retrain(vectors: list) -> dict:
    """Retrain Isolation Forest on real data and save model."""
    if len(vectors) < 50:
        return {"status": "skipped", "reason": f"Only {len(vectors)} vectors — need 50+ for reliable retraining", "vectors": len(vectors)}

    data = np.array(vectors, dtype=np.float32)

    # Fit new model
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,   # ~5% of sessions expected to be anomalous
        random_state=42,
        n_jobs=-1,
        max_samples='auto',
    )
    model.fit(data)

    # Validate — score samples on training data
    scores = model.score_samples(data)
    mean_score = float(np.mean(scores))
    std_score  = float(np.std(scores))

    # Save model
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return {
        "status": "success",
        "vectors_used": len(vectors),
        "mean_anomaly_score": round(mean_score, 4),
        "std_anomaly_score": round(std_score, 4),
        "model_path": MODEL_PATH,
        "retrained_at": datetime.utcnow().isoformat(),
    }


async def save_log(result: dict):
    """Append retraining result to log file."""
    import json
    logs = []
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH) as f:
            try:
                logs = json.load(f)
            except Exception:
                logs = []
    logs.append(result)
    logs = logs[-30:]  # keep last 30 entries
    with open(LOG_PATH, 'w') as f:
        json.dump(logs, f, indent=2)


async def run():
    print(f"[{datetime.utcnow().isoformat()}] TrustChain Model Retraining started...")

    # Step 1: Collect vectors
    print("  → Collecting behavioral vectors from MongoDB...")
    vectors = await collect_all_vectors()
    print(f"  → Found {len(vectors)} vectors from real sessions")

    # Step 2: Retrain
    print("  → Retraining Isolation Forest...")
    result = retrain(vectors)
    print(f"  → Result: {result['status']}")
    if result['status'] == 'success':
        print(f"     Vectors used: {result['vectors_used']}")
        print(f"     Mean anomaly score: {result['mean_anomaly_score']}")
        print(f"     Model saved to: {result['model_path']}")

    # Step 3: Log
    await save_log(result)
    print(f"  → Log saved")
    print(f"[{datetime.utcnow().isoformat()}] Retraining complete.\n")
    return result


# ── RQ task (for Redis Queue scheduling) ────────────────────────
def retrain_task():
    """Called by Redis RQ worker."""
    return asyncio.run(run())


# ── Direct execution ────────────────────────────────────────────
if __name__ == '__main__':
    asyncio.run(run())
