"""
test_biometric_engine.py
Unit tests for the two-stage behavioral scoring engine.
Run: pytest tests/ -v
"""
import numpy as np
import pytest
from services.biometric_engine import score_session, classify_decision, get_model


# ── Fixtures ───────────────────────────────────────────────────────

def make_vector(seed=None) -> np.ndarray:
    """Create a realistic 24-feature test vector."""
    rng = np.random.RandomState(seed or 42)
    return np.array([
        85.0, 25.0, 82.0, 62.0, 108.0,    # S1: keystroke dynamics
        0.35, 0.06, 11.0, 2.2,             # S2: touch pressure
        0.6, 1.2, 0.25,                    # S3: swipe velocity
        5.0, 3.0, -2.0, 2.5,               # S4: device orientation
        3200.0, 600.0, 0.0, 18.0,          # S5: form timing
        5.5, 2.0, 5.5, 2.0,               # S6: tap accuracy
    ], dtype=np.float32)


def make_anomalous_vector() -> np.ndarray:
    """An obviously anomalous vector — all extreme outlier values."""
    return np.array([
        500.0, 400.0, 490.0, 350.0, 600.0,  # S1: absurd hold times
        5.0, 3.0, 100.0, 50.0,              # S2: extreme touch force
        20.0, 50.0, 15.0,                   # S3: extreme swipe
        90.0, 45.0, 80.0, 40.0,            # S4: extreme tilt
        50000.0, 30000.0, 10.0, 200.0,     # S5: absurd field time
        200.0, 100.0, 200.0, 100.0,        # S6: wildly off-center taps
    ], dtype=np.float32)


def empty_profile() -> dict:
    return {"vectors": [], "enrollment_sessions": 0, "is_enrolled": False}


def sparse_profile(n=2) -> dict:
    """Profile with n sessions — still in enrollment mode."""
    vecs = [make_vector(seed=i).tolist() for i in range(n)]
    return {"vectors": vecs, "enrollment_sessions": n, "is_enrolled": False}


def mature_profile(n=20) -> dict:
    """Full mature profile with many consistent sessions."""
    vecs = [make_vector(seed=i).tolist() for i in range(n)]
    return {"vectors": vecs, "enrollment_sessions": n, "is_enrolled": True}


# ── get_model tests ────────────────────────────────────────────────

class TestGetModel:
    def test_returns_isolation_forest(self):
        from sklearn.ensemble import IsolationForest
        model = get_model()
        assert isinstance(model, IsolationForest)

    def test_model_fitted(self):
        """Model must be already fitted (has estimators_)."""
        model = get_model()
        assert hasattr(model, "estimators_"), "Model not fitted"


# ── classify_decision tests ────────────────────────────────────────

class TestClassifyDecision:
    @pytest.mark.parametrize("score,expected", [
        (100.0, "APPROVED"),
        (70.0,  "APPROVED"),
        (69.9,  "CHALLENGE"),
        (50.0,  "CHALLENGE"),
        (49.9,  "BLOCKED"),
        (0.0,   "BLOCKED"),
    ])
    def test_thresholds(self, score, expected):
        assert classify_decision(score) == expected

    def test_boundary_70_is_approved(self):
        assert classify_decision(70.0) == "APPROVED"

    def test_boundary_50_is_challenge(self):
        assert classify_decision(50.0) == "CHALLENGE"


# ── score_session tests ────────────────────────────────────────────

class TestScoreSession:
    def test_empty_profile_returns_enrollment_flag(self):
        result = score_session(make_vector(), empty_profile())
        assert result["is_enrollment"] is True
        assert result["sessions_in_profile"] == 0
        assert result["stage2_score"] is None

    def test_sparse_profile_is_enrollment(self):
        result = score_session(make_vector(), sparse_profile(n=2))
        assert result["is_enrollment"] is True

    def test_3_sessions_exits_enrollment(self):
        result = score_session(make_vector(), sparse_profile(n=3))
        assert result["is_enrollment"] is False

    def test_score_in_valid_range(self):
        for profile in [empty_profile(), sparse_profile(), mature_profile()]:
            result = score_session(make_vector(), profile)
            assert 0.0 <= result["behavioral_score"] <= 100.0, (
                f"Score out of range: {result['behavioral_score']}"
            )

    def test_stage1_score_in_valid_range(self):
        result = score_session(make_vector(), empty_profile())
        assert 0.0 <= result["stage1_score"] <= 100.0

    def test_consistent_vector_scores_high_on_mature_profile(self):
        """
        A vector very close to the profile centroid should score high
        on a mature profile (stage 2 cosine similarity should be near 1.0).
        """
        profile = mature_profile(20)
        # Use the exact same vector that built the profile
        same_vector = make_vector(seed=0)
        result = score_session(same_vector, profile)
        assert result["behavioral_score"] >= 60.0, (
            f"Expected high score for consistent vector, got {result['behavioral_score']}"
        )

    def test_anomalous_vector_scores_lower_than_normal(self):
        """
        An extreme outlier vector should score lower than a normal one.
        """
        profile = mature_profile(20)
        normal_result = score_session(make_vector(), profile)
        anomalous_result = score_session(make_anomalous_vector(), profile)
        assert anomalous_result["behavioral_score"] < normal_result["behavioral_score"], (
            f"Anomalous vector scored {anomalous_result['behavioral_score']} "
            f"vs normal {normal_result['behavioral_score']}"
        )

    def test_profile_confidence_grows_with_sessions(self):
        for n, expected_min in [(1, 0.0), (5, 0.2), (10, 0.4), (20, 0.9)]:
            result = score_session(make_vector(), mature_profile(n))
            assert result["profile_confidence"] >= expected_min, (
                f"Profile with {n} sessions: confidence {result['profile_confidence']} < {expected_min}"
            )

    def test_result_keys_present(self):
        result = score_session(make_vector(), mature_profile())
        required_keys = {
            "behavioral_score", "stage1_score", "stage2_score",
            "profile_confidence", "sessions_in_profile", "is_enrollment"
        }
        assert required_keys.issubset(result.keys())

    def test_empty_profile_score_conservative(self):
        """
        With no profile, score is stage1 * 0.8 (conservative multiplier).
        It must be strictly less than the raw stage1 score.
        """
        result = score_session(make_vector(), empty_profile())
        assert result["behavioral_score"] <= result["stage1_score"]
