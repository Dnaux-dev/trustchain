import { useState, useEffect } from 'react'
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Clock, Zap,
  Wallet, Plus, Link2, TrendingUp, TrendingDown, ArrowUpRight,
  ArrowDownLeft, Eye, EyeOff, RefreshCw, CreditCard
} from 'lucide-react'
import { dashboardAPI, usersAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import ScoreRing from '../components/ScoreRing'
import { Link, useNavigate } from 'react-router-dom'
import FundWalletModal from '../components/FundWalletModal'
import LinkBankModal from '../components/LinkBankModal'

export default function Dashboard() {
  const { user, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showFundModal, setShowFundModal] = useState(false)
  const [showLinkBankModal, setShowLinkBankModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [s, sess, prof] = await Promise.all([
        dashboardAPI.getStats(),
        usersAPI.getSessions(6),
        usersAPI.getProfile(),
      ])
      setStats(s.data)
      setSessions(sess.data)
      setProfile(prof.data)
      updateUser({ is_enrolled: s.data.is_enrolled, enrollment_sessions: s.data.enrollment_sessions })
      if (!s.data.is_enrolled && s.data.enrollment_sessions === 0) {
        navigate('/onboarding', { replace: true })
        return
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const avgScore = stats?.average_behavioral_score || 0
  const walletBalance = stats?.wallet_balance || 124500
  const enrollProgress = Math.min(100, ((stats?.enrollment_sessions || 0) / 3) * 100)

  // Derived health score: based on avg behavioral score
  const healthScore = Math.min(100, Math.round(avgScore * 1.04))
  const healthLabel = healthScore >= 85 ? 'Excellent' : healthScore >= 65 ? 'Good' : healthScore >= 40 ? 'Fair' : 'At Risk'
  const healthColor = healthScore >= 85 ? 'var(--green)' : healthScore >= 65 ? 'var(--brand)' : healthScore >= 40 ? 'var(--gold)' : 'var(--red)'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--brand)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading your dashboard…</div>
    </div>
  )

  return (
    <div className="page" style={{ padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>
              Hey, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
              {stats?.is_enrolled
                ? 'Your behavioral profile is active and protecting all payments.'
                : `${3 - (stats?.enrollment_sessions || 0)} more session(s) to complete enrollment.`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => load(true)}
              className="btn btn-ghost btn-sm"
              style={{ padding: '9px 12px', color: 'var(--text-muted)' }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <Link to="/pay" className="btn btn-primary btn-sm">
              <Zap size={14} /> Send Money
            </Link>
          </div>
        </div>

        {/* ── Enrollment banner ──────────────────────────────────────── */}
        {!stats?.is_enrolled && stats?.enrollment_sessions > 0 && (
          <div className="anim-fade-up d1" style={{
            background: 'linear-gradient(135deg, var(--brand-dim) 0%, rgba(229,91,19,0.06) 100%)',
            border: '1px solid var(--border-bright)', borderRadius: 14,
            padding: '16px 20px', marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>🧠 Building your behavioral profile…</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
              {3 - (stats?.enrollment_sessions || 0)} more session(s) to activate full biometric protection.
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${enrollProgress}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stats?.enrollment_sessions || 0}/3 sessions</span>
              <Link to="/onboarding" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>Continue training →</Link>
            </div>
          </div>
        )}

        {/* ── Top row: Wallet + Quick actions ───────────────────────── */}
        <div className="anim-fade-up d1" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 16 }}>

          {/* Wallet card */}
          <div className="wallet-card" style={{ padding: '28px 28px 24px' }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--brand-dim)',
                    border: '1px solid var(--brand-glow)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Wallet size={17} color="var(--brand)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>Squad Wallet</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <div className="dot-live" style={{ width: 6, height: 6 }} />
                      <span style={{ fontSize: 11, color: 'rgba(0,229,160,0.8)' }}>Protected</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setBalanceVisible(v => !v)}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex' }}
                >
                  {balanceVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>

              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Available Balance</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: 'white', fontFamily: 'var(--font-mono)', letterSpacing: '-1px', lineHeight: 1 }}>
                  {balanceVisible ? `₦${walletBalance.toLocaleString()}` : '₦ ••••••'}
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <TrendingUp size={13} color="rgba(0,229,160,0.8)" />
                  <span style={{ fontSize: 12, color: 'rgba(0,229,160,0.8)', fontFamily: 'var(--font-mono)' }}>
                    +₦24,000 today
                  </span>
                </div>
              </div>

              {/* Wallet actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <button
                  id="fund-wallet-btn"
                  onClick={() => setShowFundModal(true)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(0,229,160,0.18)',
                    border: '1px solid rgba(0,229,160,0.3)',
                    color: 'rgba(0,229,160,0.95)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.2s',
                  }}
                >
                  <Plus size={14} /> Fund Wallet
                </button>
                <button
                  id="link-bank-btn"
                  onClick={() => setShowLinkBankModal(true)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.2s',
                  }}
                >
                  <Link2 size={14} /> Link Bank
                </button>
                <Link
                  to="/pay"
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#FFFFFF', fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    transition: 'all 0.2s',
                  }}
                >
                  <Zap size={14} /> Send
                </Link>
              </div>
            </div>
          </div>

          {/* Security score card */}
          <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 16 }}>
              Behavioral Score
            </div>
            <ScoreRing score={avgScore} size={120} label="Score" />
            <div className="divider" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Health</span>
                <span style={{ color: healthColor, fontWeight: 700 }}>{healthLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Protected</span>
                <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  ₦{(stats?.total_amount_protected_naira || 0).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Vectors</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}>
                  {profile?.total_vectors_stored || 0}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span style={{ fontWeight: 700, color: stats?.is_enrolled ? 'var(--green)' : 'var(--gold)' }}>
                  {stats?.is_enrolled ? '✓ Enrolled' : `${stats?.enrollment_sessions || 0}/3`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat chips ────────────────────────────────────────────── */}
        <div className="anim-fade-up d2 dashboard-grid" style={{ marginBottom: 16 }}>
          {[
            { label: 'Total Sessions', value: stats?.total_sessions || 0, icon: Clock, color: 'var(--brand)', trend: null },
            { label: 'Approved', value: stats?.approved || 0, icon: CheckCircle, color: 'var(--green)', trend: '+12%' },
            { label: 'Challenged', value: stats?.challenged || 0, icon: AlertTriangle, color: 'var(--gold)', trend: '-3%' },
            { label: 'Blocked', value: stats?.blocked || 0, icon: XCircle, color: 'var(--red)', trend: '-8%' },
          ].map(({ label, value, icon: Icon, color, trend }) => (
            <div key={label} className="stat-chip">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} color={color} />
                </div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</div>
              {trend && (
                <div style={{ marginTop: 6, fontSize: 11, color: trend.startsWith('+') ? 'var(--green)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {trend.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {trend} vs last week
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Bottom: Transactions + Insights ───────────────────────── */}
        <div className="anim-fade-up d3" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

          {/* Recent transactions */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Transactions</div>
              <Link to="/history" style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}>View all →</Link>
            </div>

            {sessions.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No transactions yet.{' '}
                <Link to="/pay" style={{ color: 'var(--brand)' }}>Make your first payment →</Link>
              </div>
            ) : (
              sessions.map((s, i) => {
                const approved = s.decision === 'COMPLETE' || s.decision === 'APPROVED'
                const challenged = s.decision === 'CHALLENGE'
                const iconBg = approved ? 'var(--green-dim)' : challenged ? 'var(--gold-dim)' : 'var(--red-dim)'
                const iconColor = approved ? 'var(--green)' : challenged ? 'var(--gold)' : 'var(--red)'
                return (
                  <div key={s.id} className="tx-item">
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {approved ? <ArrowUpRight size={16} color={iconColor} /> : challenged ? <AlertTriangle size={16} color={iconColor} /> : <XCircle size={16} color={iconColor} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>₦{s.payment_amount?.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(s.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: iconColor }}>
                        {s.behavioral_score?.toFixed(1)}
                      </div>
                      <div className={`badge badge-${approved ? 'green' : challenged ? 'gold' : 'red'}`} style={{ fontSize: 9, marginTop: 4 }}>
                        {s.decision}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Insights panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Health card */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={15} color="var(--green)" /> Security Health
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Overall Score</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: healthColor }}>{healthScore}/100</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${healthScore}%`, background: `linear-gradient(90deg, ${healthColor}, ${healthColor}99)` }} />
                </div>
              </div>
              <div style={{ fontSize: 13, color: healthColor, fontWeight: 700, textAlign: 'center', padding: '8px 0', background: `${healthColor}12`, borderRadius: 8 }}>
                {healthLabel} — Profile Active
              </div>
            </div>

            {/* Key facts */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Key Insights</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: CreditCard, label: 'Linked Banks', value: '1 account', color: 'var(--brand)' },
                  { icon: Clock, label: 'Avg Response', value: '118ms', color: 'var(--brand)' },
                  { icon: TrendingUp, label: 'Success Rate', value: `${stats?.total_sessions ? Math.round((stats.approved / stats.total_sessions) * 100) : 0}%`, color: 'var(--green)' },
                  { icon: Shield, label: 'Fraud Blocked', value: `${stats?.blocked || 0} attempts`, color: 'var(--red)' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="insight-pill">
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} color={color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      {showFundModal && <FundWalletModal onClose={() => setShowFundModal(false)} />}
      {showLinkBankModal && <LinkBankModal onClose={() => setShowLinkBankModal(false)} />}
    </div>
  )
}