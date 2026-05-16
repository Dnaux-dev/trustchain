import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Fingerprint, Zap, Lock, CheckCircle, Activity, MapPin, Code } from 'lucide-react'
import TrustChainLogo from '../components/TrustChainLogo'

const LOCATIONS = ["Yaba, Lagos","Ikeja, Lagos","Wuse 2, Abuja","GRA, Port Harcourt","Kano Municipal","Bodija, Ibadan","Asaba, Delta","Uyo, Akwa Ibom","Aba, Abia","Trans-Ekulu, Enugu"]
const FRAUD_TYPES = ["SIM-swap keystroke mismatch","Abnormal touch pressure (3.1×)","Device orientation anomaly","Paste-based account takeover","High-speed form fill detected","Tap offset pattern mismatch","Gyroscope tilt deviation","Inter-key interval anomaly"]
const rnd = arr => arr[Math.floor(Math.random() * arr.length)]
const randAmt = () => Math.floor(Math.random() * 190000) + 10000
const randScore = () => Math.floor(Math.random() * 40) + 5

export default function Landing() {
  const [feed, setFeed] = useState([
    { id:'1', location:'Yaba, Lagos', fraud_type:'SIM-swap keystroke mismatch', amount:85000, score:18 },
    { id:'2', location:'Wuse 2, Abuja', fraud_type:'Paste-based account takeover', amount:240000, score:12 },
    { id:'3', location:'GRA, Port Harcourt', fraud_type:'Abnormal touch pressure (3.1×)', amount:47000, score:31 },
    { id:'4', location:'Ikeja, Lagos', fraud_type:'High-speed form fill detected', amount:180000, score:9 },
  ])
  const [totalBlocked, setTotalBlocked] = useState(4_217_450)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const timerRef = useRef(null)

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        const amt = randAmt()
        const ev = { id: Date.now().toString(), location: rnd(LOCATIONS), fraud_type: rnd(FRAUD_TYPES), amount: amt, score: randScore(), isNew: true }
        setFeed(prev => [ev, ...prev].slice(0, 6))
        setTotalBlocked(t => t + amt)
        setTimeout(() => setFeed(prev => prev.map(e => e.id === ev.id ? { ...e, isNew: false } : e)), 700)
        schedule()
      }, 3500 + Math.random() * 3000)
    }
    schedule()
    return () => { window.removeEventListener('resize', r); if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const px = isMobile ? '20px' : '48px'

  return (
    <div style={{ minHeight: '100vh', background: '#07050A', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)', backgroundSize:'80px 80px' }} />
      <div style={{ position:'fixed', top:-200, left:'50%', transform:'translateX(-50%)', width:500, height:360, borderRadius:'50%', background:'radial-gradient(ellipse, rgba(244,82,30,0.055) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

      {/* NAVBAR */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:200, height:64, display:'flex', alignItems:'center', padding:`0 ${px}`, justifyContent:'space-between', background:'rgba(7,5,10,0.94)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <TrustChainLogo height={22} />
          <div style={{ fontSize:8, color:'rgba(255,255,255,0.25)', fontFamily:'var(--mono)', letterSpacing:'1.5px', textTransform:'uppercase', borderLeft:'1px solid rgba(255,255,255,0.1)', paddingLeft:8 }}>by Squad</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to="/login" className="btn btn-ghost" style={{ padding:'7px 16px', fontSize:13 }}>Sign in</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding:'7px 16px', fontSize:13 }}>Get Started <ArrowRight size={13} /></Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile ? '90px 20px 60px' : '100px 48px 80px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, width:'100%', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 80, alignItems:'center' }}>
          <div>
            <div className="anim-fade-up" style={{ marginBottom:20 }}>
              <TrustChainLogo height={isMobile ? 28 : 36} showTagline />
            </div>

            <div className="anim-fade-up d1" style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:24, border:'1px solid rgba(244,82,30,0.3)', borderRadius:4, padding:'5px 12px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--squad-orange)', animation:'pulse-glow 2s infinite' }} />
              <span style={{ fontSize:11, color:'var(--squad-orange)', fontFamily:'var(--mono)', letterSpacing:'1px', textTransform:'uppercase' }}>Squad Hackathon 3.0 · Challenge 01</span>
            </div>

            <h1 className="anim-fade-up d2" style={{ fontFamily:'"Georgia","Times New Roman",serif', fontSize: isMobile ? 52 : 78, fontWeight:900, letterSpacing:'-3px', lineHeight:0.95, marginBottom:24, color:'#fff' }}>
              Your<br />behavior<br /><span style={{ fontStyle:'italic', color:'var(--squad-orange)', fontWeight:400, fontSize: isMobile ? 56 : 84 }}>is the key.</span>
            </h1>

            <p className="anim-fade-up d3" style={{ fontSize:16, color:'rgba(255,255,255,0.5)', lineHeight:1.75, marginBottom:36, maxWidth:420 }}>
              TrustChain replaces OTPs and PINs with behavioral biometrics. The unique way you type, swipe, and move. Powered by Squad API.
            </p>

            <div className="anim-fade-up d4" style={{ display:'flex', gap:10, marginBottom:48, flexWrap:'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">Start Free <ArrowRight size={16} /></Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
            </div>

            <div className="anim-fade-up d5" style={{ display:'flex', gap: isMobile ? 28 : 40, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:24 }}>
              {[{ num:'6', label:'Behavioral signals' }, { num:'₦4.2M', label:'Blocked today' }, { num:'0', label:'OTPs needed' }].map(({ num, label }) => (
                <div key={label}>
                  <div style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 28 : 36, fontWeight:700, color:'#fff', lineHeight:1, marginBottom:4 }}>{num}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fingerprint visual — desktop only */}
          {!isMobile && (
            <div className="anim-fade-up d3" style={{ position:'relative', height:480, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {[420,340,260].map((size,i) => (
                <div key={size} style={{ position:'absolute', width:size, height:size, borderRadius:'50%', border:`1px solid rgba(244,82,30,${0.06+i*0.04})`, animation:`float ${6+i*2}s ease-in-out infinite ${i%2===0?'':'reverse'}` }} />
              ))}
              <div style={{ width:140, height:140, borderRadius:36, border:'1px solid rgba(244,82,30,0.3)', background:'rgba(244,82,30,0.05)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', zIndex:2, animation:'rotate3d 8s ease-in-out infinite' }}>
                <Fingerprint size={64} color="var(--squad-orange)" strokeWidth={1} />
              </div>
              {[{ label:'Keystroke rhythm', angle:0, color:'var(--squad-orange)' }, { label:'Touch pressure', angle:72, color:'var(--squad-pink)' }, { label:'Swipe velocity', angle:144, color:'#3B82F6' }, { label:'Gyroscope tilt', angle:216, color:'var(--gold)' }, { label:'Tap accuracy', angle:288, color:'var(--green)' }].map(({ label, angle, color }) => {
                const rad=(angle*Math.PI)/180
                return (
                  <div key={label} style={{ position:'absolute', left:'50%', top:'50%', transform:`translate(calc(-50% + ${Math.cos(rad)*178}px), calc(-50% + ${Math.sin(rad)*178}px))`, zIndex:3 }}>
                    <div style={{ background:'#0E0A0C', border:`1px solid ${color}35`, borderRadius:5, padding:'5px 11px', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:color }} />
                      <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.6)', fontFamily:'var(--mono)' }}>{label}</span>
                    </div>
                  </div>
                )
              })}
              <div style={{ position:'absolute', bottom:20, right:-10, zIndex:4, background:'#0E0A0C', border:'1px solid rgba(34,197,94,0.2)', borderRadius:12, padding:'14px 18px', animation:'float 5s ease-in-out infinite' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)', letterSpacing:'1px', marginBottom:4 }}>BEHAVIORAL SCORE</div>
                <div style={{ fontFamily:'"Georgia",serif', fontSize:34, fontWeight:700, color:'var(--green)', lineHeight:1 }}>87</div>
                <div style={{ fontSize:11, color:'var(--green)', marginTop:6, display:'flex', alignItems:'center', gap:4 }}><CheckCircle size={10} /> Approved</div>
              </div>
              <div style={{ position:'absolute', top:40, left:-10, zIndex:4, background:'#0E0A0C', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'14px 18px', animation:'float 7s ease-in-out infinite reverse' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)', letterSpacing:'1px', marginBottom:4 }}>FRAUD DETECTED</div>
                <div style={{ fontFamily:'"Georgia",serif', fontSize:34, fontWeight:700, color:'var(--red)', lineHeight:1 }}>22</div>
                <div style={{ fontSize:11, color:'var(--red)', marginTop:6, display:'flex', alignItems:'center', gap:4 }}><Lock size={10} /> Blocked</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* LIVE FRAUD FEED PREVIEW */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '380px 1fr', gap:48, alignItems:'center' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--red)', animation:'pulse-glow 1.5s infinite' }} />
                <span style={{ fontSize:10, color:'var(--red)', fontFamily:'var(--mono)', letterSpacing:'2px', textTransform:'uppercase' }}>Live Intelligence</span>
              </div>
              <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 32 : 42, fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:14 }}>
                Real-time Fraud<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>happening now.</em>
              </h2>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, lineHeight:1.75, marginBottom:20 }}>
                Every fraud attempt blocked across Nigeria is logged live. Watch TrustChain protect Nigerian payments in real time — city by city.
              </p>
              <div style={{ fontFamily:'"Georgia",serif', fontSize:36, fontWeight:700, color:'var(--green)', marginBottom:4 }}>
                ₦{(totalBlocked / 1_000_000).toFixed(2)}M
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginBottom:20 }}>blocked today across Nigeria</div>
              <Link to="/register" className="btn btn-primary">Join the Shield <ArrowRight size={14} /></Link>
            </div>

            {/* Feed */}
            <div style={{ background:'#0A0608', border:'1px solid rgba(239,68,68,0.15)', borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--red)', animation:'pulse-glow 1.5s infinite' }} />
                <span style={{ fontSize:13, fontWeight:700 }}>Live Fraud Intercepts</span>
                <span className="badge badge-red" style={{ marginLeft:'auto', fontSize:10 }}>🇳🇬 Nigeria</span>
              </div>
              {feed.map(ev => (
                <div key={ev.id} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'11px 18px', borderBottom:'1px solid rgba(255,255,255,0.03)', background: ev.isNew ? 'rgba(239,68,68,0.05)' : 'transparent', transition:'background 0.6s', animation: ev.isNew ? 'fadeUp 0.3s ease' : 'none' }}>
                  <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Activity size={13} color="var(--red)" />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--red)', marginBottom:2 }}>
                      {ev.isNew && <span style={{ marginRight:6, fontSize:9, background:'var(--red)', color:'#fff', padding:'1px 5px', borderRadius:3, fontFamily:'var(--mono)' }}>NEW</span>}
                      BLOCKED — ₦{ev.amount?.toLocaleString()}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:3 }}>{ev.fraud_type}</div>
                    <div style={{ display:'flex', gap:10, fontSize:11, color:'rgba(255,255,255,0.25)', flexWrap:'wrap' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:3 }}><MapPin size={9} />{ev.location}</span>
                      <span style={{ fontFamily:'var(--mono)' }}>Score: {ev.score}/100</span>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.05)', textAlign:'center' }}>
                <Link to="/register" style={{ fontSize:12, color:'var(--squad-orange)', fontWeight:600 }}>
                  View full intelligence feed after signup →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ marginBottom:48 }}>
            <div style={{ fontSize:10, color:'var(--squad-orange)', fontFamily:'var(--mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>How It Works</div>
            <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 36 : 48, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1.1 }}>Three zones.<br />One truth.</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:2 }}>
            {[
              { score:'70–100', label:'APPROVED', color:'var(--green)', bg:'#0A0E0A', title:'Payment clears', desc:'Fingerprint matches. Squad payment fires.' },
              { score:'50–69', label:'CHALLENGE', color:'var(--gold)', bg:'#0E0C09', title:'Re-verify behavior', desc:'Slightly off. Behavioral re-challenge, no OTP.' },
              { score:'0–49', label:'BLOCKED', color:'var(--red)', bg:'#0E0909', title:'Fraud stopped', desc:'Mismatch. Squad never called. Alert fired.' },
            ].map(({ score, label, color, bg, title, desc }) => (
              <div key={label} style={{ padding:'36px 28px', background:bg, borderLeft:`3px solid ${color}`, border:`1px solid rgba(255,255,255,0.04)`, borderLeftColor:color, borderLeftWidth:3 }}>
                <div style={{ fontFamily:'"Georgia",serif', fontSize:44, fontWeight:700, color, lineHeight:1, marginBottom:10 }}>{score}</div>
                <div style={{ fontSize:10, fontFamily:'var(--mono)', color, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:14 }}>{label}</div>
                <div style={{ fontSize:16, fontWeight:700, marginBottom:8, color:'#fff' }}>{title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ marginBottom:44 }}>
            <div style={{ fontSize:10, color:'var(--squad-orange)', fontFamily:'var(--mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Platform Features</div>
            <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 34 : 44, fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.1 }}>Built for Nigeria.<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>Powered by Squad.</em></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap:10 }}>
            {[
              { icon:'🔴', title:'Live Fraud Feed', desc:'Real-time fraud intelligence across Nigeria. Every blocked payment logs live. Watch TrustChain fight fraud as it happens.', color:'var(--red)', badge:'Live' },
              { icon:'📈', title:'TrustScore™', desc:'Your behavioral credit score (0–1000). Built from payments, not documents. Higher score = higher limits + perks.', color:'var(--squad-orange)', badge:'New' },
              { icon:'⚠️', title:'Drift Detection', desc:'AI monitors if your behavioral pattern changes. Distinguishes natural drift from fraud. One-click profile refresh.', color:'var(--gold)', badge:'AI' },
              { icon:'👥', title:'Trusted Helpers', desc:'Family members make payments on your behalf using their own behavioral profile. Zero OTP needed.', color:'#3B82F6', badge:'' },
              { icon:'📶', title:'Offline Mode', desc:'Nigeria has unstable internet. TrustChain caches sessions locally and auto-syncs when connectivity returns.', color:'var(--green)', badge:'Nigeria-first' },
              { icon:'🔄', title:'Self-Learning Model', desc:'The Isolation Forest retrains nightly on real Nigerian behavioral data. Gets smarter with every payment made.', color:'#B37FEB', badge:'ML' },
            ].map(({ icon, title, desc, color, badge }) => (
              <div key={title} className="card" style={{ padding:'20px 18px', borderLeft:`2px solid ${color}30` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{icon}</span>
                  {badge && <span className="badge badge-orange" style={{ fontSize:10 }}>{badge}</span>}
                </div>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:6, color:'#fff' }}>{title}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODEL RETRAINING SECTION */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:60, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, color:'#B37FEB', fontFamily:'var(--mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Self-Learning AI</div>
            <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 32 : 42, fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:14 }}>
              Gets smarter<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>every day.</em>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, lineHeight:1.75, marginBottom:20 }}>
              TrustChain's Isolation Forest model retrains nightly on real Nigerian behavioral data. The more people use it, the harder it is to fool.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {[
                { day:'Day 1', desc:'Synthetic baseline model (good)', color:'rgba(255,255,255,0.4)' },
                { day:'Day 30', desc:'Trained on 1,000+ real sessions (great)', color:'var(--gold)' },
                { day:'Day 180', desc:'50,000+ sessions — elite accuracy', color:'var(--squad-orange)' },
                { day:'Day 365', desc:'Network effect — fraud has nowhere to hide', color:'var(--green)' },
              ].map(({ day, desc, color }) => (
                <div key={day} style={{ display:'flex', gap:14, alignItems:'center' }}>
                  <div style={{ fontSize:11, fontFamily:'var(--mono)', color, minWidth:60 }}>{day}</div>
                  <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
                  <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', maxWidth:220 }}>{desc}</div>
                </div>
              ))}
            </div>
            <div style={{ padding:'14px 16px', background:'rgba(179,127,235,0.06)', border:'1px solid rgba(179,127,235,0.15)', borderRadius:10 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#B37FEB', marginBottom:4 }}>Network Effect</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', lineHeight:1.6 }}>
                Every Nigerian who uses TrustChain makes the model smarter for everyone else. This is the flywheel that makes us defensible.
              </div>
            </div>
          </div>

          {/* Timeline visual */}
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {[
              { time:'11:00 PM', event:'Nightly retrain scheduled', color:'rgba(255,255,255,0.3)', icon:'⏰' },
              { time:'11:01 PM', event:'Pull all session vectors from MongoDB', color:'#3B82F6', icon:'📦' },
              { time:'11:04 PM', event:'Isolation Forest retrained on real data', color:'#B37FEB', icon:'🧠' },
              { time:'11:06 PM', event:'New model validated — accuracy +2.3%', color:'var(--gold)', icon:'✅' },
              { time:'11:07 PM', event:'Model deployed — all users protected', color:'var(--green)', icon:'🚀' },
            ].map(({ time, event, color, icon }) => (
              <div key={time} style={{ padding:'14px 18px', background:'#0E0A0C', border:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:14, alignItems:'center' }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 }}>{event}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontFamily:'var(--mono)' }}>{time}</div>
                </div>
                <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MERCHANT SDK */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:60, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, color:'var(--squad-orange)', fontFamily:'var(--mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>For Developers</div>
            <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 32 : 42, fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:14 }}>
              Merchant SDK.<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>3 lines of code.</em>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, lineHeight:1.75, marginBottom:20 }}>
              Any Nigerian e-commerce site, fintech, or marketplace can embed TrustChain behavioral protection into their checkout in minutes. Squad handles the payment.
            </p>
            {['Drop into any checkout page','Behavioral scoring on every transaction','Squad API enforces the AI verdict','Real-time fraud dashboard for merchants','Works offline — syncs on reconnect'].map(t => (
              <div key={t} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:9 }}>
                <CheckCircle size={13} color="var(--squad-orange)" style={{ flexShrink:0 }} />
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{t}</span>
              </div>
            ))}
          </div>

          <div style={{ background:'#0A0608', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>
            <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--red)', opacity:0.6 }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', opacity:0.6 }} />
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--green)', opacity:0.6 }} />
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)', marginLeft:8 }}>checkout.html</span>
            </div>
            <div style={{ padding:'20px 24px', fontFamily:'var(--mono)', fontSize:13, lineHeight:1.8 }}>
              {[
                { code:'<script src="trustchain.js"></script>', color:'rgba(255,255,255,0.5)' },
                { code:'', color:'' },
                { code:'<TrustChain', color:'#3B82F6' },
                { code:'  merchantId="TC_MERCHANT_123"', color:'var(--gold)' },
                { code:'  squadKey="sq_live_..."', color:'var(--gold)' },
                { code:'  onApprove={handlePayment}', color:'var(--gold)' },
                { code:'  onBlock={handleFraud}', color:'var(--red)' },
                { code:'/>', color:'#3B82F6' },
                { code:'', color:'' },
                { code:'// Behavioral protection active. 🛡', color:'rgba(255,255,255,0.25)' },
              ].map((line, i) => (
                <div key={i} style={{ color: line.color || 'rgba(255,255,255,0.5)' }}>{line.code || '\u00A0'}</div>
              ))}
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(34,197,94,0.04)', display:'flex', alignItems:'center', gap:8 }}>
              <div className="glow-dot" style={{ width:7, height:7 }} />
              <span style={{ fontSize:12, color:'var(--green)', fontFamily:'var(--mono)' }}>TrustChain active · Squad connected · 0 fraud passed</span>
            </div>
          </div>
        </div>
      </section>

      {/* SQUAD PIPELINE */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:60, alignItems:'start' }}>
          <div>
            <div style={{ fontSize:10, color:'var(--squad-orange)', fontFamily:'var(--mono)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Powered by Squad</div>
            <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 32 : 42, fontWeight:700, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:14 }}>
              The AI decides.<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>Squad enforces.</em>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:14, lineHeight:1.75, marginBottom:20 }}>
              Squad API is not a payment option. It is the enforcement layer. The behavioral score directly controls whether Squad releases the payment.
            </p>
            {['Account Lookup verifies recipient identity','Initiate Payment only fires if score ≥ 70','Transfer API for high-value transactions','Webhooks close the immutable audit trail'].map(t => (
              <div key={t} style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:'1px solid var(--squad-orange)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <CheckCircle size={9} color="var(--squad-orange)" />
                </div>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {[
              { step:'01', label:'Account Lookup', status:'Recipient verified', color:'var(--squad-orange)' },
              { step:'02', label:'Score: 82/100', status:'APPROVED — threshold cleared', color:'var(--green)' },
              { step:'03', label:'Initiate Payment', status:'Squad checkout generated', color:'var(--squad-orange)' },
              { step:'04', label:'Webhook', status:'Audit trail closed + alert sent', color:'rgba(255,255,255,0.25)' },
            ].map(({ step, label, status, color }) => (
              <div key={step} style={{ padding:'16px 20px', background:'#0E0A0C', border:'1px solid rgba(255,255,255,0.05)', display:'flex', gap:16, alignItems:'center' }}>
                <span style={{ fontSize:11, fontFamily:'var(--mono)', color:'rgba(255,255,255,0.2)', minWidth:24 }}>{step}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:12, color, fontFamily:'var(--mono)' }}>{status}</div>
                </div>
                <Zap size={14} color={color} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: isMobile ? '80px 20px 100px' : '100px 48px', borderTop:'1px solid rgba(255,255,255,0.05)', position:'relative', zIndex:1, textAlign:'center' }}>
        <div style={{ maxWidth:540, margin:'0 auto' }}>
          <div style={{ marginBottom:28 }}>
            <TrustChainLogo height={32} style={{ justifyContent:'center' }} />
          </div>
          <h2 style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 40 : 56, fontWeight:700, letterSpacing:'-2px', lineHeight:1.05, marginBottom:18 }}>
            Ready to move<br /><em style={{ color:'var(--squad-orange)', fontWeight:400 }}>like yourself?</em>
          </h2>
          <p style={{ color:'rgba(255,255,255,0.38)', fontSize:15, marginBottom:32, lineHeight:1.7 }}>
            60 seconds of training. A lifetime of behavioral protection. Built for Nigeria.
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize:15, padding:'15px 36px' }}>Get Started <ArrowRight size={16} /></Link>
            <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
          </div>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.18)', marginTop:24, fontFamily:'var(--mono)', letterSpacing:'0.5px' }}>
            "We don't ask if you know your password. We ask if you move like yourself."
          </p>
        </div>
      </section>

      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.05)', padding: isMobile ? '16px 20px' : '20px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, position:'relative', zIndex:1 }}>
        <TrustChainLogo height={18} />
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.2)', fontFamily:'var(--mono)' }}>Squad Hackathon 3.0 · Behavioral Biometric Payment Security</span>
      </footer>
    </div>
  )
}
