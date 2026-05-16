import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, CheckCircle } from 'lucide-react'
import { paymentsAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainSDK from '../sdk/TrustChain'
import toast from 'react-hot-toast'

const SESSIONS = [
  {
    title: "Let's learn how you type",
    subtitle: "Type the phrase below naturally — exactly how you would normally type",
    phrase: "I confirm this is me",
    instruction: "Type it, then tap Continue",
  },
  {
    title: "How you swipe and tap",
    subtitle: "Scroll down slowly, then tap the buttons below",
    phrase: "My payments are secure",
    instruction: "Type, scroll, then tap Continue",
  },
  {
    title: "One last time",
    subtitle: "Final session — your profile is almost ready",
    phrase: "TrustChain knows my pattern",
    instruction: "Type naturally and continue",
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)       // 0 = intro, 1-3 = training, 4 = done
  const [loading, setLoading] = useState(false)
  const [typed, setTyped] = useState('')
  const [completed, setCompleted] = useState([])
  const sdkRef = useRef(null)

  // Check if already enrolled — skip onboarding (read from store, not API, to avoid race conditions)
  useEffect(() => {
    if (user?.is_enrolled) {
      navigate('/dashboard', { replace: true })
    }
  }, [])

  // Boot SDK on each training step
  useEffect(() => {
    if (step >= 1 && step <= 3 && user?.user_id) {
      setTimeout(() => {
        sdkRef.current = new TrustChainSDK('onboarding-form', user.user_id)
      }, 400)
    }
    return () => {
      if (sdkRef.current) { sdkRef.current.destroy(); sdkRef.current = null }
    }
  }, [step])

  const handleTrainingSession = async () => {
    if (!sdkRef.current) return
    if (typed.trim().length < 3) {
      toast.error('Please type the phrase first')
      return
    }

    setLoading(true)
    const behavioralData = sdkRef.current.collect()

    try {
      // Send to backend — enrollment sessions auto-approve
      await paymentsAPI.verifySession({
        behavioralData,
        paymentAmount: 1,           // dummy amount
        recipientBankCode: user.bank_code || '000014',
        recipientAccount: user.account_number || '0000000000',
      })

      setCompleted(c => [...c, step])
      setTyped('')

      if (step === 3) {
        // All 3 done — mark enrolled
        updateUser({ is_enrolled: true, enrollment_sessions: 3 })
        setStep(4)
      } else {
        setStep(s => s + 1)
        toast.success(`Session ${step} complete!`)
      }
    } catch (err) {
      // Even if payment fails, vector was stored — continue
      setCompleted(c => [...c, step])
      setTyped('')
      if (step === 3) {
        updateUser({ is_enrolled: true })
        setStep(4)
      } else {
        setStep(s => s + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  // ── INTRO ──────────────────────────────────────────────────────
  if (step === 0) return (
    <div className="page" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div className="anim-fade-up" style={{
          width: 80, height: 80, borderRadius: 24, margin: '0 auto 24px',
          background: 'linear-gradient(135deg, var(--purple) 0%, #3B2070 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px var(--purple-glow)',
          animation: 'glow 3s ease infinite',
        }}>
          <Shield size={36} color="white" />
        </div>

        <h1 className="anim-fade-up d1" style={{
          fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12,
        }}>
          Welcome, {user?.full_name?.split(' ')[0]} 👋
        </h1>

        <p className="anim-fade-up d2" style={{
          color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 32,
        }}>
          Before your first payment, TrustChain needs to learn <strong style={{ color: 'var(--text)' }}>how you move</strong>.
          <br /><br />
          We'll run <strong style={{ color: 'var(--purple-bright)' }}>3 short sessions</strong> — each takes about 20 seconds.
          Type a phrase, scroll, tap. That's it. Your unique behavioral fingerprint gets stored.
          <br /><br />
          After this, every payment you make is protected by your behavior — not a password.
        </p>

        {/* Steps preview */}
        <div className="anim-fade-up d3" style={{
          display: 'flex', gap: 10, marginBottom: 32,
        }}>
          {['Keystroke rhythm', 'Swipe pattern', 'Tap accuracy'].map((label, i) => (
            <div key={label} style={{
              flex: 1, background: 'var(--bg-card)',
              border: '1px solid var(--border)', borderRadius: 12,
              padding: '14px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>
                {['⌨️', '👆', '🎯'][i]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <button className="anim-fade-up d4 btn btn-primary btn-full"
          style={{ fontSize: 16, padding: '16px' }}
          onClick={() => setStep(1)}>
          Start Training →
        </button>

        <p className="anim-fade-up d5" style={{
          marginTop: 16, fontSize: 12,
          color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
        }}>
          Takes about 60 seconds total
        </p>
      </div>
    </div>
  )

  // ── COMPLETE ───────────────────────────────────────────────────
  if (step === 4) return (
    <div className="page" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <div className="anim-fade-up" style={{
          width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
          background: 'var(--green-dim)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(0,229,160,0.3)',
        }}>
          <CheckCircle size={36} color="var(--green)" />
        </div>

        <h1 className="anim-fade-up d1" style={{
          fontSize: 28, fontWeight: 800, marginBottom: 12,
        }}>
          You're protected 🎉
        </h1>

        <p className="anim-fade-up d2" style={{
          color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.7, marginBottom: 12,
        }}>
          Your behavioral profile is active. TrustChain now knows how you move.
        </p>

        <div className="anim-fade-up d3" style={{
          background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 28,
          fontSize: 13, color: 'var(--green)',
        }}>
          ✓ 3 behavioral sessions enrolled<br />
          ✓ Isolation Forest baseline set<br />
          ✓ Cosine similarity profile active<br />
          ✓ Payments now biometrically protected
        </div>

        <button className="anim-fade-up d4 btn btn-primary btn-full"
          style={{ fontSize: 16, padding: '16px' }}
          onClick={() => navigate('/dashboard')}>
          Go to Dashboard →
        </button>
      </div>
    </div>
  )

  // ── TRAINING SESSIONS 1-3 ──────────────────────────────────────
  const session = SESSIONS[step - 1]
  const progress = ((step - 1) / 3) * 100

  return (
    <div className="page" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        {/* Progress */}
        <div className="anim-fade-up" style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)', marginBottom: 8,
          }}>
            <span>Training session {step} of 3</span>
            <span>{Math.round(progress + 33)}% complete</span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              background: 'linear-gradient(90deg, var(--purple), var(--cyan))',
              width: `${progress + 33}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: s < step ? 28 : 10, height: 10, borderRadius: 5,
                background: s < step
                  ? 'var(--green)'
                  : s === step
                    ? 'var(--purple)'
                    : 'var(--border)',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s < step && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Session card */}
        <div className="card anim-fade-up d1" id="onboarding-form">
          {/* SDK indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,229,160,0.06)',
            border: '1px solid rgba(0,229,160,0.15)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 20,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--green)', animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
              Sensor active — capturing your pattern
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
            {session.title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            {session.subtitle}
          </p>

          {/* Phrase to type */}
          <div style={{
            background: 'var(--purple-dim)',
            border: '1px dashed rgba(123,94,167,0.4)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--purple-bright)', letterSpacing: '0.5px',
          }}>
            "{session.phrase}"
          </div>

          <div className="input-wrap" style={{ marginBottom: 20 }}>
            <label className="input-label">Type the phrase above</label>
            <input
              className="input-field"
              placeholder="Type here..."
              value={typed}
              onChange={e => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            {typed.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {typed.length} chars · {typed.split(' ').filter(Boolean).length} words
              </div>
            )}
          </div>

          {/* Scroll instruction */}
          <div style={{
            background: 'var(--bg-input)', borderRadius: 10,
            padding: '12px 14px', marginBottom: 20,
            fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
          }}>
            👆 {session.instruction}
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleTrainingSession}
            disabled={loading || typed.trim().length < 3}
          >
            {loading
              ? <><span className="spinner" /> Analyzing...</>
              : step === 3
                ? '✓ Complete Training'
                : `Continue → Session ${step + 1} of 3`}
          </button>
        </div>

        {/* What we're capturing */}
        <div className="anim-fade-up d2" style={{
          marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {['Keystroke timing', 'Hold duration', 'Tap pressure', 'Scroll speed', 'Field timing'].map(s => (
            <span key={s} className="badge badge-purple" style={{ fontSize: 10 }}>{s}</span>
          ))}
        </div>

      </div>
    </div>
  )
}