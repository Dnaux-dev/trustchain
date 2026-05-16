import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, ArrowRight, User, Mail, Phone, Lock, Building2, Hash, CheckCircle } from 'lucide-react'
import { authAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import useThemeStore from '../hooks/useThemeStore'
import { Sun, Moon } from 'lucide-react'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, label: 'Account', icon: User },
  { id: 2, label: 'Banking', icon: Building2 },
]

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    bank_code: '', account_number: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setAuth(data.access_token, {
        user_id: data.user_id,
        full_name: data.full_name,
        is_enrolled: data.is_enrolled,
      })
      toast.success('Account created! Let\'s build your behavioral profile 🎉')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const validateStep1 = () => {
    if (!form.full_name) { toast.error('Please enter your full name'); return false }
    if (!form.email) { toast.error('Please enter your email'); return false }
    if (!form.phone) { toast.error('Please enter your phone number'); return false }
    if (!form.password || form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false }
    return true
  }

  return (
    <div className="auth-layout" style={{ minHeight: '100vh' }}>
      {/* Left — illustration */}
      <div className="auth-illustration">
        <button onClick={toggle} style={{
          position: 'absolute', top: 24, right: 24,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20,
            background: 'var(--brand)',
            border: '1.5px solid var(--border-bright)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            boxShadow: '0 0 60px var(--brand-glow)',
          }}>
            <Shield size={32} color="white" />
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 12 }}>
            Join 340,000+<br />protected users
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Create your TrustChain account in 2 minutes. We'll build your behavioral fingerprint automatically.
          </p>

          {/* What you get */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, fontFamily: 'var(--font-mono)' }}>
              What you get for free
            </div>
            {[
              '✓ Squad Wallet with group fund pooling',
              '✓ AI behavioral fraud protection',
              '✓ Real-time transaction monitoring',
              '✓ Bank account linking & verification',
              '✓ Zero transaction fees on squad payments',
            ].map(t => (
              <div key={t} style={{
                fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {t}
              </div>
            ))}
          </div>

          {/* Security badges */}
          <div style={{ display: 'flex', gap: 8, marginTop: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['CBN', 'NDPR', 'SOC 2', '256-bit AES'].map(b => (
              <div key={b} style={{
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 6,
                fontSize: 10, color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-mono)',
              }}>
                {b}
              </div>
            ))}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
          color: 'rgba(255,255,255,0.2)', fontSize: 11,
          fontFamily: 'var(--font-mono)', padding: '0 32px',
        }}>
          Your behavioral data is encrypted and never sold
        </div>
      </div>

      {/* Right — form */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Theme toggle mobile */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button onClick={toggle} className="btn btn-ghost btn-icon" style={{ padding: 9 }}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className="anim-fade-up" style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
              Create your account
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              Free forever · No credit card required
            </p>
          </div>

          {/* Step indicator */}
          <div className="anim-fade-up d1" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {steps.map((s) => (
                <div key={s.id} style={{ flex: 1 }}>
                  <div style={{
                    height: 3, borderRadius: 2,
                    background: s.id <= step ? 'var(--brand)' : 'var(--border)',
                    transition: 'background 0.4s',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {steps.map((s) => (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: s.id === step ? 'var(--text)' : s.id < step ? 'var(--green)' : 'var(--text-dim)',
                  fontSize: 13, fontWeight: 600, transition: 'color 0.3s',
                }}>
                  {s.id < step
                    ? <CheckCircle size={14} color="var(--green)" />
                    : <s.icon size={14} />
                  }
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="card anim-fade-up d2" style={{ padding: 24 }}>
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Personal Details</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Step 1 of 2 — Tell us who you are</div>
                  </div>

                  <div className="input-wrap">
                    <label className="input-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input id="reg-full-name" className="input-field" placeholder="As on your bank account"
                        value={form.full_name} onChange={e => set('full_name', e.target.value)}
                        style={{ paddingLeft: 42 }} required />
                    </div>
                  </div>

                  <div className="input-wrap">
                    <label className="input-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input id="reg-email" className="input-field" type="email" placeholder="you@example.com"
                        value={form.email} onChange={e => set('email', e.target.value)}
                        style={{ paddingLeft: 42 }} required />
                    </div>
                  </div>

                  <div className="input-wrap">
                    <label className="input-label">Phone Number</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input id="reg-phone" className="input-field" placeholder="08012345678"
                        value={form.phone} onChange={e => set('phone', e.target.value)}
                        style={{ paddingLeft: 42 }} required />
                    </div>
                  </div>

                  <div className="input-wrap">
                    <label className="input-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input id="reg-password" className="input-field" type={showPw ? 'text' : 'password'}
                        placeholder="Min 6 characters" value={form.password}
                        onChange={e => set('password', e.target.value)}
                        style={{ paddingLeft: 42, paddingRight: 44 }} required minLength={6} />
                      <button type="button" id="reg-pw-toggle" onClick={() => setShowPw(v => !v)} style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex',
                      }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {form.password && (
                      <PasswordStrength password={form.password} />
                    )}
                  </div>

                  <button
                    id="reg-step1-next"
                    type="button"
                    className="btn btn-primary btn-full"
                    onClick={() => validateStep1() && setStep(2)}
                    style={{ marginTop: 4 }}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Bank Account</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      Step 2 of 2 — Link your bank for identity verification
                    </div>
                  </div>

                  <div className="input-wrap">
                    <label className="input-label">Your Bank</label>
                    <div style={{ position: 'relative' }}>
                      <Building2 size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <select id="reg-bank" className="input-field" value={form.bank_code}
                        onChange={e => set('bank_code', e.target.value)} required
                        style={{ paddingLeft: 42 }}>
                        <option value="">Select your bank</option>
                        {BANKS.map(b => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="input-wrap">
                    <label className="input-label">Account Number</label>
                    <div style={{ position: 'relative' }}>
                      <Hash size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                      <input id="reg-account-number" className="input-field" placeholder="10-digit account number"
                        value={form.account_number} onChange={e => set('account_number', e.target.value)}
                        style={{ paddingLeft: 42 }}
                        maxLength={10} minLength={10} required />
                    </div>
                  </div>

                  {/* Security notice */}
                  <div style={{
                    display: 'flex', gap: 10,
                    background: 'var(--brand-dim)', border: '1px solid var(--brand-glow)',
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <Lock size={14} color="var(--brand)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 12, color: 'var(--brand)', lineHeight: 1.6 }}>
                      Your bank details are verified via Squad API. We never store your BVN, PIN, or card details.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button type="button" id="reg-step2-back" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>
                      ← Back
                    </button>
                    <button
                      id="reg-submit"
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 2 }}
                      disabled={loading}
                    >
                      {loading ? <span className="spinner" /> : (
                        <>Create Account <ArrowRight size={16} /></>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>

          <p className="anim-fade-up d3" style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" id="go-to-login" style={{ color: 'var(--brand)', fontWeight: 700 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function PasswordStrength({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'var(--red)', 'var(--gold)', 'var(--brand)', 'var(--green)']

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[score] || 'var(--text-dim)', fontWeight: 600 }}>
        {labels[score] || 'Enter password'}
      </div>
    </div>
  )
}
