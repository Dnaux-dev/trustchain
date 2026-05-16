import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Fingerprint, Smartphone, Hand, Move } from 'lucide-react'
import { paymentsAPI, usersAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainLogo from '../components/TrustChainLogo'
import TrustChainSDK from '../sdk/TrustChain'
import toast from 'react-hot-toast'

const SESSIONS = [
  { id:'keystroke', icon:'⌨️', title:'Keystroke Rhythm', subtitle:'Type this phrase at your natural pace. Your key timing is unique to you.', phrase:'I confirm this payment is mine', instruction:'Type naturally. Hold each key as you normally would.', signal:'Measuring: key hold duration, inter-key intervals, rhythm consistency', color:'var(--squad-orange)' },
  { id:'swipe', icon:'👆', title:'Swipe & Scroll Pattern', subtitle:'Scroll the page up and down 3 times after typing. Your scroll velocity is unique.', phrase:'My payments are mine alone', instruction:'After typing, scroll up and down 3 times slowly.', signal:'Measuring: scroll velocity, acceleration curve, deceleration signature', color:'var(--squad-pink)' },
  { id:'gyroscope', icon:'📱', title:'Device Orientation', subtitle:'Tilt your phone slightly left, right, then back to normal while typing.', phrase:'TrustChain learns my movement', instruction:'Tilt phone left → right → center while typing. Natural movements only.', signal:'Measuring: gyroscope alpha/beta/gamma, tilt angle, hand tremor signature', color:'#3B82F6' },
  { id:'tap', icon:'🎯', title:'Tap Accuracy & Pressure', subtitle:'Tap the buttons below 3 times each. Your tap pressure and placement are unique.', phrase:'Secure by my behavior', instruction:'Tap the phrase field and buttons with your natural force.', signal:'Measuring: touch force, finger radius, tap offset from center, contact area', color:'var(--gold)' },
  { id:'combined', icon:'🧠', title:'Full Behavioral Profile', subtitle:'Final session — interact completely naturally. Your complete fingerprint is being locked in.', phrase:'This is my unique pattern', instruction:'Type, scroll, tap — completely naturally.', signal:'Measuring: all 6 signals simultaneously — your complete biometric fingerprint', color:'var(--green)' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [typed, setTyped] = useState('')
  const [gyroData, setGyroData] = useState({ alpha:0, beta:0, gamma:0 })
  const [gyroPermission, setGyroPermission] = useState('pending')
  const [tapCount, setTapCount] = useState(0)
  const sdkRef = useRef(null)

  useEffect(() => {
    usersAPI.getProfile().then(({ data }) => {
      if (data.is_enrolled || data.enrollment_sessions >= 3) navigate('/dashboard', { replace:true })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (step >= 1 && step <= 5 && user?.user_id) {
      setTimeout(() => { sdkRef.current = new TrustChainSDK('ob-form', user.user_id) }, 400)
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission().then(p => setGyroPermission(p === 'granted' ? 'granted' : 'denied')).catch(() => setGyroPermission('denied'))
      } else { setGyroPermission('granted') }
      const handler = e => setGyroData({ alpha: e.alpha ? Math.round(e.alpha) : 0, beta: e.beta ? Math.round(e.beta) : 0, gamma: e.gamma ? Math.round(e.gamma) : 0 })
      window.addEventListener('deviceorientation', handler)
      return () => { if (sdkRef.current) { sdkRef.current.destroy(); sdkRef.current = null }; window.removeEventListener('deviceorientation', handler) }
    }
  }, [step])

  const handleSession = async () => {
    if (!sdkRef.current || typed.trim().length < 4) { toast.error('Type the phrase first'); return }
    setLoading(true)
    const bd = await sdkRef.current.collect()
    try { await paymentsAPI.verifySession({ behavioralData: bd, paymentAmount: 1, recipientBankCode: '000014', recipientAccount: '0000000000' }) } catch {}
    setTyped(''); setTapCount(0)
    if (step === 5) { updateUser({ is_enrolled: true, enrollment_sessions: 5 }); setStep(6) }
    else { toast.success(`Session ${step} of 5 complete`); setStep(s => s + 1) }
    setLoading(false)
  }

  const session = step >= 1 && step <= 5 ? SESSIONS[step - 1] : null
  const isGyro = session?.id === 'gyroscope' || session?.id === 'combined'
  const isTap = session?.id === 'tap' || session?.id === 'combined'

  // ── INTRO ──
  if (step === 0) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', background:'#07050A' }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize:'80px 80px', pointerEvents:'none' }} />
      <div style={{ maxWidth:560, width:'100%', position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div className="anim-fade-up" style={{ marginBottom:32 }}>
          <TrustChainLogo height={26} showTagline />
        </div>

        <div className="anim-fade-up d1" style={{ textAlign:'center', marginBottom:36 }}>
          <div className="anim-float" style={{ display:'inline-block', marginBottom:24 }}>
            <div style={{ width:96, height:96, borderRadius:28, margin:'0 auto', border:'1px solid rgba(244,82,30,0.3)', background:'rgba(244,82,30,0.05)', display:'flex', alignItems:'center', justifyContent:'center', animation:'rotate3d 8s ease-in-out infinite', boxShadow:'0 0 60px rgba(244,82,30,0.12)' }}>
              <Fingerprint size={46} color="var(--squad-orange)" strokeWidth={1} />
            </div>
          </div>
          <h1 style={{ fontFamily:'"Georgia","Times New Roman",serif', fontSize:36, fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:12 }}>
            Before your first payment,<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>we need to meet you.</em>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:15, lineHeight:1.75, maxWidth:420, margin:'0 auto 28px' }}>
            TrustChain runs <strong style={{ color:'#fff' }}>5 behavioral sessions</strong> to build your unique fingerprint. Each captures a different signal.
          </p>
        </div>

        {/* 5 session preview */}
        <div className="anim-fade-up d2" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:24 }}>
          {SESSIONS.map(s => (
            <div key={s.id} style={{ background:'#0E0A0C', border:`1px solid ${s.color}25`, borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color:s.color, fontFamily:'var(--mono)', letterSpacing:'0.5px', lineHeight:1.3 }}>
                {s.title.split(' ')[0]}<br />{s.title.split(' ').slice(1).join(' ')}
              </div>
            </div>
          ))}
        </div>

        {/* Gyro permission */}
        <div className="anim-fade-up d3" style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:'12px 16px', marginBottom:20, display:'flex', gap:12, alignItems:'center' }}>
          <Smartphone size={18} color="#3B82F6" style={{ flexShrink:0 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>Enable Motion Sensors</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)' }}>TrustChain uses your device's gyroscope to capture tilt patterns. Works best on mobile.</div>
          </div>
          {gyroPermission === 'pending' && (
            <button className="btn btn-ghost" style={{ fontSize:12, padding:'6px 12px', flexShrink:0 }}
              onClick={() => { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { DeviceOrientationEvent.requestPermission().then(p => setGyroPermission(p === 'granted' ? 'granted' : 'denied')).catch(() => setGyroPermission('denied')) } else setGyroPermission('granted') }}>
              Allow
            </button>
          )}
          {gyroPermission === 'granted' && <CheckCircle size={18} color="var(--green)" style={{ flexShrink:0 }} />}
        </div>

        <div className="anim-fade-up d4">
          <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(1)}>
            Start Behavioral Training <ArrowRight size={16} />
          </button>
          <p style={{ textAlign:'center', marginTop:12, fontSize:12, color:'rgba(255,255,255,0.25)', fontFamily:'var(--mono)' }}>~3 minutes · fully private · one-time only</p>
        </div>
      </div>
    </div>
  )

  // ── COMPLETE ──
  if (step === 6) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', background:'#07050A' }}>
      <div style={{ maxWidth:480, width:'100%', textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ marginBottom:28 }}>
          <TrustChainLogo height={24} style={{ justifyContent:'center' }} />
        </div>
        <div className="anim-fade-up" style={{ width:88, height:88, borderRadius:'50%', margin:'0 auto 24px', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 60px rgba(34,197,94,0.12)' }}>
          <CheckCircle size={40} color="var(--green)" strokeWidth={1.5} />
        </div>
        <h1 className="anim-fade-up d1" style={{ fontFamily:'"Georgia",serif', fontSize:36, fontWeight:700, letterSpacing:'-1px', marginBottom:10 }}>You're protected.</h1>
        <p className="anim-fade-up d2" style={{ color:'rgba(255,255,255,0.45)', fontSize:15, lineHeight:1.7, marginBottom:22 }}>
          Your behavioral fingerprint is active across 5 signal dimensions.
        </p>
        <div className="card anim-fade-up d3" style={{ padding:'14px 20px', textAlign:'left', marginBottom:24 }}>
          {['Keystroke dynamics enrolled','Swipe velocity pattern set','Gyroscope tilt signature locked','Touch pressure profile active','Full behavioral fingerprint complete'].map((t, i) => (
            <div key={t} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <CheckCircle size={13} color="var(--green)" style={{ flexShrink:0 }} />
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>{t}</span>
            </div>
          ))}
        </div>
        <button className="anim-fade-up d4 btn btn-primary btn-full btn-lg" onClick={() => navigate('/dashboard', { replace:true })}>
          Go to Dashboard <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  // ── TRAINING SESSIONS 1–5 ──
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', position:'relative', background:'#07050A', overflowY:'auto' }}>
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize:'80px 80px', pointerEvents:'none' }} />
      <div style={{ maxWidth:560, width:'100%', position:'relative', zIndex:1, paddingBottom:24 }}>

        {/* Logo + progress */}
        <div className="anim-fade-up" style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <TrustChainLogo height={20} />
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)' }}>Session {step} of 5</span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:2, height:2, overflow:'hidden' }}>
            <div style={{ height:'100%', borderRadius:2, background:session.color, width:`${((step-1)/5 + 0.2)*100}%`, transition:'width 0.5s cubic-bezier(0.23,1,0.32,1)', boxShadow:`0 0 8px ${session.color}` }} />
          </div>
          <div style={{ display:'flex', gap:8, marginTop:10, justifyContent:'center' }}>
            {SESSIONS.map((s, i) => (
              <div key={s.id} style={{ height:4, borderRadius:2, width: i+1 < step ? 28 : i+1 === step ? 16 : 8, background: i+1 < step ? 'var(--green)' : i+1 === step ? session.color : 'rgba(255,255,255,0.08)', transition:'all 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Session card */}
        <div className="card anim-fade-up d1" id="ob-form" style={{ padding:24, marginBottom:12 }}>
          {/* Sensor active */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, background:`${session.color}08`, border:`1px solid ${session.color}20`, borderRadius:8, padding:'8px 12px' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:session.color, animation:'pulse-glow 1.5s infinite' }} />
            <span style={{ fontSize:11, color:session.color, fontFamily:'var(--mono)', letterSpacing:'0.5px', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {session.signal}
            </span>
          </div>

          {/* Icon + title */}
          <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:18 }}>
            <div style={{ width:50, height:50, borderRadius:14, flexShrink:0, background:`${session.color}10`, border:`1px solid ${session.color}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{session.icon}</div>
            <div>
              <h2 style={{ fontSize:19, fontWeight:700, marginBottom:4 }}>{session.title}</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>{session.subtitle}</p>
            </div>
          </div>

          {/* Phrase */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:`1px dashed ${session.color}40`, borderRadius:8, padding:'12px 16px', marginBottom:14, fontFamily:'var(--mono)', fontSize:14, color:session.color, letterSpacing:'0.5px' }}>
            "{session.phrase}"
          </div>

          <div className="input-group" style={{ marginBottom:16 }}>
            <label className="input-label">Type the phrase above</label>
            <input className="input-field" placeholder="Start typing naturally..." value={typed} onChange={e => setTyped(e.target.value)} autoFocus autoComplete="off" style={{ fontSize:15 }} />
            {typed.length > 0 && <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', marginTop:4, fontFamily:'var(--mono)' }}>{typed.length} chars captured</div>}
          </div>

          {/* Gyroscope visualizer */}
          {isGyro && (
            <div style={{ marginBottom:16, background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#3B82F6', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <Smartphone size={14} /> Gyroscope Live Data
                {gyroPermission === 'denied' && <span style={{ fontSize:10, color:'var(--gold)', marginLeft:'auto' }}>⚠ Grant access above</span>}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[{ label:'Alpha (Z)', value:gyroData.alpha, color:'#3B82F6', desc:'Rotation' }, { label:'Beta (X)', value:gyroData.beta, color:'var(--squad-orange)', desc:'Fwd/back' }, { label:'Gamma (Y)', value:gyroData.gamma, color:'var(--squad-pink)', desc:'Left/right' }].map(({ label, value, color, desc }) => (
                  <div key={label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:8, padding:'10px 12px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)', marginBottom:4 }}>{label}</div>
                    <div style={{ fontSize:20, fontWeight:700, fontFamily:'var(--mono)', color, lineHeight:1 }}>{value}<span style={{ fontSize:11 }}>°</span></div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:4 }}>{desc}</div>
                    <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:2, height:3, marginTop:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:2, background:color, width:`${Math.min(100,Math.abs(value)/180*100)}%`, transition:'width 0.1s' }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:8, textAlign:'center' }}>→ Tilt your phone left, right, forward and back while typing</div>
            </div>
          )}

          {/* Tap pressure zone */}
          {isTap && (
            <div style={{ marginBottom:16, background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--gold)', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                <Hand size={14} /> Tap Pressure Test — tap each button 3×
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {['Tap A','Tap B','Tap C'].map(label => (
                  <button key={label} onClick={() => setTapCount(t => t+1)} style={{ padding:'14px', borderRadius:10, border:'1px solid rgba(245,158,11,0.2)', background:'rgba(245,158,11,0.05)', color:'var(--gold)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)' }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize:11, color: tapCount >= 9 ? 'var(--green)' : 'rgba(255,255,255,0.3)', marginTop:8, textAlign:'center', fontFamily:'var(--mono)' }}>
                {tapCount}/9 taps captured {tapCount >= 9 ? '✓' : ''}
              </div>
            </div>
          )}

          {/* Swipe instruction */}
          {session.id === 'swipe' && (
            <div style={{ marginBottom:16, background:'rgba(196,24,92,0.05)', border:'1px solid rgba(196,24,92,0.15)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--squad-pink)', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <Move size={14} /> Swipe Pattern Recording
              </div>
              {['Scroll slowly to the bottom','Scroll back to the top','Scroll down one more time'].map((t, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:8 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', border:'1px solid var(--squad-pink)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--squad-pink)', fontFamily:'var(--mono)', flexShrink:0 }}>{i+1}</div>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Wave visualizer */}
          <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:28, marginBottom:16 }}>
            {Array.from({ length:32 }, (_, i) => (
              <div key={i} style={{ flex:1, borderRadius:1, background: typed.length > i*1.5 ? session.color : 'rgba(255,255,255,0.06)', height:`${16+Math.sin(i*0.7)*10}px`, transition:'background 0.15s', opacity: typed.length > i*1.5 ? 0.7+Math.sin(i)*0.3 : 0.3 }} />
            ))}
          </div>

          <button className="btn btn-primary btn-full" onClick={handleSession} disabled={loading || typed.trim().length < 4} style={{ fontSize:15, padding:'14px' }}>
            {loading
              ? <><span className="spinner" style={{ borderColor:'rgba(255,255,255,0.2)', borderTopColor:'#fff' }} />Analyzing...</>
              : step === 5 ? '✓ Complete Training' : `Continue → Session ${step+1} of 5`}
          </button>
        </div>

        {/* Tip */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
          <span style={{ fontSize:14 }}>💡</span>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>{session.instruction}</span>
        </div>
      </div>
    </div>
  )
}
