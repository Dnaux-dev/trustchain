// ScoreRing — uses Squad orange for approved, gold for challenge, red for blocked
export function ScoreRing({ score = 0, size = 120, showLabel = true }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const prog = (score / 100) * circ
  const color = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--gold)' : 'var(--red)'
  const glow = score >= 70
    ? 'drop-shadow(0 0 8px rgba(34,197,94,0.6))'
    : score >= 50
    ? 'drop-shadow(0 0 8px rgba(245,158,11,0.6))'
    : 'drop-shadow(0 0 8px rgba(239,68,68,0.6))'

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${prog} ${circ - prog}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.23,1,0.32,1)', filter: glow }} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.24, fontWeight: 700, fontFamily: 'var(--mono)', color, lineHeight: 1 }}>
            {Math.round(score)}
          </span>
          <span style={{ fontSize: size * 0.1, color: 'var(--text-3)', marginTop: 2 }}>/100</span>
        </div>
      </div>
      {showLabel && (
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Score
        </span>
      )}
    </div>
  )
}

// StatCard
export function StatCard({ label, value, icon: Icon, color, sub, delay = 0 }) {
  return (
    <div className="card anim-fade-up" style={{ padding: '20px 22px', animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--mono)', color, lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  )
}

// ProtectedRoute
import { Navigate } from 'react-router-dom'
import useAuthStore from '../hooks/useAuthStore'
export function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}
