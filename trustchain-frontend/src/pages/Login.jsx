import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Loader, ArrowRight, Lock, Zap, CheckCircle } from 'lucide-react'
import { authAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import useThemeStore from '../hooks/useThemeStore'
import { Sun, Moon } from 'lucide-react'
import toast from 'react-hot-toast'

const perks = [
  { icon: Lock, text: 'Bank-grade behavioral encryption' },
  { icon: Zap,  text: 'Under 120ms verification per transaction' },
  { icon: CheckCircle, text: 'Zero fraudulent transfers since 2024' },
]

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.access_token, {
        user_id: data.user_id,
        full_name: data.full_name,
        is_enrolled: data.is_enrolled,
      })
      toast.success(`Welcome back, ${data.full_name.split(' ')[0]} 👋`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout" style={{ minHeight: '100vh' }}>
      {/* Left — illustration panel */}
      <div className="auth-illustration">
        {/* Theme toggle top right */}
        <button onClick={toggle} style={{
          position: 'absolute', top: 24, right: 24,
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '8px 10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          {/* Logo */}
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
            Invisible security.<br />Absolute confidence.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            TrustChain's AI knows it's you — not by what you know, but by how you move.
          </p>

          {/* Perks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
            {perks.map(({ icon: Icon, text }) => (
              <div key={text} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
              }}>
                <Icon size={16} color="rgba(0,212,255,0.8)" />
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Floating mockup numbers */}
          <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'center' }}>
            {[
              { v: '99.7%', l: 'Accuracy' },
              { v: '340K+', l: 'Users' },
              { v: '₦2.4B', l: 'Protected' },
            ].map(({ v, l }) => (
              <div key={l} style={{
                padding: '14px 16px', textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, flex: 1,
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white', fontFamily: 'var(--font-mono)' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote at bottom */}
        <div style={{
          position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
          color: 'rgba(255,255,255,0.25)', fontSize: 12,
          fontFamily: 'var(--font-mono)', fontStyle: 'italic', padding: '0 32px',
        }}>
          "We don't ask if you know your password. We ask if you move like yourself."
        </div>
      </div>

      {/* Right — form panel */}
      <div className="auth-form-panel">
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Theme toggle (mobile) */}
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: 'var(--brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px var(--brand-glow)',
            }}>
              <Shield size={28} color="white" />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              Sign in to your TrustChain Squad account
            </p>
          </div>

          <form className="anim-fade-up d1" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="input-wrap">
              <label className="input-label">Email address</label>
              <input
                id="login-email"
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-wrap">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="input-label">Password</label>
                <button type="button" style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--brand)', fontWeight: 600,
                }}>
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  className="input-field"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight: 44 }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  id="login-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                    padding: 0, display: 'flex',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              className="btn btn-primary btn-full"
              type="submit"
              disabled={loading}
              style={{ marginTop: 6 }}
            >
              {loading ? <span className="spinner" /> : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="anim-fade-up d2">
            <div className="divider" style={{ margin: '28px 0' }} />

            {/* Social proof */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'var(--green-dim)',
              border: '1px solid rgba(0,229,160,0.2)',
              borderRadius: 10, marginBottom: 24,
            }}>
              <div className="dot-live" />
              <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 500 }}>
                340,000+ users currently protected
              </span>
            </div>

            <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" id="go-to-register" style={{ color: 'var(--brand)', fontWeight: 700 }}>
                Create one free →
              </Link>
            </p>
          </div>
        </div>
    </div>
  )
}
