import { useState, useEffect, useRef } from 'react'
import { Shield, AlertTriangle, TrendingUp, MapPin, Zap, Activity, Eye, Clock } from 'lucide-react'
import { intelligenceAPI } from '../api/client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'

const LOCATIONS = [
  "Yaba, Lagos","Ikeja, Lagos","Victoria Island","Lekki Phase 1",
  "Wuse 2, Abuja","Maitama, Abuja","Garki, Abuja",
  "GRA, Port Harcourt","Kano Municipal","Bodija, Ibadan",
  "GRA, Enugu","Trans-Ekulu, Enugu","Ring Road, Benin",
  "Uyo, Akwa Ibom","Aba, Abia","Asaba, Delta",
]
const FRAUD_TYPES = [
  "SIM-swap keystroke mismatch",
  "Abnormal touch pressure (3.2×)",
  "Device orientation anomaly",
  "Paste-based account takeover",
  "High-speed form fill (bot-like)",
  "Tap offset pattern mismatch",
  "Gyroscope tilt deviation",
  "Inter-key interval anomaly",
]

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomAmount() { return Math.floor(Math.random() * 190000) + 10000 }
function randomScore() { return Math.floor(Math.random() * 45) + 5 }

export default function WarRoom() {
  const [data, setData] = useState(null)
  const [liveFeed, setLiveFeed] = useState([])
  const [totalBlocked, setTotalBlocked] = useState(4_200_000)
  const [activeCount, setActiveCount] = useState(12847)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const feedRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  useEffect(() => {
    intelligenceAPI.getWarRoom().then(res => {
      setData(res.data)
      setLiveFeed(res.data.live_feed || [])
      setTotalBlocked(res.data.platform_stats.total_blocked_naira)
      setLoading(false)
    }).catch(() => setLoading(false))

    // Simulate live updates every 3–6 seconds
    const addFakeEvent = () => {
      const event = {
        id: Date.now().toString(),
        location: randomItem(LOCATIONS),
        fraud_type: randomItem(FRAUD_TYPES),
        amount_protected: randomAmount(),
        behavioral_score: randomScore(),
        seconds_ago: 0,
        isNew: true,
      }
      setLiveFeed(prev => [event, ...prev].slice(0, 12))
      setTotalBlocked(t => t + event.amount_protected)
      setActiveCount(c => c + Math.floor(Math.random() * 3))
      setTimeout(() => {
        setLiveFeed(prev => prev.map(e => e.id === event.id ? { ...e, isNew: false } : e))
      }, 800)
    }

    const schedule = () => {
      const delay = 3000 + Math.random() * 4000
      timerRef.current = setTimeout(() => { addFakeEvent(); schedule() }, delay)
    }
    schedule()

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const chartData = [
    { t: '00:00', blocked: 12 }, { t: '04:00', blocked: 8 },
    { t: '08:00', blocked: 34 }, { t: '12:00', blocked: 67 },
    { t: '16:00', blocked: 89 }, { t: '20:00', blocked: 112 },
    { t: 'Now',   blocked: 156 },
  ]

  const radarData = [
    { signal: 'Keystroke', value: 88 },
    { signal: 'Touch', value: 74 },
    { signal: 'Swipe', value: 91 },
    { signal: 'Gyro', value: 68 },
    { signal: 'Timing', value: 85 },
    { signal: 'Tap', value: 79 },
  ]

  return (
    <div style={{ padding: isMobile ? '72px 14px 100px' : '80px 24px 48px', background: '#07050A', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-glow 1.5s infinite' }} />
              <span style={{ fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)', letterSpacing: '1px' }}>LIVE</span>
            </div>
            <h1 style={{ fontFamily: '"Georgia",serif', fontSize: isMobile ? 26 : 32, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 4 }}>
              The War Room
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
              Real-time fraud intelligence across Nigeria · powered by TrustChain + Squad
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="badge badge-red" style={{ animation: 'pulse-glow 2s infinite' }}>
              <Activity size={10} /> Live Feed
            </span>
            <span className="badge badge-gray">{activeCount.toLocaleString()} active users</span>
          </div>
        </div>

        {/* Big stat cards */}
        <div className="anim-fade-up d1" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[
            {
              label: 'Amount Protected',
              value: `₦${(totalBlocked / 1_000_000).toFixed(1)}M`,
              sub: 'total blocked across platform',
              color: 'var(--green)', icon: '🛡',
              animate: true,
            },
            {
              label: 'Fraud Attempts',
              value: data ? (data.platform_stats.fraud_attempts_blocked).toLocaleString() : '—',
              sub: 'blocked payments',
              color: 'var(--red)', icon: '🚫',
            },
            {
              label: 'Active Users',
              value: activeCount.toLocaleString(),
              sub: 'protected right now',
              color: 'var(--squad-orange)', icon: '👤',
              animate: true,
            },
            {
              label: 'Prevention Rate',
              value: data ? `${data.platform_stats.fraud_prevention_rate}%` : '—',
              sub: 'of fraud attempts stopped',
              color: '#3B82F6', icon: '📊',
            },
          ].map(({ label, value, sub, color, icon, animate }) => (
            <div key={label} className="card" style={{ padding: '18px 16px', borderColor: `${color}20` }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, fontFamily: '"Georgia",serif', color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 12, marginBottom: 12 }}>

          {/* Live feed */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'pulse-glow 1.5s infinite' }} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Live Fraud Intercepts</span>
              </div>
              <span className="badge badge-red">Nigeria</span>
            </div>
            <div ref={feedRef} style={{ maxHeight: isMobile ? 320 : 400, overflowY: 'auto' }}>
              {liveFeed.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  Waiting for fraud events...
                </div>
              ) : liveFeed.map((event, i) => (
                <div key={event.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: event.isNew ? 'rgba(239,68,68,0.06)' : 'transparent',
                  transition: 'background 0.8s',
                  animation: event.isNew ? 'fadeUp 0.3s ease' : 'none',
                }}>
                  {/* Icon */}
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={14} color="var(--red)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)', marginBottom: 2 }}>
                      {event.isNew && <span style={{ marginRight: 6, fontSize: 10, background: 'var(--red)', color: '#fff', padding: '1px 6px', borderRadius: 3, fontFamily: 'var(--mono)' }}>NEW</span>}
                      BLOCKED — ₦{event.amount_protected?.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                      {event.fraud_type}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        <MapPin size={10} /> {event.location}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--mono)' }}>
                        Score: {event.behavioral_score}/100
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                        {event.seconds_ago === 0 ? 'just now' : `${event.seconds_ago}s ago`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart + Radar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Hourly fraud chart */}
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Fraud Attempts Today</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>by hour — Nigeria</div>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--red)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#130D10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="blocked" stroke="var(--red)" strokeWidth={2} fill="url(#redGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Signal radar */}
            <div className="card" style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Platform Signal Strength</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>avg across all fraud catches</div>
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="signal" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="var(--squad-orange)" fill="var(--squad-orange)" fillOpacity={0.12} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Nigeria map note */}
        <div className="card anim-fade-up" style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ fontSize: 28 }}>🇳🇬</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Nigeria Fraud Intelligence Network</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              TrustChain monitors behavioral patterns across Lagos, Abuja, Port Harcourt, Kano and 32 other cities.
              Every blocked payment strengthens the model for all users. <strong style={{ color: 'var(--squad-orange)' }}>Nigeria's first behavioral payment shield.</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: '"Georgia",serif', color: 'var(--green)' }}>
              ₦{(totalBlocked / 1_000_000).toFixed(1)}M
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>protected today</div>
          </div>
        </div>
      </div>
    </div>
  )
}
