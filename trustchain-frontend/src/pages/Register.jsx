import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
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
      toast.success('Account created! Start making payments to build your profile.')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--purple) 0%, #3B2070 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px var(--purple-glow)',
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Your behavior is your password
          </p>
        </div>

        {/* Steps indicator */}
        <div className="anim-fade-up d1" style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--purple)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card anim-fade-up d2" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {step === 1 && (
              <>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--purple-bright)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Step 1 of 2</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Personal Details</div>
                </div>

                <div className="input-wrap">
                  <label className="input-label">Full Name</label>
                  <input className="input-field" placeholder="As on your bank account"
                    value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
                </div>

                <div className="input-wrap">
                  <label className="input-label">Email Address</label>
                  <input className="input-field" type="email" placeholder="you@example.com"
                    value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>

                <div className="input-wrap">
                  <label className="input-label">Phone Number</label>
                  <input className="input-field" placeholder="08012345678"
                    value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>

                <div className="input-wrap">
                  <label className="input-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="input-field" type={showPw ? 'text' : 'password'}
                      placeholder="Min 6 characters" value={form.password}
                      onChange={e => set('password', e.target.value)}
                      style={{ paddingRight: 44 }} required minLength={6} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="button" className="btn btn-primary btn-full"
                  onClick={() => {
                    if (!form.full_name || !form.email || !form.phone || !form.password) {
                      toast.error('Please fill all fields'); return
                    }
                    setStep(2)
                  }}>
                  Continue →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Step 2 of 2</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Bank Account</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    Used to verify your identity and receive payments
                  </div>
                </div>

                <div className="input-wrap">
                  <label className="input-label">Your Bank</label>
                  <select className="input-field" value={form.bank_code}
                    onChange={e => set('bank_code', e.target.value)} required>
                    <option value="">Select your bank</option>
                    {BANKS.map(b => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="input-wrap">
                  <label className="input-label">Account Number</label>
                  <input className="input-field" placeholder="10-digit account number"
                    value={form.account_number} onChange={e => set('account_number', e.target.value)}
                    maxLength={10} minLength={10} required />
                </div>

                {/* Info box */}
                <div style={{
                  background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 10, padding: '12px 14px',
                  fontSize: 13, color: 'var(--cyan)', lineHeight: 1.5,
                }}>
                  🔒 Your bank details are verified via Squad API and stored securely. We never store your BVN or full card details.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }}
                    onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Create Account'}
                  </button>
                </div>
              </>
            )}

          </div>
        </form>

        <p className="anim-fade-up d3" style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--purple-bright)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
