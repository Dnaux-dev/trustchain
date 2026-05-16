export default function ScoreRing({ score, size = 120, label = "Score" }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const gap = circumference - progress

  const color = score >= 70 ? 'var(--green)' : score >= 50 ? 'var(--gold)' : 'var(--red)'
  const glow = score >= 70
    ? '0 0 20px rgba(0,229,160,0.4)'
    : score >= 50
    ? '0 0 20px rgba(255,184,0,0.4)'
    : '0 0 20px rgba(255,71,87,0.4)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border)" strokeWidth={6}
          />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={6}
            strokeDasharray={`${progress} ${gap}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.3s ease', filter: `drop-shadow(${glow})` }}
          />
        </svg>
        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size * 0.22, fontWeight: 800,
            fontFamily: 'var(--font-mono)', color,
            lineHeight: 1,
          }}>
            {Math.round(score)}
          </span>
          <span style={{ fontSize: size * 0.1, color: 'var(--text-muted)', marginTop: 2 }}>
            /100
          </span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}
