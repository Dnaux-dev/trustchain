"""
test_signal_processor.py
Unit tests for the signal extraction pipeline.
Run: pytest tests/ -v
"""
import numpy as np
import pytest
from services.signal_processor import extract_feature_vector, signals_quality_score


# ── Fixtures ───────────────────────────────────────────────────────

def make_rich_signals():
    """Realistic signal blob simulating a user filling a payment form."""
    return {
        "keystrokes": [
            {"key": "char", "downTime": 1000 + i * 150, "holdDuration": 80 + (i % 5) * 10}
            for i in range(10)
        ],
        "touchEvents": [
            {"force": 0.3 + i * 0.02, "radiusX": 10 + i, "radiusY": 11 + i, "timestamp": 1000 + i * 200}
            for i in range(5)
        ],
        "swipeEvents": [
            {"deltaY": 30.0, "velocityY": 0.6, "timestamp": 1500},
            {"deltaY": 50.0, "velocityY": 0.9, "timestamp": 2000},
            {"deltaY": 20.0, "velocityY": 0.4, "timestamp": 2500},
        ],
        "deviceMotion": [
            {"alpha": 0.0, "beta": 5.0 + i * 0.5, "gamma": -2.0 + i * 0.3, "timestamp": 1000 + i * 100}
            for i in range(15)
        ],
        "fieldTimings": {
            "amount": {"focusTime": 1000, "blurTime": 3500, "keyCount": 5, "pasteDetected": False},
            "account_number": {"focusTime": 4000, "blurTime": 6000, "keyCount": 10, "pasteDetected": False},
        },
        "tapOffsets": [
            {"targetId": "btn", "offsetX": 3.0, "offsetY": 2.0, "timestamp": 6500},
            {"targetId": "btn", "offsetX": -4.0, "offsetY": 1.5, "timestamp": 7000},
        ],
    }


def make_empty_signals():
    """Completely empty signal blob — no events at all."""
    return {
        "keystrokes": [],
        "touchEvents": [],
        "swipeEvents": [],
        "deviceMotion": [],
        "fieldTimings": {},
        "tapOffsets": [],
    }


def make_paste_signals():
    """Signal blob where user pasted values — suspicious pattern."""
    return {
        **make_empty_signals(),
        "fieldTimings": {
            "amount": {"focusTime": 100, "blurTime": 200, "keyCount": 0, "pasteDetected": True},
            "account": {"focusTime": 300, "blurTime": 350, "keyCount": 0, "pasteDetected": True},
        },
    }


# ── extract_feature_vector tests ───────────────────────────────────

class TestExtractFeatureVector:
    def test_returns_27_features_rich(self):
        signals = make_rich_signals()
        vec = extract_feature_vector(signals)
        assert vec.shape == (27,), f"Expected shape (27,), got {vec.shape}"
        assert vec.dtype == np.float32

    def test_returns_27_features_empty(self):
        """Empty signals must still produce a valid 27-length vector (defaults)."""
        signals = make_empty_signals()
        vec = extract_feature_vector(signals)
        assert vec.shape == (27,)
        assert vec.dtype == np.float32

    def test_no_nan_or_inf_rich(self):
        vec = extract_feature_vector(make_rich_signals())
        assert not np.isnan(vec).any(), "Vector contains NaN"
        assert not np.isinf(vec).any(), "Vector contains Inf"

    def test_no_nan_or_inf_empty(self):
        vec = extract_feature_vector(make_empty_signals())
        assert not np.isnan(vec).any(), "Empty-signal vector contains NaN"
        assert not np.isinf(vec).any(), "Empty-signal vector contains Inf"

    def test_keystroke_defaults_when_sparse(self):
        """With 0 keystrokes, the first 5 features should be the sensible defaults."""
        signals = make_empty_signals()
        vec = extract_feature_vector(signals)
        # S1 defaults: [80.0, 20.0, 80.0, 60.0, 100.0]
        assert vec[0] == pytest.approx(80.0)
        assert vec[1] == pytest.approx(20.0)
        assert vec[4] == pytest.approx(100.0)

    def test_paste_detected_feature(self):
        """paste_count feature (index 21) should be > 0 when paste happened."""
        vec = extract_feature_vector(make_paste_signals())
        assert vec[21] > 0, "Paste count not captured in feature 21"

    def test_rich_signals_vary_from_empty(self):
        """Rich and empty signal vectors should differ meaningfully."""
        v_rich = extract_feature_vector(make_rich_signals())
        v_empty = extract_feature_vector(make_empty_signals())
        # At least some features should differ
        assert not np.allclose(v_rich, v_empty, atol=1.0), (
            "Rich and empty signals produced nearly identical vectors"
        )

    def test_single_keystroke_no_crash(self):
        """Single keystroke should not raise — uses defaults for stats needing ≥2."""
        signals = {
            **make_empty_signals(),
            "keystrokes": [{"key": "char", "downTime": 1000, "holdDuration": 90}],
        }
        vec = extract_feature_vector(signals)
        assert vec.shape == (27,)


# ── signals_quality_score tests ────────────────────────────────────

class TestSignalsQualityScore:
    def test_perfect_quality_rich(self):
        """Well-populated signals should score close to 1.0."""
        q = signals_quality_score(make_rich_signals())
        assert 0.7 <= q <= 1.0, f"Expected high quality, got {q}"

    def test_zero_quality_empty(self):
        """Empty signals should return 0.0."""
        q = signals_quality_score(make_empty_signals())
        assert q == 0.0

    def test_quality_bounded(self):
        """Quality score must always be in [0, 1]."""
        for signals in [make_rich_signals(), make_empty_signals(), make_paste_signals()]:
            q = signals_quality_score(signals)
            assert 0.0 <= q <= 1.0, f"Quality {q} out of range"

    def test_partial_signals_intermediate_quality(self):
        """Signals with only keystrokes should be between 0 and 1."""
        signals = {
            **make_empty_signals(),
            "keystrokes": [{"key": "char", "downTime": i * 100, "holdDuration": 80} for i in range(5)],
        }
        q = signals_quality_score(signals)
        assert 0.0 < q < 1.0
