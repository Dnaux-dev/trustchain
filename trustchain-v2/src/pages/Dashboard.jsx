import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, AlertTriangle, Clock, Zap, Wallet, Shield, TrendingUp, Plus, Activity, ArrowUpRight, ArrowDownLeft, Smartphone, Wifi, CreditCard, Users, Home } from 'lucide-react'
import { dashboardAPI, usersAPI, banksAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import { ScoreRing } from '../components/UI'
import LinkBankModal from '../components/LinkBankModal'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const MOCK_CHART = [
  {t:'Mon',score:62},{t:'Tue',score:71},{t:'Wed',score:68},{t:'Thu',score:75},
  {t:'Fri',score:79},{t:'Sat',score:74},{t:'Sun',score:82},
]

function BottomNav() {
  const loc = window.location
  const active = p => loc.pathname === p
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:300, background:'rgba(7,5,10,0.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-around', padding:'10px 0 max(10px, env(safe-area-inset-bottom))' }}>
      {[
        { path:'/dashboard', icon:Home,        label:'Home' },
        { path:'/pay',       icon:CreditCard,  label:'Pay' },
        { path:'/fraud-feed',icon:Activity,    label:'Feed' },
        { path:'/alerts',    icon:Shield,      label:'Alerts' },
        { path:'/helpers',   icon:Users,       label:'Helpers' },
      ].map(({ path, icon:Icon, label }) => (
        <a key={path} href={path} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 12px', color: active(path) ? 'var(--squad-orange)' : 'rgba(255,255,255,0.28)', transition:'color 0.15s', textDecoration:'none' }}>
          <Icon size={20} strokeWidth={active(path) ? 2.5 : 1.5} />
          <span style={{ fontSize:9, fontWeight: active(path) ? 700 : 400 }}>{label}</span>
        </a>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [profile, setProfile] = useState(null)
  const [linkedBanks, setLinkedBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLinkBank, setShowLinkBank] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  const loadBanks = async () => {
    try { const { data } = await banksAPI.getLinkedBanks(); setLinkedBanks(data) } catch {}
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sess, prof] = await Promise.all([
          dashboardAPI.getStats(), usersAPI.getSessions(6), usersAPI.getProfile(),
        ])
        setStats(s.data); setSessions(sess.data); setProfile(prof.data)
        updateUser({ is_enrolled: s.data.is_enrolled, enrollment_sessions: s.data.enrollment_sessions })
        const sessionsCompleted = s.data.enrollment_sessions || 0
        const enrolled = s.data.is_enrolled || user?.is_enrolled
        if (sessionsCompleted === 0 && !enrolled) { navigate('/onboarding', { replace:true }); return }
        await loadBanks()
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#07050A' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:52, height:52, borderRadius:14, margin:'0 auto 14px', border:'1px solid rgba(244,82,30,0.2)', background:'rgba(244,82,30,0.05)', display:'flex', alignItems:'center', justifyContent:'center', animation:'rotate3d 3s ease-in-out infinite' }}>
          <Shield size={22} color="var(--squad-orange)" />
        </div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)' }}>Loading...</div>
      </div>
    </div>
  )

  const avg = stats?.average_behavioral_score || 0
  const health = avg >= 75 ? 'Excellent' : avg >= 60 ? 'Good' : avg >= 45 ? 'Fair' : 'Poor'
  const healthColor = avg >= 75 ? 'var(--green)' : avg >= 60 ? 'var(--green)' : avg >= 45 ? 'var(--gold)' : 'var(--red)'
  const primaryBank = linkedBanks.find(b => b.is_primary)

  return (
    <div style={{ background:'#07050A', minHeight:'100vh' }}>
      <div className="page" style={{ padding: isMobile ? '72px 16px 100px' : '80px 24px 48px', maxWidth:1100, margin:'0 auto' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--squad-orange)', animation:'pulse-glow 2s infinite' }} />
              <span style={{ fontSize:11, color:'var(--squad-orange)', fontFamily:'var(--mono)', letterSpacing:'0.5px' }}>
                {(stats?.is_enrolled || stats?.enrollment_sessions >= 3) ? 'PROTECTED' : 'ENROLLING'}
              </span>
            </div>
            <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight:700, letterSpacing:'-0.8px', marginBottom:2, fontFamily:'"Georgia",serif' }}>
              Good {new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'},{' '}
              <span style={{ color:'var(--squad-orange)' }}>{user?.full_name?.split(' ')[0]}</span>
            </h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Your behavioral security · powered by Squad</p>
          </div>
          {!isMobile && (
            <Link to="/pay" className="btn btn-primary"><Zap size={15} /> New Payment</Link>
          )}
        </div>

        {/* Enrollment banner */}
        {!(stats?.is_enrolled || stats?.enrollment_sessions >= 3) && stats?.enrollment_sessions > 0 && (
          <div className="anim-fade-up d1" style={{ padding:'14px 18px', marginBottom:16, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:12, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
            <Activity size={18} color="var(--gold)" style={{ flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{5 - stats.enrollment_sessions} session{5-stats.enrollment_sessions!==1?'s':''} remaining to complete enrollment</div>
              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:2, height:3, overflow:'hidden', maxWidth:180 }}>
                <div style={{ height:'100%', borderRadius:2, background:'var(--gold)', width:`${(stats.enrollment_sessions/5)*100}%` }} />
              </div>
            </div>
            <Link to="/onboarding" className="btn btn-ghost" style={{ fontSize:12, padding:'6px 12px' }}>Continue →</Link>
          </div>
        )}

        {/* WALLET CARD */}
        <div className="card anim-fade-up d1 card-3d" style={{ marginBottom:14, padding: isMobile ? '20px' : '24px 28px', background:'#0A0608', border:'1px solid rgba(244,82,30,0.2)', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(105deg, transparent 30%, rgba(244,82,30,0.025) 50%, transparent 70%)', backgroundSize:'200% 100%', animation:'shimmer 5s linear infinite', pointerEvents:'none' }} />

          <div style={{ position:'relative', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap:20 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--squad-orange)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Wallet size={18} color="#fff" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', fontFamily:'var(--mono)', letterSpacing:'1px', textTransform:'uppercase' }}>Squad Wallet</div>
                  <div style={{ fontSize:12, color:'var(--squad-orange)', fontWeight:600 }}>TrustChain Protected</div>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)', letterSpacing:'1px', marginBottom:5 }}>AVAILABLE BALANCE</div>
                <div style={{ fontFamily:'"Georgia",serif', fontSize: isMobile ? 36 : 44, fontWeight:700, letterSpacing:'-1px', lineHeight:1 }}>
                  <span style={{ fontSize: isMobile ? 18 : 22, color:'rgba(255,255,255,0.4)', marginRight:4 }}>₦</span>0.00
                </div>
                {primaryBank && (
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:6, display:'flex', alignItems:'center', gap:6 }}>
                    🏦 Primary: {primaryBank.nickname} ···{primaryBank.account_number?.slice(-4)}
                  </div>
                )}
              </div>

              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button className="btn btn-ghost" style={{ fontSize:13, padding:'9px 16px' }}>
                  <ArrowDownLeft size={14} /> Deposit
                </button>
                <button className="btn btn-ghost" style={{ fontSize:13, padding:'9px 16px' }}>
                  <ArrowUpRight size={14} /> Withdraw
                </button>
                <button className="btn btn-outline" style={{ fontSize:13, padding:'9px 16px' }} onClick={() => setShowLinkBank(true)}>
                  <Plus size={14} /> {linkedBanks.length === 0 ? 'Link Bank' : `Banks (${linkedBanks.length})`}
                </button>
              </div>
            </div>

            {/* Linked banks summary — desktop */}
            {!isMobile && linkedBanks.length > 0 && (
              <div style={{ minWidth:200 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Linked Banks</div>
                {linkedBanks.slice(0,3).map(b => (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:8, border: b.is_primary ? '1px solid rgba(244,82,30,0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize:14 }}>🏦</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.nickname}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', fontFamily:'var(--mono)' }}>···{b.account_number?.slice(-4)}</div>
                    </div>
                    {b.is_primary && <span className="badge badge-orange" style={{ fontSize:8 }}>Primary</span>}
                  </div>
                ))}
                <button onClick={() => setShowLinkBank(true)} style={{ fontSize:11, color:'var(--squad-orange)', background:'none', border:'none', cursor:'pointer', padding:0, marginTop:4, fontFamily:'var(--font)' }}>
                  Manage banks →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="anim-fade-up d2" style={{ display:'grid', gridTemplateColumns:`repeat(${isMobile?4:6},1fr)`, gap:10, marginBottom:14 }}>
          {[
            { label:'Send', icon:'💸', action:() => navigate('/pay') },
            { label:'Airtime', icon:'📱', action:() => {} },
            { label:'Data', icon:'📶', action:() => {} },
            { label:'Pay Bills', icon:'🧾', action:() => {} },
            ...(!isMobile ? [
              { label:'Link Bank', icon:'🏦', action:() => setShowLinkBank(true) },
              { label:'More', icon:'⋯', action:() => {} },
            ] : []),
          ].map(({ label, icon, action }) => (
            <button key={label} onClick={action} style={{ background:'#0E0A0C', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'14px 8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.15s', fontFamily:'var(--font)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(244,82,30,0.2)'; e.currentTarget.style.background='rgba(244,82,30,0.04)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='#0E0A0C' }}>
              <span style={{ fontSize:22 }}>{icon}</span>
              <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="anim-fade-up d2" style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'Total Sessions', value: stats?.total_sessions||0,  color:'rgba(255,255,255,0.6)', icon:'🔢' },
            { label:'Protected',      value:`₦${((stats?.total_amount_protected_naira||0)/1000).toFixed(0)}K`, color:'var(--squad-orange)', icon:'🛡' },
            { label:'Linked Banks',   value: linkedBanks.length, color:'#3B82F6', icon:'🏦' },
            { label:'Status',         value:(stats?.is_enrolled||stats?.enrollment_sessions>=3)?'Active':`${stats?.enrollment_sessions||0}/5`, color:(stats?.is_enrolled||stats?.enrollment_sessions>=3)?'var(--green)':'var(--gold)', icon:'✓' },
          ].map(({ label, value, color, icon }, i) => (
            <div key={label} className="card anim-fade-up" style={{ padding:'16px 18px', animationDelay:`${i*0.05}s` }}>
              <div style={{ fontSize:18, marginBottom:8 }}>{icon}</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight:700, fontFamily:'var(--mono)', color, lineHeight:1, marginBottom:4 }}>{value}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Airtime + Data */}
        <div className="anim-fade-up d3" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10, marginBottom:14 }}>
          <div className="card" style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(244,82,30,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Smartphone size={16} color="var(--squad-orange)" />
              </div>
              <div style={{ fontWeight:700, fontSize:14 }}>Buy Airtime</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
              {['₦50','₦100','₦200','₦500'].map(amt => (
                <button key={amt} style={{ padding:'8px 4px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)' }}>{amt}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input className="input-field" placeholder="Phone number" style={{ flex:1, fontSize:13, padding:'10px 12px' }} />
              <button className="btn btn-primary" style={{ padding:'10px 16px', fontSize:13 }}>Buy</button>
            </div>
          </div>
          <div className="card" style={{ padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Wifi size={16} color="#3B82F6" />
              </div>
              <div style={{ fontWeight:700, fontSize:14 }}>Buy Data</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:12 }}>
              {['1GB','2GB','5GB','10GB'].map(plan => (
                <button key={plan} style={{ padding:'8px 4px', borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)' }}>{plan}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <select className="input-field" style={{ flex:1, fontSize:13, padding:'10px 12px' }}>
                <option>MTN</option><option>Airtel</option><option>Glo</option><option>9mobile</option>
              </select>
              <button className="btn btn-primary" style={{ padding:'10px 16px', fontSize:13 }}>Buy</button>
            </div>
          </div>
        </div>

        {/* Chart + Sessions */}
        <div className="anim-fade-up d3" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap:12 }}>
          <div className="card" style={{ padding:'18px 20px 12px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700 }}>Score Trend</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>Last 7 days</div>
              </div>
              <span className="badge badge-orange">Live</span>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 140 : 180}>
              <AreaChart data={MOCK_CHART} margin={{ top:5, right:5, bottom:0, left:-20 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--squad-orange)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--squad-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11, fontFamily:'var(--mono)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'#130D10', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, fontSize:12 }} />
                <Area type="monotone" dataKey="score" stroke="var(--squad-orange)" strokeWidth={2} fill="url(#sg)" dot={{ fill:'var(--squad-orange)', r:3, strokeWidth:0 }} activeDot={{ r:5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:14, fontWeight:700 }}>Recent Sessions</div>
              <span className="badge badge-gray">{sessions.length}</span>
            </div>
            <div style={{ overflowY:'auto', maxHeight: isMobile ? 200 : 240 }}>
              {sessions.length === 0 ? (
                <div style={{ padding:'28px 18px', textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:13 }}>
                  No sessions yet. <Link to="/pay" style={{ color:'var(--squad-orange)', fontWeight:600 }}>Make your first payment →</Link>
                </div>
              ) : sessions.map((s, i) => {
                const ok = s.decision==='COMPLETE'||s.decision==='APPROVED'
                const ch = s.decision==='CHALLENGE'
                const color = ok ? 'var(--green)' : ch ? 'var(--gold)' : 'var(--red)'
                return (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', borderBottom: i<sessions.length-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
                    <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:`${color}12` }}>
                      {ok?<CheckCircle size={13} color={color}/>:ch?<AlertTriangle size={13} color={color}/>:<XCircle size={13} color={color}/>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>₦{s.payment_amount?.toLocaleString()}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)' }}>{new Date(s.created_at).toLocaleTimeString()}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:15, fontWeight:700, fontFamily:'var(--mono)', color }}>{s.behavioral_score?.toFixed(0)}</div>
                      <div className={`badge badge-${ok?'green':ch?'gold':'red'}`} style={{ fontSize:9, marginTop:2 }}>{s.decision}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
              <Link to="/pay" className="btn btn-primary btn-full" style={{ fontSize:13, padding:'10px' }}>
                <Zap size={13} /> Make Payment
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && <BottomNav />}

      {/* Link Bank Modal */}
      <LinkBankModal
        isOpen={showLinkBank}
        onClose={() => setShowLinkBank(false)}
        linkedBanks={linkedBanks}
        onRefresh={loadBanks}
      />
    </div>
  )
}
