/**
 * TrustChainLogo.jsx
 * Uses the actual TrustChain logo image.
 * Place trustchain_logo.png in /public/trustchain_logo.png
 *
 * Usage:
 *   <TrustChainLogo height={28} />
 *   <TrustChainLogo height={40} showTagline />
 */

export default function TrustChainLogo({ height = 28, showTagline = false, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', ...style }}>
      <img
        src="/trustchain_logo.png"
        alt="TrustChain"
        style={{
          height: height,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      {showTagline && (
        <div style={{
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'var(--mono)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginTop: 3,
          paddingLeft: 2,
        }}>
          by Squad
        </div>
      )}
    </div>
  )
}
