import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'
import { authAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainLogo from '../components/TrustChainLogo'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      setAuth(data.access_token, {
        user_id: data.user_id,
        full_name: data.full_name,
        is_enrolled: data.is_enrolled,
      })
      toast.success(`Welcome back, ${data.full_name.split(' ')[0]}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#07050A',
      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize:'80px 80px' }} />
      <div style={{ position:'fixed', top:-200, left:'50%', transform:'translateX(-50%)', width:400, height:300, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(244,82,30,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      {/* LEFT visual panel — desktop only */}
      {!isMobile && (
        <div style={{
          flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center',
          padding:'60px 48px',
          borderRight:'1px solid rgba(255,255,255,0.05)',
          position:'relative', zIndex:1,
        }}>
          {/* 3D floating card */}
          <div className="anim-float" style={{ marginBottom:48 }}>
            <div style={{
              width:280, height:160, borderRadius:20,
              background:'linear-gradient(135deg, #1A0A08 0%, #100604 100%)',
              border:'1px solid rgba(244,82,30,0.25)',
              boxShadow:'0 32px 80px rgba(0,0,0,0.8), 0 0 40px rgba(244,82,30,0.08)',
              padding:'24px 28px', position:'relative', overflow:'hidden',
              animation:'rotate3d 8s ease-in-out infinite',
            }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, transparent 30%, rgba(244,82,30,0.04) 50%, transparent 70%)', backgroundSize:'200% 100%', animation:'shimmer 4s linear infinite' }} />
              {/* Gold chip */}
              <div style={{ width:36, height:28, borderRadius:6, background:'linear-gradient(135deg, var(--gold) 0%, #C8960A 100%)', marginBottom:20, boxShadow:'0 2px 8px rgba(245,183,49,0.3)' }} />
              <div style={{ fontFamily:'var(--mono)', fontSize:13, letterSpacing:'2px', color:'rgba(255,255,255,0.7)', marginBottom:8 }}>
                **** **** **** 4891
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                <div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'1px' }}>Protected by</div>
                  {/* Real logo on card */}
                  <div style={{ marginTop:3 }}>
                    <TrustChainLogo height={14} />
                  </div>
                </div>
                <div style={{ textAlign:'right', fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'1px', textTransform:'uppercase' }}>
                  <div>Behavioral</div>
                  <div style={{ color:'var(--squad-orange)', fontWeight:700 }}>VERIFIED</div>
                </div>
              </div>
            </div>
            {/* Card glow shadow */}
            <div style={{ position:'absolute', bottom:-20, left:'10%', right:'10%', height:20, background:'radial-gradient(ellipse, rgba(244,82,30,0.15) 0%, transparent 70%)', filter:'blur(8px)' }} />
          </div>

          <h2 style={{ fontFamily:'"Georgia",serif', fontSize:28, fontWeight:700, letterSpacing:'-0.8px', textAlign:'center', marginBottom:10, lineHeight:1.2 }}>
            Your behavior is your<br />
            <em style={{ color:'var(--squad-orange)', fontWeight:400 }}>identity</em>
          </h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, lineHeight:1.7, textAlign:'center', maxWidth:300 }}>
            No OTP. No PIN. TrustChain uses the unique way you type, swipe, and move.
          </p>

          {/* Signal bars */}
          <div style={{ display:'flex', gap:5, marginTop:36, alignItems:'flex-end', height:36 }}>
            {[0.4,0.7,1.0,0.8,0.6,0.9,0.5,0.75,1.0,0.65,0.85,0.45].map((h, i) => (
              <div key={i} style={{ width:4, borderRadius:2, background:`rgba(244,82,30,${0.25+h*0.65})`, height:`${h*36}px`, animation:`wave ${0.8+i*0.1}s ease-in-out infinite alternate`, animationDelay:`${i*0.08}s` }} />
            ))}
          </div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,0.2)', marginTop:8, fontFamily:'var(--mono)', letterSpacing:'1px' }}>BEHAVIORAL SIGNALS ACTIVE</div>
        </div>
      )}

      {/* RIGHT — form */}
      <div style={{
        width: isMobile ? '100%' : 480,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        padding: isMobile ? '48px 20px 40px' : '60px 48px',
        position:'relative', zIndex:1,
        minHeight: isMobile ? '100vh' : 'auto',
      }}>
        <div style={{ width:'100%', maxWidth: isMobile ? 400 : '100%' }}>

          {/* Logo */}
          <div className="anim-fade-up" style={{ marginBottom:36 }}>
            <div style={{ marginBottom:28 }}>
              <TrustChainLogo height={isMobile ? 26 : 30} showTagline />
            </div>
            <h1 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 30 : 34, fontWeight:700, letterSpacing:'-1px', marginBottom:8 }}>
              Welcome back
            </h1>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14 }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color:'var(--squad-orange)', fontWeight:600 }}>Create one free</Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="anim-fade-up d1" style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input className="input-field" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position:'relative' }}>
                <input className="input-field" type={showPw ? 'text' : 'password'}
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingRight:44 }} required />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop:4 }}>
              {loading
                ? <><span className="spinner" style={{ borderColor:'rgba(255,255,255,0.2)', borderTopColor:'#fff' }} />Signing in...</>
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Security note */}
          <div className="anim-fade-up d2" style={{ marginTop:20, background:'rgba(244,82,30,0.04)', border:'1px solid rgba(244,82,30,0.1)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <Lock size={13} color="var(--squad-orange)" style={{ flexShrink:0 }} />
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>
              Raw behavioral signals never leave your device. Only mathematical features are sent.
            </span>
          </div>

          {/* Divider */}
          <div className="anim-fade-up d3" style={{ marginTop:28, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.2)', fontFamily:'var(--mono)', letterSpacing:'1px' }}>SECURED BY SQUAD API</span>
            <div style={{ height:1, flex:1, background:'rgba(255,255,255,0.06)' }} />
          </div>

          {isMobile && (
            <p style={{ textAlign:'center', marginTop:24, fontSize:11, color:'rgba(255,255,255,0.18)', fontFamily:'var(--mono)', lineHeight:1.6 }}>
              "We don't ask if you know your password.<br />We ask if you move like yourself."
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
