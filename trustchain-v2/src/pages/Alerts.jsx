import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, RefreshCw, TrendingDown, Shield, Star, ArrowRight, X, Activity } from 'lucide-react'
import { intelligenceAPI } from '../api/client'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Credit score arc
function CreditArc({ score }) {
  const pct = score / 1000
  const r = 70, cx = 90, cy = 90
  const circumference = Math.PI * r  // half circle
  const dash = pct * circumference
  const gap = circumference - dash

  const color = score >= 850 ? '#22C55E' : score >= 700 ? '#86EFAC' : score >= 550 ? '#F59E0B' : score >= 400 ? '#FB923C' : '#EF4444'

  return (
    <div style={{ position: 'relative', width: 180, height: 100, margin: '0 auto' }}>
      <svg width={180} height={100} viewBox="0 0 180 100">
        {/* Track */}
        <path d={`M 20 90 A ${r} ${r} 0 0 1 160 90`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} strokeLinecap="round" />
        {/* Progress */}
        <path d={`M 20 90 A ${r} ${r} 0 0 1 160 90`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.23,1,0.32,1)', filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: '"Georgia",serif', fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--mono)' }}>/ 1000</div>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState([])
  const [drift, setDrift] = useState(null)
  const [credit, setCredit] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const r = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', r)
    return () => window.removeEventListener('resize', r)
  }, [])

  useEffect(() => {
    Promise.all([
      intelligenceAPI.getAlerts(),
      intelligenceAPI.getDrift(),
      intelligenceAPI.getCreditScore(),
    ]).then(([a, d, c]) => {
      setAlerts(a.data)
      setDrift(d.data)
      setCredit(c.data)
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const handleResolve = async id => {
    try {
      await intelligenceAPI.resolveAlert(id)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a))
      toast.success('Alert resolved')
    } catch { toast.error('Failed to resolve') }
  }

  const handleRefreshProfile = async () => {
    if (!confirm('This will reset your behavioral profile and restart training. Continue?')) return
    setRefreshing(true)
    try {
      await intelligenceAPI.refreshProfile()
      toast.success('Profile reset! Complete 3 training sessions to re-enroll.')
      navigate('/onboarding')
    } catch { toast.error('Failed to refresh profile') }
    finally { setRefreshing(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07050A' }}>
      <div className="spinner spinner-white" style={{ width: 28, height: 28 }} />
    </div>
  )

  const unresolved = alerts.filter(a => !a.resolved)

  return (
    <div style={{ padding: isMobile ? '72px 14px 100px' : '80px 24px 48px', background: '#07050A', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: '"Georgia",serif', fontSize: isMobile ? 26 : 32, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 4 }}>
            Security Intelligence
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Behavioral drift alerts, credit score, and profile management
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Drift Detection */}
            <div className="card anim-fade-up d1" style={{
              padding: '20px 22px',
              border: drift?.drift_detected ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.06)',
              background: drift?.drift_detected ? 'rgba(245,158,11,0.04)' : 'var(--squad-card)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: drift?.drift_detected ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingDown size={18} color={drift?.drift_detected ? 'var(--gold)' : 'rgba(255,255,255,0.3)'} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Behavioral Drift</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>How much your pattern has changed</div>
                </div>
                {drift?.drift_detected && (
                  <span className="badge badge-gold" style={{ marginLeft: 'auto' }}>⚠ Alert</span>
                )}
              </div>

              {/* Drift meter */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  <span>Drift Score</span>
                  <span style={{ fontFamily: 'var(--mono)', color: drift?.drift_detected ? 'var(--gold)' : 'var(--green)' }}>
                    {drift?.drift_score || 0}%
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    background: drift?.drift_score > 30 ? 'var(--red)' : drift?.drift_score > 15 ? 'var(--gold)' : 'var(--green)',
                    width: `${Math.min(100, drift?.drift_score || 0)}%`,
                    transition: 'width 0.8s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                  <span>Stable</span><span>Medium</span><span>High</span>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>
                {drift?.message || 'Analyzing behavioral pattern...'}
              </p>

              {drift?.sessions_analyzed && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--mono)', marginBottom: 16 }}>
                  {drift.sessions_analyzed} sessions analyzed
                </div>
              )}

              {drift?.drift_detected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: 13 }}
                    onClick={handleRefreshProfile} disabled={refreshing}>
                    {refreshing
                      ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />Resetting...</>
                      : <><RefreshCw size={14} /> Refresh Profile</>}
                  </button>
                </div>
              )}

              {!drift?.drift_detected && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 8 }}>
                  <CheckCircle size={14} color="var(--green)" />
                  <span style={{ fontSize: 12, color: 'var(--green)' }}>Your behavioral pattern is stable</span>
                </div>
              )}
            </div>

            {/* Active Alerts */}
            <div className="card anim-fade-up d2" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Alerts</div>
                {unresolved.length > 0 && (
                  <span className="badge badge-gold">{unresolved.length} unresolved</span>
                )}
              </div>
              {alerts.length === 0 ? (
                <div style={{ padding: '28px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                  <CheckCircle size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                  No alerts — your account is secure
                </div>
              ) : alerts.slice(0, 6).map(alert => (
                <div key={alert.id} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '13px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  opacity: alert.resolved ? 0.45 : 1,
                }}>
                  <AlertTriangle size={16} color={alert.resolved ? 'rgba(255,255,255,0.2)' : 'var(--gold)'} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{alert.message}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                      {new Date(alert.created_at).toLocaleDateString()}
                      {alert.resolved && ' · Resolved'}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <button onClick={() => handleResolve(alert.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: 4 }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Behavioral Credit Score */}
            <div className="card anim-fade-up d1" style={{ padding: '22px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>TrustScore™</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                Your behavioral credit score — built from payments, not documents
              </div>

              <CreditArc score={credit?.trust_score || 0} />

              <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 20 }}>
                <span className={`badge badge-${credit?.trust_score >= 700 ? 'green' : credit?.trust_score >= 500 ? 'gold' : 'red'}`} style={{ fontSize: 14, padding: '4px 14px' }}>
                  Grade {credit?.grade || 'N/A'}
                </span>
              </div>

              {/* Score breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {credit?.breakdown && Object.entries({
                  'Payment Consistency': credit.breakdown.consistency,
                  'Behavior Average': credit.breakdown.behavior_average,
                  'Profile Maturity': credit.breakdown.profile_maturity,
                  'Fraud-Free Score': credit.breakdown.fraud_free_score,
                }).map(([label, val]) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'rgba(255,255,255,0.7)' }}>{val?.toFixed(0)}%</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 2, height: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: 'var(--squad-orange)', width: `${val || 0}%`, transition: 'width 0.8s' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Perks */}
              {credit?.perks?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                    Perks Unlocked
                  </div>
                  {credit.perks.map(p => (
                    <div key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <Star size={12} color="var(--gold)" />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile health */}
            <div className="card anim-fade-up d2" style={{ padding: '18px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Profile Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button className="btn btn-ghost btn-full" style={{ justifyContent: 'space-between', padding: '12px 16px' }}
                  onClick={handleRefreshProfile} disabled={refreshing}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RefreshCw size={15} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Refresh Behavioral Profile</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Retrain if your behavior has changed</div>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </button>

                <div style={{ padding: '12px 14px', background: 'rgba(244,82,30,0.04)', border: '1px solid rgba(244,82,30,0.1)', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--squad-orange)', marginBottom: 4 }}>
                    💡 How to improve your TrustScore
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                    Make consistent payments, avoid failed attempts, and keep your behavioral profile up to date.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
