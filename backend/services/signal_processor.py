"""
signal_processor.py
Accepts pre-extracted features from TrustChain.js SDK.
If client sent extractedFeatures, uses them directly.
Falls back to server-side extraction if not present.
Raw signals are never stored — only the 24-feature vector.
"""
import numpy as np
from typing import Dict, Any


def extract_feature_vector(signals: Dict[str, Any]) -> np.ndarray:
    """
    If the client sent pre-extracted features, use them directly.
    This means feature extraction happened in the browser —
    raw keystrokes never traveled over the network.
    Falls back to server-side extraction for compatibility.
    """
    # ── Use client-side features if available ────────────────────
    client_features = signals.get("extractedFeatures")
    if client_features and len(client_features) == 24:
        return np.array(client_features, dtype=np.float32)

    # ── Fallback: server-side extraction ─────────────────────────
    features = []

    # S1: Keystroke dynamics (5)
    keystrokes = signals.get("keystrokes", [])
    holds = [
        k["holdDuration"] for k in keystrokes
        if k.get("holdDuration") and 0 < k["holdDuration"] < 2000
    ]
    if len(holds) >= 2:
        features += [
            float(np.mean(holds)),
            float(np.std(holds)),
            float(np.median(holds)),
            float(np.percentile(holds, 25)),
            float(np.percentile(holds, 75)),
        ]
    else:
        features += [80.0, 20.0, 80.0, 60.0, 100.0]

    # S2: Touch pressure (4)
    touches = signals.get("touchEvents", [])
    forces  = [t.get("force", 0) for t in touches if t.get("force", 0) > 0]
    radii   = [(t.get("radiusX", 0) + t.get("radiusY", 0)) / 2 for t in touches if t.get("radiusX", 0) > 0]
    features += [
        float(np.mean(forces))  if forces else 0.3,
        float(np.std(forces))   if len(forces) >= 2 else 0.05,
        float(np.mean(radii))   if radii  else 10.0,
        float(np.std(radii))    if len(radii) >= 2 else 2.0,
    ]

    # S3: Swipe velocity (3)
    swipes = signals.get("swipeEvents", [])
    vels   = [abs(s.get("velocityY", 0)) for s in swipes if s.get("velocityY", 0) != 0]
    features += [
        float(np.mean(vels)) if vels else 0.5,
        float(np.max(vels))  if vels else 1.0,
        float(np.std(vels))  if len(vels) >= 2 else 0.2,
    ]

    # S4: Device orientation (4)
    motion = signals.get("deviceMotion", [])
    betas  = [m.get("beta",  0) for m in motion if m.get("beta")  is not None]
    gammas = [m.get("gamma", 0) for m in motion if m.get("gamma") is not None]
    features += [
        float(np.mean(betas))  if betas  else 0.0,
        float(np.std(betas))   if len(betas)  >= 2 else 0.5,
        float(np.mean(gammas)) if gammas else 0.0,
        float(np.std(gammas))  if len(gammas) >= 2 else 0.5,
    ]

    # S5: Form timing (4)
    timings = signals.get("fieldTimings", {})
    durs    = []
    pastes  = 0
    keys    = 0
    for f in timings.values():
        if f.get("focusTime") and f.get("blurTime") and f["blurTime"] > f["focusTime"]:
            durs.append(f["blurTime"] - f["focusTime"])
        if f.get("pasteDetected"): pastes += 1
        keys += f.get("keyCount", 0)
    features += [
        float(np.mean(durs)) if durs else 3000.0,
        float(np.std(durs))  if len(durs) >= 2 else 500.0,
        float(pastes),
        float(keys),
    ]

    # S6: Tap accuracy (4)
    taps = signals.get("tapOffsets", [])
    ox   = [abs(t.get("offsetX", 0)) for t in taps]
    oy   = [abs(t.get("offsetY", 0)) for t in taps]
    features += [
        float(np.mean(ox)) if ox else 5.0,
        float(np.std(ox))  if len(ox) >= 2 else 2.0,
        float(np.mean(oy)) if oy else 5.0,
        float(np.std(oy))  if len(oy) >= 2 else 2.0,
    ]

    vector = np.array(features, dtype=np.float32)
    assert len(vector) == 24
    return vector


def signals_quality_score(signals: Dict[str, Any]) -> float:
    """Returns 0.0–1.0 signal richness. Uses client quality if sent."""
    # If SDK sent quality score directly, trust it
    client_quality = signals.get("quality")
    if client_quality is not None:
        return float(client_quality)

    score = 0.0
    weights    = {"keystrokes": 0.30, "touchEvents": 0.25, "swipeEvents": 0.15, "deviceMotion": 0.15, "tapOffsets": 0.15}
    thresholds = {"keystrokes": 5,    "touchEvents": 3,    "swipeEvents": 2,    "deviceMotion": 10,   "tapOffsets": 2}
    for key, weight in weights.items():
        count = len(signals.get(key, []))
        score += weight * min(1.0, count / thresholds[key])
    return round(score, 3)