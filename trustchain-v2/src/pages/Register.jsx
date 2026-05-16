import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, CheckCircle, Building2, User, Shield } from 'lucide-react'
import { authAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainLogo from '../components/TrustChainLogo'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [form, setForm] = useState({ full_name:'', email:'', phone:'', password:'', bank_code:'', account_number:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.register(form)
      setAuth(data.access_token, { user_id: data.user_id, full_name: data.full_name, is_enrolled: false })
      toast.success('Account created! Time to train your profile.')
      navigate('/onboarding')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally { setLoading(false) }
  }

  const goNext = e => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.phone || !form.password) { toast.error('Fill all fields'); return }
    setStep(2)
  }

  const STEPS = [
    { num:1, label:'Personal Details', icon:User },
    { num:2, label:'Bank Account',     icon:Building2 },
    { num:3, label:'Train Profile',    icon:Shield },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#07050A', display:'flex', flexDirection: isMobile ? 'column' : 'row', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize:'80px 80px' }} />

      {/* LEFT sidebar — desktop only */}
      {!isMobile && (
        <div style={{ width:320, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 40px', borderRight:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
          {/* Real logo */}
          <div style={{ marginBottom:48 }}>
            <TrustChainLogo height={26} showTagline />
          </div>

          <h2 style={{ fontFamily:'"Georgia",serif', fontSize:26, fontWeight:700, letterSpacing:'-0.5px', marginBottom:10, lineHeight:1.2 }}>
            Get started in<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>2 minutes</em>
          </h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, lineHeight:1.7, marginBottom:36 }}>
            Create your account and let TrustChain learn your behavioral fingerprint.
          </p>

          {/* Step indicators */}
          {STEPS.map(({ num, label, icon:Icon }) => (
            <div key={num} style={{ display:'flex', gap:14, marginBottom:20, opacity: num <= step ? 1 : 0.35, transition:'opacity 0.3s' }}>
              <div style={{ flexShrink:0 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background: num < step ? 'var(--squad-orange)' : num === step ? 'rgba(244,82,30,0.12)' : 'rgba(255,255,255,0.04)', border:`1.5px solid ${num <= step ? 'var(--squad-orange)' : 'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.3s' }}>
                  {num < step
                    ? <CheckCircle size={15} color="#fff" />
                    : <Icon size={14} color={num === step ? 'var(--squad-orange)' : 'rgba(255,255,255,0.3)'} />}
                </div>
                {num < 3 && <div style={{ width:1.5, height:18, background: num < step ? 'var(--squad-orange)' : 'rgba(255,255,255,0.08)', margin:'4px auto', transition:'background 0.3s' }} />}
              </div>
              <div style={{ paddingTop:6 }}>
                <div style={{ fontSize:13, fontWeight:600, color: num === step ? '#fff' : 'rgba(255,255,255,0.45)', marginBottom:2 }}>{label}</div>
              </div>
            </div>
          ))}

          {/* Squad badge */}
          <div style={{ marginTop:16, background:'rgba(244,82,30,0.04)', border:'1px solid rgba(244,82,30,0.12)', borderRadius:10, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--squad-orange)', animation:'pulse-glow 2s infinite', flexShrink:0 }} />
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>
              Bank verified via <strong style={{ color:'var(--squad-orange)' }}>Squad Account Lookup API</strong>
            </span>
          </div>
        </div>
      )}

      {/* RIGHT form */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: isMobile ? '40px 20px 48px' : '60px 48px', position:'relative', zIndex:1, minHeight: isMobile ? '100vh' : 'auto', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth: isMobile ? 420 : 440 }}>

          {/* Mobile: logo + progress */}
          {isMobile && (
            <div className="anim-fade-up" style={{ marginBottom:28 }}>
              <div style={{ marginBottom:22 }}>
                <TrustChainLogo height={24} showTagline />
              </div>
              <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                {[1,2].map(s => (
                  <div key={s} style={{ flex:1, height:3, borderRadius:2, background: s <= step ? 'var(--squad-orange)' : 'rgba(255,255,255,0.08)', transition:'background 0.3s' }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)' }}>Step {step} of 2</div>
            </div>
          )}

          {/* Step header */}
          <div className="anim-fade-up" style={{ marginBottom:28 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:14, background:'rgba(244,82,30,0.08)', border:'1px solid rgba(244,82,30,0.15)', borderRadius:20, padding:'4px 12px' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--squad-orange)' }} />
              <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'var(--squad-orange)', letterSpacing:'0.5px' }}>STEP {step} OF 2</span>
            </div>
            <h1 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 28 : 32, fontWeight:700, letterSpacing:'-0.8px', marginBottom:6 }}>
              {step === 1 ? 'Personal Details' : 'Link Bank Account'}
            </h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14 }}>
              {step === 1
                ? <>Already have an account? <Link to="/login" style={{ color:'var(--squad-orange)', fontWeight:600 }}>Sign in</Link></>
                : 'Verified securely via Squad API'}
            </p>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={goNext} className="anim-fade-up d1" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="As on your bank account" value={form.full_name} onChange={e => set('full_name', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input className="input-field" placeholder="08012345678" value={form.phone} onChange={e => set('phone', e.target.value)} required />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <div style={{ position:'relative' }}>
                  <input className="input-field" type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => set('password', e.target.value)} style={{ paddingRight:44 }} required minLength={6} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', background:'none', border:'none', cursor:'pointer' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop:4 }}>
                Continue <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="anim-fade-up d1" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* Squad verification badge */}
              <div style={{ background:'rgba(244,82,30,0.05)', border:'1px solid rgba(244,82,30,0.15)', borderRadius:12, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:'rgba(244,82,30,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Building2 size={15} color="var(--squad-orange)" />
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>Squad Account Verification</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>
                    Your account name confirmed instantly via Squad's Account Lookup API.
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Your Bank</label>
                <select className="input-field" value={form.bank_code} onChange={e => set('bank_code', e.target.value)} required>
                  <option value="">Select your bank</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Account Number</label>
                <input className="input-field" placeholder="10-digit account number" value={form.account_number} onChange={e => set('account_number', e.target.value)} maxLength={10} minLength={10} required />
              </div>

              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={() => setStep(1)}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
                  {loading
                    ? <><span className="spinner" style={{ borderColor:'rgba(255,255,255,0.2)', borderTopColor:'#fff' }} />Creating...</>
                    : <>Create Account <ArrowRight size={15} /></>}
                </button>
              </div>
            </form>
          )}

          {isMobile && step === 2 && (
            <p style={{ textAlign:'center', marginTop:20, fontSize:13, color:'rgba(255,255,255,0.35)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color:'var(--squad-orange)', fontWeight:600 }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
