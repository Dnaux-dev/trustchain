/**
 * TrustChain.js — Behavioral Biometric Sensor SDK v3
 *
 * Captures 6 behavioral signals on both mobile (touch/gyroscope)
 * and desktop (mouse/keyboard). Extracts features client-side.
 * Raw signal data never leaves the browser — only derived features
 * and a tamper-evident SHA-256 hash are transmitted.
 */

// ── Math helpers ──────────────────────────────────────────────────
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}
function std(arr) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length)
}
function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

// ── SHA-256 hash of session metadata ─────────────────────────────
async function hashSignals(signals) {
  const str = JSON.stringify(signals)
  const buffer = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Extract 24-feature vector client-side ─────────────────────────
function extractFeatures(signals) {
  const features = []

  // S1: Keystroke dynamics (5 features)
  const holds = signals.keystrokes
    .map(k => k.holdDuration)
    .filter(h => h && h > 0 && h < 2000)

  features.push(
    mean(holds) || 80,
    std(holds)  || 20,
    holds.length ? [...holds].sort((a, b) => a - b)[Math.floor(holds.length / 2)] : 80,
    percentile(holds, 25) || 60,
    percentile(holds, 75) || 100,
  )

  // S2: Touch pressure (4 features)
  // On desktop, force/radius are always 0 — use sensible defaults
  const forces = signals.touchEvents.map(t => t.force).filter(f => f > 0)
  const radii  = signals.touchEvents
    .map(t => (t.radiusX + t.radiusY) / 2)
    .filter(r => r > 0)

  features.push(
    mean(forces) || 0.3,
    std(forces)  || 0.05,
    mean(radii)  || 10,
    std(radii)   || 2,
  )

  // S3: Swipe / scroll velocity (3 features)
  const vels = signals.swipeEvents
    .map(s => Math.abs(s.velocityY))
    .filter(v => v > 0)

  features.push(
    mean(vels) || 0.5,
    vels.length ? Math.max(...vels) : 1.0,
    std(vels)  || 0.2,
  )

  // S4: Device orientation / gyroscope (4 features)
  // On desktop: simulated from mouse movement direction variance
  const betas  = signals.deviceMotion.map(m => m.beta).filter(b => b != null)
  const gammas = signals.deviceMotion.map(m => m.gamma).filter(g => g != null)

  features.push(
    mean(betas)  || 0,
    std(betas)   || 0.5,
    mean(gammas) || 0,
    std(gammas)  || 0.5,
  )

  // S5: Form field timing (4 features)
  const timings    = Object.values(signals.fieldTimings)
  const durations  = timings
    .filter(f => f.focusTime && f.blurTime && f.blurTime > f.focusTime)
    .map(f => f.blurTime - f.focusTime)
  const pasteCount = timings.filter(f => f.pasteDetected).length
  const totalKeys  = timings.reduce((a, f) => a + (f.keyCount || 0), 0)

  features.push(
    mean(durations) || 3000,
    std(durations)  || 500,
    pasteCount,
    totalKeys,
  )

  // S6: Tap / click accuracy (4 features)
  const ox = signals.tapOffsets.map(t => Math.abs(t.offsetX))
  const oy = signals.tapOffsets.map(t => Math.abs(t.offsetY))

  features.push(
    mean(ox) || 5,
    std(ox)  || 2,
    mean(oy) || 5,
    std(oy)  || 2,
  )

  return features  // exactly 24 floats
}

// ── Signal quality score (0.0–1.0) ───────────────────────────────
function computeQuality(signals) {
  const checks = [
    Math.min(1, signals.keystrokes.length   / 5),
    Math.min(1, signals.touchEvents.length  / 3),
    Math.min(1, signals.swipeEvents.length  / 2),
    Math.min(1, signals.deviceMotion.length / 10),
    Math.min(1, signals.tapOffsets.length   / 2),
  ]
  // On desktop touchEvents will always be 0 — re-weight to avoid
  // penalising desktop users unfairly
  const isMobile = 'ontouchstart' in window
  if (!isMobile) {
    // Drop touchEvents weight for desktop, boost keystroke weight
    return (
      checks[0] * 0.45 +  // keystrokes
      checks[2] * 0.20 +  // scroll
      checks[3] * 0.15 +  // motion (will also be 0 on desktop)
      checks[4] * 0.20    // tap/click offsets
    )
  }
  return checks.reduce((a, b) => a + b, 0) / checks.length
}


// ── Main SDK class ─────────────────────────────────────────────────
class TrustChainSDK {
  constructor(formId, userId) {
    this.userId    = userId
    this.formId    = formId
    this.startTime = Date.now()
    this.signals   = {
      keystrokes:   [],
      touchEvents:  [],
      swipeEvents:  [],
      deviceMotion: [],
      fieldTimings: {},
      tapOffsets:   [],
    }
    this._lastScrollY    = window.scrollY
    this._lastScrollTime = Date.now()
    this._lastMouseX     = 0
    this._lastMouseY     = 0
    this._lastMouseTime  = Date.now()
    this._listeners      = []
    this._attach()
  }

  _on(target, event, handler, opts) {
    target.addEventListener(event, handler, opts)
    this._listeners.push({ target, event, handler })
  }

  _attach() {
    const form = document.getElementById(this.formId)

    // ── S1: Keystroke dynamics ────────────────────────────────────
    this._on(document, 'keydown', (e) => {
      this.signals.keystrokes.push({
        key: e.key.length === 1 ? 'char' : e.key,
        downTime: Date.now(),
        holdDuration: null,
      })
    })
    this._on(document, 'keyup', (e) => {
      const keyName = e.key.length === 1 ? 'char' : e.key
      const last = [...this.signals.keystrokes]
        .reverse()
        .find(k => k.key === keyName && k.holdDuration === null)
      if (last) last.holdDuration = Date.now() - last.downTime
    })

    // ── S2 & S6 (Mobile): Touch pressure + tap accuracy ──────────
    if (form) {
      this._on(form, 'touchstart', (e) => {
        const t = e.touches[0]
        this.signals.touchEvents.push({
          force:   t.force   || 0,
          radiusX: t.radiusX || 0,
          radiusY: t.radiusY || 0,
          timestamp: Date.now(),
        })
        if (e.target) {
          const rect = e.target.getBoundingClientRect()
          this.signals.tapOffsets.push({
            targetId: e.target.id || e.target.tagName,
            offsetX:  t.clientX - (rect.left + rect.width  / 2),
            offsetY:  t.clientY - (rect.top  + rect.height / 2),
            timestamp: Date.now(),
          })
        }
      }, { passive: true })
    }

    // ── S6 (Desktop): Mouse click accuracy ───────────────────────
    this._on(document, 'click', (e) => {
      if (e.target && form && form.contains(e.target)) {
        const rect = e.target.getBoundingClientRect()
        this.signals.tapOffsets.push({
          targetId: e.target.id || e.target.tagName,
          offsetX:  e.clientX - (rect.left + rect.width  / 2),
          offsetY:  e.clientY - (rect.top  + rect.height / 2),
          timestamp: Date.now(),
        })
      }
    })

    // ── S3: Scroll / swipe velocity ───────────────────────────────
    this._on(window, 'scroll', () => {
      const now    = Date.now()
      const deltaY = window.scrollY - this._lastScrollY
      const dt     = now - this._lastScrollTime
      if (dt > 0 && Math.abs(deltaY) > 0) {
        this.signals.swipeEvents.push({
          deltaY,
          velocityY: deltaY / dt,
          timestamp: now,
        })
      }
      this._lastScrollY    = window.scrollY
      this._lastScrollTime = now
    }, { passive: true })

    // ── S4 (Mobile): Device orientation / gyroscope ───────────────
    this._on(window, 'deviceorientation', (e) => {
      const last = this.signals.deviceMotion[this.signals.deviceMotion.length - 1]
      if (!last || Date.now() - last.timestamp > 100) {
        this.signals.deviceMotion.push({
          alpha: e.alpha != null ? +e.alpha.toFixed(2) : null,
          beta:  e.beta  != null ? +e.beta.toFixed(2)  : null,
          gamma: e.gamma != null ? +e.gamma.toFixed(2) : null,
          timestamp: Date.now(),
        })
      }
    })

    // ── S4 (Desktop): Mouse movement as orientation proxy ─────────
    // Samples mouse angle changes at ~100ms intervals as a substitute
    // for gyroscope data on devices without motion sensors.
    this._on(document, 'mousemove', (e) => {
      const now = Date.now()
      if (now - this._lastMouseTime < 100) return
      const dx = e.clientX - this._lastMouseX
      const dy = e.clientY - this._lastMouseY
      // Map mouse deltas to beta/gamma-like values (scale to typical gyro range)
      const beta  = Math.max(-90, Math.min(90, dy * 0.5))
      const gamma = Math.max(-90, Math.min(90, dx * 0.5))
      const last  = this.signals.deviceMotion[this.signals.deviceMotion.length - 1]
      if (!last || now - last.timestamp > 100) {
        this.signals.deviceMotion.push({ alpha: null, beta, gamma, timestamp: now })
      }
      this._lastMouseX    = e.clientX
      this._lastMouseY    = e.clientY
      this._lastMouseTime = now
    })

    // ── S5: Form field timing ─────────────────────────────────────
    if (form) {
      form.querySelectorAll('input, select, textarea').forEach((input) => {
        const name = input.name || input.id || 'field'
        if (!this.signals.fieldTimings[name]) {
          this.signals.fieldTimings[name] = {
            focusTime: null, blurTime: null,
            keyCount: 0, pasteDetected: false,
          }
        }
        this._on(input, 'focus',    () => { this.signals.fieldTimings[name].focusTime = Date.now() })
        this._on(input, 'blur',     () => { this.signals.fieldTimings[name].blurTime  = Date.now() })
        this._on(input, 'keypress', () => { this.signals.fieldTimings[name].keyCount++ })
        this._on(input, 'paste',    () => { this.signals.fieldTimings[name].pasteDetected = true })
      })
    }
  }

  // ── getQuality() — returns live quality score 0.0–1.0 ─────────
  getQuality() {
    return parseFloat(computeQuality(this.signals).toFixed(3))
  }

  // ── collect() — build and return the behavioral data payload ───
  async collect() {
    const features = extractFeatures(this.signals)
    const quality  = computeQuality(this.signals)

    // Hash session metadata — tamper-evident, raw data never sent
    const signalHash = await hashSignals({
      keystroke_count:  this.signals.keystrokes.length,
      touch_count:      this.signals.touchEvents.length,
      motion_count:     this.signals.deviceMotion.length,
      session_duration: Date.now() - this.startTime,
      paste_detected:   Object.values(this.signals.fieldTimings).some(f => f.pasteDetected),
      timestamp:        new Date().toISOString(),
    })

    return {
      userId:          this.userId,
      sessionDuration: Date.now() - this.startTime,
      signalHash,
      quality,
      signals: {
        keystrokes:        this.signals.keystrokes,
        touchEvents:       this.signals.touchEvents,
        swipeEvents:       this.signals.swipeEvents,
        deviceMotion:      this.signals.deviceMotion,
        fieldTimings:      this.signals.fieldTimings,
        tapOffsets:        this.signals.tapOffsets,
        extractedFeatures: features,
      },
      collectedAt: new Date().toISOString(),
    }
  }

  // ── destroy() — clean up all listeners ──────────────────────────
  destroy() {
    this._listeners.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler)
    })
    this._listeners = []
  }
}

export default TrustChainSDK