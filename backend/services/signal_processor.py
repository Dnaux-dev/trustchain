"""
signal_processor.py
Converts raw TrustChain.js SDK signal blob into a fixed
24-dimensional numpy feature vector for ML model input.
"""
import numpy as np
from typing import Dict, Any


def extract_feature_vector(signals: Dict[str, Any]) -> np.ndarray:
    """
    Input:  raw signals dict from TrustChain.js SDK
    Output: numpy array of shape (27,) dtype float32

    Feature layout:
      [0:5]   Keystroke hold times    (5 features: avg/std/median/p25/p75)
      [5:8]   Inter-keystroke timing  (3 features: avg/std/median IKI)
      [8:12]  Touch pressure          (4 features)
      [12:15] Swipe velocity          (3 features)
      [15:19] Device orientation      (4 features)
      [19:23] Form field timing       (4 features)
      [23:27] Tap accuracy            (4 features)
    """
    features = []

    # ── S1: Keystroke Dynamics (5 features) ──────────────────────
    keystrokes = signals.get("keystrokes", [])
    hold_durations = [
        k["holdDuration"]
        for k in keystrokes
        if k.get("holdDuration") and k["holdDuration"] > 0
    ]

    if len(hold_durations) >= 2:
        features += [
            float(np.mean(hold_durations)),           # avg hold time (ms)
            float(np.std(hold_durations)),            # variance in hold time
            float(np.median(hold_durations)),         # median hold time
            float(np.percentile(hold_durations, 25)), # lower quartile
            float(np.percentile(hold_durations, 75)), # upper quartile
        ]
    else:
        features += [80.0, 20.0, 80.0, 60.0, 100.0]  # sensible defaults

    # Inter-key intervals (flight time between consecutive keystrokes)
    iki_values = []
    for i in range(1, len(keystrokes)):
        if keystrokes[i].get("downTime") and keystrokes[i - 1].get("downTime"):
            iki = keystrokes[i]["downTime"] - keystrokes[i - 1]["downTime"]
            if 0 < iki < 2000:  # ignore suspiciously long gaps
                iki_values.append(iki)

    # IKI features [5:8] — avg/std/median inter-keystroke interval (ms)
    # Typical human range: 100–400 ms; high std signals erratic/bot-like typing
    if len(iki_values) >= 2:
        features += [
            float(np.mean(iki_values)),    # avg IKI
            float(np.std(iki_values)),     # rhythm variability
            float(np.median(iki_values)),  # median IKI
        ]
    else:
        features += [180.0, 60.0, 160.0]  # sensible defaults

    # ── S2: Touch Pressure (4 features) ──────────────────────────
    touches = signals.get("touchEvents", [])
    forces = [t.get("force", 0) for t in touches if t.get("force", 0) > 0]
    radii = [
        (t.get("radiusX", 0) + t.get("radiusY", 0)) / 2
        for t in touches
        if t.get("radiusX", 0) > 0
    ]

    features += [
        float(np.mean(forces)) if forces else 0.3,
        float(np.std(forces)) if len(forces) >= 2 else 0.05,
        float(np.mean(radii)) if radii else 10.0,
        float(np.std(radii)) if len(radii) >= 2 else 2.0,
    ]

    # ── S3: Swipe Velocity (3 features) ──────────────────────────
    swipes = signals.get("swipeEvents", [])
    velocities = [abs(s.get("velocityY", 0)) for s in swipes if s.get("velocityY", 0) != 0]

    features += [
        float(np.mean(velocities)) if velocities else 0.5,
        float(np.max(velocities)) if velocities else 1.0,
        float(np.std(velocities)) if len(velocities) >= 2 else 0.2,
    ]

    # ── S4: Device Orientation / Gyroscope (4 features) ──────────
    motion = signals.get("deviceMotion", [])
    betas  = [m.get("beta",  0) for m in motion if m.get("beta")  is not None]
    gammas = [m.get("gamma", 0) for m in motion if m.get("gamma") is not None]

    features += [
        float(np.mean(betas))  if betas  else 0.0,
        float(np.std(betas))   if len(betas)  >= 2 else 0.5,
        float(np.mean(gammas)) if gammas else 0.0,
        float(np.std(gammas))  if len(gammas) >= 2 else 0.5,
    ]

    # ── S5: Form Field Timing (4 features) ───────────────────────
    timings = signals.get("fieldTimings", {})
    field_durations = []
    paste_count = 0
    total_keys = 0

    for field in timings.values():
        focus = field.get("focusTime")
        blur  = field.get("blurTime")
        if focus and blur and blur > focus:
            field_durations.append(blur - focus)
        if field.get("pasteDetected"):
            paste_count += 1
        total_keys += field.get("keyCount", 0)

    features += [
        float(np.mean(field_durations)) if field_durations else 3000.0,
        float(np.std(field_durations))  if len(field_durations) >= 2 else 500.0,
        float(paste_count),
        float(total_keys),
    ]

    # ── S6: Tap Accuracy (4 features) ────────────────────────────
    taps = signals.get("tapOffsets", [])
    offsets_x = [abs(t.get("offsetX", 0)) for t in taps]
    offsets_y = [abs(t.get("offsetY", 0)) for t in taps]

    features += [
        float(np.mean(offsets_x)) if offsets_x else 5.0,
        float(np.std(offsets_x))  if len(offsets_x) >= 2 else 2.0,
        float(np.mean(offsets_y)) if offsets_y else 5.0,
        float(np.std(offsets_y))  if len(offsets_y) >= 2 else 2.0,
    ]

    vector = np.array(features, dtype=np.float32)
    if len(vector) != 27:
        raise ValueError(f"Feature vector length mismatch: expected 27, got {len(vector)}")
    return vector


def signals_quality_score(signals: Dict[str, Any]) -> float:
    """
    Returns 0.0–1.0 indicating how rich the captured signal data is.
    Low quality = fewer events captured = less confident scoring.
    Used to downweight confidence on sparse sessions.
    """
    score = 0.0
    weights = {
        "keystrokes":   0.30,
        "touchEvents":  0.25,
        "swipeEvents":  0.15,
        "deviceMotion": 0.15,
        "tapOffsets":   0.15,
    }
    thresholds = {
        "keystrokes":   5,
        "touchEvents":  3,
        "swipeEvents":  2,
        "deviceMotion": 10,
        "tapOffsets":   2,
    }
    for key, weight in weights.items():
        count = len(signals.get(key, []))
        threshold = thresholds[key]
        score += weight * min(1.0, count / threshold)
    return round(score, 3)
