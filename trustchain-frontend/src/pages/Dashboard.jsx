import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import { dashboardAPI, usersAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import ScoreRing from '../components/ScoreRing'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, sess, prof] = await Promise.all([
          dashboardAPI.getStats(),
          usersAPI.getSessions(8),
          usersAPI.getProfile(),
        ])
        setStats(s.data)
        setSessions(sess.data)
        setProfile(prof.data)
        updateUser({
          is_enrolled: s.data.is_enrolled,
          enrollment_sessions: s.data.enrollment_sessions,
        })

        // ── Redirect new users to onboarding ─────────────────────
        // Only redirect if they have zero sessions — not mid-enrollment
        if (!s.data.is_enrolled && s.data.enrollment_sessions === 0) {
          navigate('/onboarding', { replace: true })
          return
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const avgScore = stats?.average_behavioral_score || 0
  const enrollProgress = Math.min(100, ((stats?.enrollment_sessions || 0) / 3) * 100)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  )

  return (
    <div className="page" style={{ padding: '88px 24px 48px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 32 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
                Hey, {user?.full_name?.split(' ')[0]} 👋
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                {stats?.is_enrolled
                  ? 'Your behavioral profile is active and protecting your payments.'
                  : `${3 - (stats?.enrollment_sessions || 0)} more session${3 - (stats?.enrollment_sessions || 0) !== 1 ? 's' : ''} to complete enrollment.`}
              </p>
            </div>
            <Link to="/pay" className="btn btn-primary">
              <Zap size={16} /> Make a Payment
            </Link>
          </div>
        </div>

        {/* Mid-enrollment banner — shown when partially enrolled (1-2 sessions done) */}
        {!stats?.is_enrolled && stats?.enrollment_sessions > 0 && (
          <div className="anim-fade-up d1" style={{
            background: 'linear-gradient(135deg, rgba(123,94,167,0.15) 0%, rgba(0,212,255,0.08) 100%)',
            border: '1px solid var(--border-bright)', borderRadius: 14,
            padding: '18px 22px', marginBottom: 24,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>
              🧠 Building your behavioral profile...
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
              {3 - (stats?.enrollment_sessions || 0)} more session{3 - (stats?.enrollment_sessions || 0) !== 1 ? 's' : ''} to activate full biometric protection.
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                background: 'linear-gradient(90deg, var(--purple), var(--cyan))',
                width: `${enrollProgress}%`,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {stats?.enrollment_sessions || 0} / 3 sessions complete
              </span>
              <Link to="/onboarding" style={{ fontSize: 12, color: 'var(--purple-bright)', fontWeight: 600 }}>
                Continue training →
              </Link>
            </div>
          </div>
        )}

        {/* Enrolled success banner */}
        {stats?.is_enrolled && (
          <div className="anim-fade-up d1" style={{
            background: 'var(--green-dim)',
            border: '1px solid rgba(0,229,160,0.2)',
            borderRadius: 14, padding: '14px 22px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <CheckCircle size={18} color="var(--green)" />
            <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
              Behavioral profile active — all payments are biometrically protected
            </span>
          </div>
        )}

        {/* Stat cards */}
        <div className="anim-fade-up d2" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 28,
        }}>
          {[
            { label: 'Total Sessions', value: stats?.total_sessions || 0, icon: Clock, color: 'var(--purple-bright)' },
            { label: 'Approved', value: stats?.approved || 0, icon: CheckCircle, color: 'var(--green)' },
            { label: 'Challenged', value: stats?.challenged || 0, icon: AlertTriangle, color: 'var(--gold)' },
            { label: 'Blocked', value: stats?.blocked || 0, icon: XCircle, color: 'var(--red)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card" style={{ padding: '20px 22px' }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 12, color: 'var(--text-muted)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {label}
                </span>
                <Icon size={16} color={color} />
              </div>
              <div style={{
                fontSize: 32, fontWeight: 800,
                fontFamily: 'var(--font-mono)', color,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Score ring + Sessions grid */}
        <div className="anim-fade-up d3" style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: 16, alignItems: 'start',
        }}>

          {/* Score card */}
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 20,
            }}>
              Avg Behavioral Score
            </div>
            <ScoreRing score={avgScore} size={140} label="Your Score" />
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Protected</span>
              <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                ₦{(stats?.total_amount_protected_naira || 0).toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>Profile vectors</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--purple-bright)' }}>
                {profile?.total_vectors_stored || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>Enrolled</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: stats?.is_enrolled ? 'var(--green)' : 'var(--gold)',
              }}>
                {stats?.is_enrolled ? '✓ Yes' : `${stats?.enrollment_sessions || 0}/3`}
              </span>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Recent Sessions</div>
            </div>

            {sessions.length === 0 ? (
              <div style={{
                padding: '40px 22px', textAlign: 'center', color: 'var(--text-muted)',
              }}>
                No sessions yet.{' '}
                <Link to="/pay" style={{ color: 'var(--purple-bright)' }}>
                  Make your first payment →
                </Link>
              </div>
            ) : (
              sessions.map((s, i) => {
                const approved = s.decision === 'COMPLETE' || s.decision === 'APPROVED'
                const challenged = s.decision === 'CHALLENGE'
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 22px',
                    borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: approved ? 'var(--green-dim)' : challenged ? 'var(--gold-dim)' : 'var(--red-dim)',
                    }}>
                      {approved
                        ? <CheckCircle size={16} color="var(--green)" />
                        : challenged
                          ? <AlertTriangle size={16} color="var(--gold)" />
                          : <XCircle size={16} color="var(--red)" />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        ₦{s.payment_amount?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(s.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Score + badge */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700,
                        color: s.behavioral_score >= 70
                          ? 'var(--green)'
                          : s.behavioral_score >= 50
                            ? 'var(--gold)'
                            : 'var(--red)',
                      }}>
                        {s.behavioral_score?.toFixed(1)}
                      </div>
                      <div
                        className={`badge badge-${approved ? 'green' : challenged ? 'gold' : 'red'}`}
                        style={{ fontSize: 10, marginTop: 4 }}
                      >
                        {s.decision}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
    </div>
  )
}