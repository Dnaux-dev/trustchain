"""
biometric_engine.py
Two-stage behavioral scoring:
  Stage 1 — Isolation Forest  (population anomaly detection)  weight: 35%
  Stage 2 — Cosine Similarity (user-specific profile match)   weight: 65%
"""
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest
from scipy.spatial.distance import cosine
from typing import Optional

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../ml/models/isolation_forest.pkl")

# ── Singleton model ────────────────────────────────────────────────
_model: Optional[IsolationForest] = None


def get_model() -> IsolationForest:
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            _model = joblib.load(MODEL_PATH)
        else:
            # Bootstrap with a default untrained model
            # It will be replaced once enough data accumulates
            _model = _build_default_model()
    return _model


def _build_default_model() -> IsolationForest:
    """
    Creates and saves a default model with synthetic baseline data.
    This represents "typical" human mobile interaction patterns.
    In production this would be retrained nightly on real session data.
    """
    rng = np.random.RandomState(42)

    # Simulate 500 realistic human sessions (24 features each)
    # Feature ranges are based on typical mobile interaction studies
    synthetic = np.column_stack([
        rng.normal(85,  20,  500),   # S1: avg hold time
        rng.normal(25,  10,  500),   # S1: std hold time
        rng.normal(82,  18,  500),   # S1: median hold
        rng.normal(62,  12,  500),   # S1: p25 hold
        rng.normal(108, 22,  500),   # S1: p75 hold
        rng.normal(0.35, 0.1, 500),  # S2: avg force
        rng.normal(0.06, 0.02,500),  # S2: std force
        rng.normal(11,   3,  500),   # S2: avg radius
        rng.normal(2.2,  0.8,500),   # S2: std radius
        rng.normal(0.6,  0.3,500),   # S3: avg velocity
        rng.normal(1.2,  0.5,500),   # S3: max velocity
        rng.normal(0.25, 0.1,500),   # S3: std velocity
        rng.normal(5,    8,  500),   # S4: avg beta
        rng.normal(3,    2,  500),   # S4: std beta
        rng.normal(-2,   6,  500),   # S4: avg gamma
        rng.normal(2.5,  1.5,500),   # S4: std gamma
        rng.normal(3200, 800,500),   # S5: avg field duration
        rng.normal(600,  200,500),   # S5: std field duration
        rng.choice([0, 1], 500, p=[0.85, 0.15]).astype(float),  # S5: paste
        rng.normal(18,   5,  500),   # S5: total keys
        rng.normal(5.5,  2,  500),   # S6: avg offset x
        rng.normal(2,    0.8,500),   # S6: std offset x
        rng.normal(5.5,  2,  500),   # S6: avg offset y
        rng.normal(2,    0.8,500),   # S6: std offset y
    ]).astype(np.float32)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(synthetic)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    return model


def retrain_model(all_vectors: list[list[float]]):
    """Call this periodically (e.g. nightly) with accumulated session vectors."""
    global _model
    data = np.array(all_vectors, dtype=np.float32)
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(data)
    joblib.dump(model, MODEL_PATH)
    _model = model
    return len(data)


# ── Core scoring ───────────────────────────────────────────────────
def score_session(
    live_vector: np.ndarray,
    user_profile: dict,
) -> dict:
    """
    Returns a dict:
      behavioral_score      — final combined score 0–100
      stage1_score          — Isolation Forest score 0–100
      stage2_score          — Cosine Similarity score 0–100 (None if no profile)
      profile_confidence    — how mature/reliable is the profile (0–1)
      sessions_in_profile   — number of past sessions used
      is_enrollment         — True if this is still an enrollment session
    """
    model = get_model()

    # ── Stage 1: Population-level anomaly ─────────────────────────
    iso_raw = model.score_samples([live_vector])[0]
    # score_samples returns negative values: closer to 0 = more normal
    # typical range: -0.6 (anomalous) to -0.05 (very normal)
    # Map to 0–100: -0.6 → 0, -0.05 → 100
    iso_normalized = float(np.clip((iso_raw + 0.6) / 0.55 * 100, 0, 100))

    stored_vectors = user_profile.get("vectors", [])
    sessions_in_profile = len(stored_vectors)
    is_enrollment = sessions_in_profile < 3  # needs 3 sessions to build baseline

    # ── Stage 2: User-specific profile match ──────────────────────
    if not stored_vectors:
        # No profile yet — enrollment session, rely on Stage 1 only
        return {
            "behavioral_score": round(iso_normalized * 0.8, 1),  # conservative
            "stage1_score": round(iso_normalized, 1),
            "stage2_score": None,
            "profile_confidence": 0.0,
            "sessions_in_profile": 0,
            "is_enrollment": True,
        }

    # Build centroid of stored vectors (mean of last 20)
    recent = np.array(stored_vectors[-20:], dtype=np.float32)
    centroid = np.mean(recent, axis=0)

    # Per-feature std — computed once, reused for normalization and variance penalty
    feature_stds = np.std(recent, axis=0)

    # Per-feature normalization before cosine similarity.
    # Divides each dimension by the profile's own per-feature std so that
    # all 24 features contribute equally regardless of their absolute scale.
    # Without this, high-magnitude features (e.g. field duration ~3200 ms)
    # dominate the L2 norm and effectively reduce cosine to a single-feature
    # comparison.
    # Floor at 1e-3: activates only for genuinely constant dimensions
    # (real-variance features have std >> 1e-3). When all stds are zero
    # (single stored vector), every dimension is floored equally and the
    # cosine result is identical to the unnormalized case.
    feature_scales = np.maximum(feature_stds, 1e-3)
    centroid_norm = centroid / feature_scales
    live_norm = live_vector / feature_scales

    # Cosine similarity on scale-normalized vectors: 1.0 = identical direction
    similarity = float(np.clip(1 - cosine(live_norm, centroid_norm), 0, 1))
    profile_score = similarity * 100

    # Profile confidence grows with more sessions, stabilises at 20+
    confidence = float(np.clip(sessions_in_profile / 20, 0, 1))

    # Variance of stored profile — high variance = uncertain baseline
    # Reuses feature_stds already computed above
    variance_penalty = float(np.mean(feature_stds)) / 50
    variance_penalty = np.clip(variance_penalty, 0, 0.3)

    # ── Weighted combination ───────────────────────────────────────
    # Stage 2 weight grows as profile matures
    s2_weight = 0.35 + (0.30 * confidence)   # 0.35 → 0.65 as profile matures
    s1_weight = 1.0 - s2_weight

    combined = (iso_normalized * s1_weight) + (profile_score * s2_weight)
    combined = float(np.clip(combined - (variance_penalty * 10), 0, 100))

    return {
        "behavioral_score": round(combined, 1),
        "stage1_score": round(iso_normalized, 1),
        "stage2_score": round(profile_score, 1),
        "profile_confidence": round(confidence, 2),
        "sessions_in_profile": sessions_in_profile,
        "is_enrollment": is_enrollment,
    }


def classify_decision(behavioral_score: float) -> str:
    """
    Three-tier decision:
      70–100  → APPROVED
      50–69   → CHALLENGE  (behavioral re-challenge, no OTP)
      0–49    → BLOCKED
    """
    if behavioral_score >= 70:
        return "APPROVED"
    elif behavioral_score >= 50:
        return "CHALLENGE"
    else:
        return "BLOCKED"
