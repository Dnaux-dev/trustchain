import { Link } from 'react-router-dom'
import { Shield, Zap, Eye, Lock, ArrowRight, CheckCircle, TrendingUp, Users, Globe, ChevronRight, Moon, Sun } from 'lucide-react'
import useThemeStore from '../hooks/useThemeStore'

const stats = [
  { value: '₦2.4B+', label: 'Secured daily' },
  { value: '99.7%', label: 'Accuracy rate' },
  { value: '<120ms', label: 'Avg. verify time' },
  { value: '340K+', label: 'Active users' },
]

const features = [
  {
    icon: Eye,
    color: 'var(--brand)',
    glow: 'var(--brand-glow)',
    title: 'Behavioral Biometrics',
    desc: 'Your unique typing rhythm, mouse movements, and interaction patterns create an invisible shield around every transaction.',
  },
  {
    icon: Zap,
    color: '#FFB800',
    glow: 'rgba(255,184,0,0.2)',
    title: 'Real-Time Verification',
    desc: 'Transactions are verified in under 120ms. No OTPs, no friction — just seamless security that works in the background.',
  },
  {
    icon: Lock,
    color: '#00D180',
    glow: 'rgba(0,209,128,0.2)',
    title: 'Zero-Knowledge Architecture',
    desc: 'Your behavioral data never leaves your device in raw form. We verify patterns, not raw data. Your privacy is absolute.',
  },
]

export default function Landing() {
  const { theme, toggle } = useThemeStore()

  return (
    <div className="page" style={{ overflowX: 'hidden' }}>
      {/* Header */}
      <nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--brand-glow)',
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
            Trust<span style={{ color: 'var(--brand)' }}>Chain</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={toggle} className="btn btn-ghost" style={{ padding: '8px 10px', borderRadius: 8 }}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 14 }}>Sign In</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: 14 }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px', position: 'relative'
      }}>
        {/* Decorative Background Blob */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, var(--brand-dim) 0%, transparent 70%)',
          zIndex: -1, pointerEvents: 'none', opacity: 0.5
        }} />

        <div className="anim-fade-up badge badge-green" style={{ marginBottom: 24, fontSize: 12, background: 'rgba(0,209,128,0.1)', color: '#00D180', border: '1px solid rgba(0,209,128,0.2)' }}>
          ● Powered by Squad APIs
        </div>

        <h1 className="anim-fade-up" style={{
          fontSize: 'clamp(44px, 8vw, 92px)',
          lineHeight: 0.95,
          marginBottom: 28,
          maxWidth: 900,
          color: 'var(--text)'
        }}>
          Your behavior is <br />
          <span className="gradient-text">your fingerprint.</span>
        </h1>

        <p className="anim-fade-up" style={{
          fontSize: 'clamp(17px, 2vw, 21px)',
          color: 'var(--text-muted)',
          maxWidth: 580,
          lineHeight: 1.6,
          marginBottom: 44,
          fontWeight: 400
        }}>
          TrustChain uses invisible behavioral biometrics to protect your squad wallet.
          No more SMS OTPs. No more security gaps. Just seamless fraud protection.
        </p>

        <div className="anim-fade-up" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: 16, borderRadius: 12 }}>
            Join the Squad — Free
            <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
          <Link to="/login" className="btn btn-ghost" style={{ padding: '16px 32px', fontSize: 16, borderRadius: 12 }}>
            View Demo
          </Link>
        </div>

        {/* Hero Image Mockup */}
        <div className="anim-fade-up" style={{ marginTop: 80, width: '100%', maxWidth: 720 }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 40px 100px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3B30' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFB800' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00D180' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>squad.trustchain.app</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'linear-gradient(135deg, #1A1A1A, #000000)', border: '1px solid var(--brand)', borderRadius: 16, padding: 24, gridColumn: 'span 2', textAlign: 'left' }}>
                 <div style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Squad Wallet Balance</div>
                 <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>₦1,240,500.00</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20 }}>
                 <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>SECURITY SCORE</div>
                 <div style={{ fontSize: 24, fontWeight: 800, color: '#00D180' }}>98.4</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: 20 }}>
                 <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>ACTIVE VECTORS</div>
                 <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>12,402</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--brand)', marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', marginBottom: 16 }}>Engineered for Total Security</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 17, maxWidth: 600, margin: '0 auto' }}>
              We've combined Squad's powerful payment infrastructure with cutting-edge behavioral AI to create the most secure wallet experience in Africa.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <div key={f.title} className="card">
                 <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <f.icon size={24} color={f.color} />
                 </div>
                 <h3 style={{ fontSize: 20, marginBottom: 12 }}>{f.title}</h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ marginTop: 100 }}>
        <div>© 2026 TrustChain · Powered by Squad Hackathon 3.0 · Built with AI</div>
      </footer>
    </div>
  )
}
