import { useState, useEffect, useRef } from 'react'
import { Shield, ArrowRight, CheckCircle, XCircle, AlertTriangle, Zap } from 'lucide-react'
import { paymentsAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainSDK from '../sdk/TrustChain'
import ScoreRing from '../components/ScoreRing'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

const STAGES = { FORM: 'form', PROCESSING: 'processing', CHALLENGE: 'challenge', RESULT: 'result' }

export default function Pay() {
  const { user } = useAuthStore()
  const [stage, setStage] = useState(STAGES.FORM)
  const [form, setForm] = useState({ amount: '', bank_code: '', account_number: '', note: '' })
  const [result, setResult] = useState(null)
  const [challengeData, setChallengeData] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [signalQuality, setSignalQuality] = useState(0)
  const sdkRef = useRef(null)

  // Boot SDK when form mounts + poll signal quality every second
  useEffect(() => {
    if (stage === STAGES.FORM && user?.user_id) {
      const init = setTimeout(() => {
        sdkRef.current = new TrustChainSDK('payment-form', user.user_id)
      }, 300)

      // Live quality indicator
      const qualityPoll = setInterval(() => {
        if (sdkRef.current) {
          setSignalQuality(sdkRef.current.getQuality())
        }
      }, 1000)

      return () => {
        clearTimeout(init)
        clearInterval(qualityPoll)
        if (sdkRef.current) { sdkRef.current.destroy(); sdkRef.current = null }
      }
    }
  }, [stage, user])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!sdkRef.current) { toast.error('Please wait...'); return }

    setStage(STAGES.PROCESSING)
    // ⚠️ collect() is async — must await it
    const behavioralData = await sdkRef.current.collect()

    try {
      const { data } = await paymentsAPI.verifySession({
        behavioralData,
        paymentAmount: parseFloat(form.amount),
        recipientBankCode: form.bank_code,
        recipientAccount: form.account_number,
      })

      if (data.decision === 'APPROVED') {
        setResult({ ...data, type: 'approved' })
        setStage(STAGES.RESULT)
      } else if (data.decision === 'CHALLENGE') {
        setSessionId(data.session_id)
        setChallengeData(data)
        setStage(STAGES.CHALLENGE)
      } else {
        setResult({ ...data, type: 'blocked' })
        setStage(STAGES.RESULT)
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (err.response?.status === 403 && detail?.decision === 'BLOCKED') {
        setResult({ ...detail, type: 'blocked' })
        setStage(STAGES.RESULT)
      } else {
        toast.error(typeof detail === 'string' ? detail : 'Payment verification failed')
        setStage(STAGES.FORM)
      }
    }
  }

  const handleChallengeSubmit = async (challengeType, helperId = null) => {
    if (!sdkRef.current) return
    // ⚠️ collect() is async — must await it
    const behavioralData = await sdkRef.current.collect()
    setStage(STAGES.PROCESSING)

    try {
      const { data } = await paymentsAPI.submitChallenge({
        sessionId,
        behavioralData,
        challengeType,
        helperId,
      })

      if (data.decision === 'APPROVED') {
        setResult({ ...data, type: 'approved' })
      } else {
        setResult({ ...data, type: 'blocked' })
      }
      setStage(STAGES.RESULT)
    } catch (err) {
      const detail = err.response?.data?.detail
      setResult({ ...(detail || {}), type: 'blocked' })
      setStage(STAGES.RESULT)
    }
  }

  return (
    <div className="page" style={{ paddingTop: 88, paddingBottom: 48, padding: '88px 24px 48px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* ── PAYMENT FORM ── */}
        {stage === STAGES.FORM && (
          <>
            <div className="anim-fade-up" style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800 }}>Send Payment</h1>
              <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
                Your behavioral pattern is being captured as you fill this form
              </p>
            </div>

                {/* SDK quality indicator */}
            <div className="anim-fade-up d1" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: signalQuality > 0.6
                ? 'rgba(0,229,160,0.06)'
                : signalQuality > 0.2
                ? 'rgba(255,184,0,0.06)'
                : 'rgba(123,94,167,0.06)',
              border: `1px solid ${signalQuality > 0.6
                ? 'rgba(0,229,160,0.2)'
                : signalQuality > 0.2
                ? 'rgba(255,184,0,0.2)'
                : 'rgba(123,94,167,0.2)'}`,
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: signalQuality > 0.6 ? 'var(--green)' : signalQuality > 0.2 ? 'var(--gold)' : 'var(--purple-bright)',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{ fontSize: 12, color: signalQuality > 0.6 ? 'var(--green)' : signalQuality > 0.2 ? 'var(--gold)' : 'var(--purple-bright)', fontFamily: 'var(--font-mono)' }}>
                  TrustChain sensor active — capturing behavioral signals
                </span>
              </div>
              <span style={{
                fontSize: 11, fontFamily: 'var(--font-mono)',
                color: signalQuality > 0.6 ? 'var(--green)' : signalQuality > 0.2 ? 'var(--gold)' : 'var(--text-muted)',
                fontWeight: 700,
              }}>
                {Math.round(signalQuality * 100)}%
              </span>
            </div>

            <form id="payment-form" onSubmit={handleSubmit} className="card anim-fade-up d2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                <div className="input-wrap">
                  <label className="input-label">Amount (₦)</label>
                  <input className="input-field" type="number" placeholder="0.00"
                    value={form.amount} onChange={e => set('amount', e.target.value)}
                    min="1" required />
                </div>

                <div className="input-wrap">
                  <label className="input-label">Recipient Bank</label>
                  <select className="input-field" value={form.bank_code}
                    onChange={e => set('bank_code', e.target.value)} required>
                    <option value="">Select bank</option>
                    {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                </div>

                <div className="input-wrap">
                  <label className="input-label">Account Number</label>
                  <input className="input-field" placeholder="10-digit account number"
                    value={form.account_number} onChange={e => set('account_number', e.target.value)}
                    maxLength={10} minLength={10} required />
                </div>

                <div className="input-wrap">
                  <label className="input-label">Note (optional)</label>
                  <input className="input-field" placeholder="What's this for?"
                    value={form.note} onChange={e => set('note', e.target.value)} />
                </div>

                {/* Info */}
                <div style={{
                  background: 'var(--purple-dim)', borderRadius: 10, padding: '12px 14px',
                  fontSize: 13, color: 'var(--purple-bright)', lineHeight: 1.5,
                  border: '1px solid rgba(123,94,167,0.2)',
                }}>
                  🧠 TrustChain analyzes how you interact with this form. Your behavioral score determines if the payment is approved, challenged, or blocked.
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
                  <Shield size={16} /> Verify & Send Payment
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── PROCESSING ── */}
        {stage === STAGES.PROCESSING && (
          <div className="anim-fade-in" style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: 'var(--purple-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'glow 2s ease infinite',
            }}>
              <Shield size={36} color="var(--purple-bright)" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Analyzing Behavior</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28 }}>
              Running Isolation Forest + Cosine Similarity on your session...
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Keystroke dynamics', 'Touch pressure', 'Swipe velocity', 'Device motion', 'Field timing', 'Tap accuracy'].map((s, i) => (
                <div key={s} className="badge badge-purple" style={{ animationDelay: `${i * 0.1}s`, animation: 'pulse 1.5s infinite' }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CHALLENGE ZONE ── */}
        {stage === STAGES.CHALLENGE && (
          <div className="anim-fade-up">
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,184,0,0.3)',
              }}>
                <AlertTriangle size={28} color="var(--gold)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Additional Verification</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                {challengeData?.challenge_message}
              </p>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ScoreRing score={challengeData?.behavioral_score || 0} size={60} label="" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Behavioral Score</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>CHALLENGE ZONE (50–69)</div>
                </div>
              </div>
            </div>

            {/* Re-challenge interaction */}
            <div className="card" id="payment-form" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Is the account owner completing this?</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                Interact naturally with the field below, then confirm. Your behavioral pattern will be re-scored.
              </div>

              <div className="input-wrap" style={{ marginBottom: 20 }}>
                <label className="input-label">Type this phrase</label>
                <input className="input-field" placeholder="Confirm my payment" />
              </div>

              <button className="btn btn-primary btn-full" onClick={() => handleChallengeSubmit('owner')}>
                <Shield size={16} /> It's me — verify my behavior
              </button>
            </div>

            {/* Trusted helpers */}
            {challengeData?.has_trusted_helpers && challengeData?.trusted_helpers?.length > 0 && (
              <div className="card">
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Or — trusted person helping?</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  If someone is helping you, select them below. Their behavioral pattern will be verified.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {challengeData.trusted_helpers.map(h => (
                    <button key={h.helper_id} className="btn btn-ghost btn-full"
                      onClick={() => handleChallengeSubmit('helper', h.helper_id)}>
                      👤 {h.helper_name} ({h.relationship})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ── */}
        {stage === STAGES.RESULT && result && (
          <div className="anim-fade-up" style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 24px',
              background: result.type === 'approved' ? 'var(--green-dim)' : 'var(--red-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${result.type === 'approved' ? 'rgba(0,229,160,0.3)' : 'rgba(255,71,87,0.3)'}`,
            }}>
              {result.type === 'approved'
                ? <CheckCircle size={36} color="var(--green)" />
                : <XCircle size={36} color="var(--red)" />}
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
              {result.type === 'approved' ? 'Payment Approved ✓' : 'Payment Blocked'}
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 15 }}>
              {result.type === 'approved'
                ? `Verified as ${result.recipient_name || 'recipient'}. Redirecting to checkout...`
                : result.block_reason || 'Behavioral pattern did not match account owner.'}
            </p>

            {/* Score breakdown */}
            {result.breakdown && (
              <div className="card" style={{ textAlign: 'left', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                  Score Breakdown
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                  <ScoreRing score={result.behavioral_score} size={100} label="Final Score" />
                </div>
                {[
                  { label: 'Isolation Forest', val: result.breakdown.stage1_isolation_forest, desc: 'Population anomaly detection' },
                  { label: 'Cosine Similarity', val: result.breakdown.stage2_cosine_similarity, desc: 'Profile match score' },
                ].map(({ label, val, desc }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: val >= 70 ? 'var(--green)' : val >= 50 ? 'var(--gold)' : 'var(--red)' }}>
                      {val?.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {result.type === 'approved' && result.checkout_url && (
              <>
                <a
                  href={result.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-full"
                  style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}
                >
                  Continue to Payment <ArrowRight size={16} style={{ marginLeft: 6 }} />
                </a>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Opens Squad secure checkout in a new tab
                </p>
              </>
            )}

            {result.type === 'approved' && !result.checkout_url && (
              <div style={{
                background: 'var(--green-dim)', border: '1px solid rgba(0,229,160,0.2)',
                borderRadius: 10, padding: '14px 16px', marginBottom: 16,
                fontSize: 14, color: 'var(--green)',
              }}>
                <Zap size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Direct transfer initiated — funds sent straight to recipient's account.
              </div>
            )}

            <button className="btn btn-ghost btn-full" onClick={() => { setStage(STAGES.FORM); setResult(null) }}>
              {result.type === 'approved' ? 'Make Another Payment' : 'Try Again'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
