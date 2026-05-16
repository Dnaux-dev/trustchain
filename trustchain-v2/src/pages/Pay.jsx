import { useState, useEffect, useRef } from 'react'
import { Shield, ArrowRight, CheckCircle, XCircle, AlertTriangle, CreditCard, Lock } from 'lucide-react'
import { paymentsAPI } from '../api/client'
import useAuthStore from '../hooks/useAuthStore'
import TrustChainSDK from '../sdk/TrustChain'
import { ScoreRing } from '../components/UI'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

const STAGE = { FORM: 'form', PROCESSING: 'processing', CHALLENGE: 'challenge', RESULT: 'result' }

export default function Pay() {
  const { user } = useAuthStore()
  const [stage, setStage] = useState(STAGE.FORM)
  const [form, setForm] = useState({ amount: '', bank_code: '', account_number: '', note: '' })
  const [result, setResult] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [typed, setTyped] = useState('')
  const sdkRef = useRef(null)

  useEffect(() => {
    if ((stage === STAGE.FORM || stage === STAGE.CHALLENGE) && user?.user_id) {
      setTimeout(() => { sdkRef.current = new TrustChainSDK('pay-form', user.user_id) }, 300)
    }
    return () => { if (sdkRef.current) { sdkRef.current.destroy(); sdkRef.current = null } }
  }, [stage])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!sdkRef.current) { toast.error('Please wait...'); return }
    setStage(STAGE.PROCESSING)
    const bd = await sdkRef.current.collect()
    try {
      const { data } = await paymentsAPI.verifySession({
        behavioralData: bd,
        paymentAmount: parseFloat(form.amount),
        recipientBankCode: form.bank_code,
        recipientAccount: form.account_number,
      })
      if (data.decision === 'APPROVED') { setResult({ ...data, type: 'approved' }); setStage(STAGE.RESULT) }
      else if (data.decision === 'CHALLENGE') { setSessionId(data.session_id); setChallenge(data); setStage(STAGE.CHALLENGE) }
      else { setResult({ ...data, type: 'blocked' }); setStage(STAGE.RESULT) }
    } catch (err) {
      const d = err.response?.data?.detail
      if (err.response?.status === 403 && d?.decision) { setResult({ ...d, type: 'blocked' }); setStage(STAGE.RESULT) }
      else { toast.error(typeof d === 'string' ? d : 'Verification failed'); setStage(STAGE.FORM) }
    }
  }

  const handleChallenge = async (type, helperId = null) => {
    if (!sdkRef.current) return
    const bd = await sdkRef.current.collect()
    setStage(STAGE.PROCESSING)
    try {
      const { data } = await paymentsAPI.submitChallenge({ sessionId, behavioralData: bd, challengeType: type, helperId })
      setResult({ ...data, type: data.decision === 'APPROVED' ? 'approved' : 'blocked' })
      setStage(STAGE.RESULT)
    } catch (err) {
      setResult({ type: 'blocked', block_reason: 'Challenge failed — behavioral pattern mismatch' })
      setStage(STAGE.RESULT)
    }
  }

  return (
    <div className="page" style={{ padding: '80px 24px 48px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* ── FORM ── */}
        {stage === STAGE.FORM && (
          <>
            <div className="anim-fade-up" style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Send Payment</h1>
              <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Secured by behavioral biometrics via Squad</p>
            </div>

            {/* Sensor pill */}
            <div className="anim-fade-up d1" style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              background: 'rgba(0,214,143,0.05)', border: '1px solid rgba(0,214,143,0.12)',
              borderRadius: 10, padding: '10px 14px',
            }}>
              <div className="glow-dot" style={{ width: 7, height: 7 }} />
              <span style={{ fontSize: 12, color: 'var(--squad-green)', fontFamily: 'var(--mono)', letterSpacing: '0.5px' }}>
                TRUSTCHAIN SENSOR ACTIVE — capturing behavioral signals
              </span>
            </div>

            <form id="pay-form" onSubmit={handleSubmit} className="card anim-fade-up d2" style={{ padding: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                <div className="input-group">
                  <label className="input-label">Amount (₦)</label>
                  <input className="input-field" type="number" placeholder="0.00"
                    value={form.amount} onChange={e => set('amount', e.target.value)} min="1" required />
                </div>

                <div className="input-group">
                  <label className="input-label">Recipient Bank</label>
                  <select className="input-field" value={form.bank_code} onChange={e => set('bank_code', e.target.value)} required>
                    <option value="">Select bank</option>
                    {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Account Number</label>
                  <input className="input-field" placeholder="10-digit account number"
                    value={form.account_number} onChange={e => set('account_number', e.target.value)}
                    maxLength={10} minLength={10} required />
                </div>

                <div className="input-group">
                  <label className="input-label">Note (optional)</label>
                  <input className="input-field" placeholder="What's this for?"
                    value={form.note} onChange={e => set('note', e.target.value)} />
                </div>

                {/* AI info */}
                <div style={{
                  background: 'rgba(114,46,209,0.06)', border: '1px solid rgba(114,46,209,0.15)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <Shield size={16} color="#B37FEB" style={{ marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                    TrustChain is analyzing your typing rhythm, swipe speed, and tap pattern. Your behavioral score determines this payment's fate.
                  </span>
                </div>

                <button type="submit" className="btn btn-primary btn-full" style={{ fontSize: 15, padding: '14px' }}>
                  <Lock size={15} /> Verify & Send
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── PROCESSING ── */}
        {stage === STAGE.PROCESSING && (
          <div className="anim-fade-in" style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{
              width: 90, height: 90, borderRadius: 24, margin: '0 auto 24px',
              background: 'rgba(0,214,143,0.08)', border: '1px solid rgba(0,214,143,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'rotate3d 2s ease-in-out infinite',
              boxShadow: '0 0 40px rgba(0,214,143,0.15)',
            }}>
              <Shield size={40} color="var(--squad-green)" strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Analyzing Behavior</h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28 }}>
              Running Isolation Forest + Cosine Similarity...
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Keystroke dynamics', 'Touch pressure', 'Swipe velocity', 'Motion patterns', 'Field timing', 'Tap accuracy'].map((s, i) => (
                <span key={s} className="badge badge-gray" style={{ animation: `pulse-glow ${1 + i * 0.15}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── CHALLENGE ── */}
        {stage === STAGE.CHALLENGE && (
          <div className="anim-fade-up">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 70, height: 70, borderRadius: '50%', margin: '0 auto 16px',
                background: 'rgba(245,183,49,0.1)', border: '1px solid rgba(245,183,49,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertTriangle size={30} color="var(--gold)" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Verification Needed</h2>
              <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
                {challenge?.challenge_message}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <ScoreRing score={challenge?.behavioral_score || 0} size={60} showLabel={false} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Score: {challenge?.behavioral_score?.toFixed(1)}/100</div>
                  <div style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--mono)' }}>CHALLENGE ZONE (50–69)</div>
                </div>
              </div>
            </div>

            <div className="card" id="pay-form" style={{ padding: 20, marginBottom: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Complete this to verify it's you</div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>Type the phrase below. Your behavioral pattern will be re-analyzed.</p>

              <div style={{
                background: 'rgba(0,214,143,0.05)', border: '1px dashed rgba(0,214,143,0.25)',
                borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--squad-green)',
              }}>
                "Confirm my payment"
              </div>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <input className="input-field" placeholder="Type the phrase above..."
                  value={typed} onChange={e => setTyped(e.target.value)} autoFocus />
              </div>

              <button className="btn btn-primary btn-full" onClick={() => handleChallenge('owner')}>
                <Shield size={14} /> Verify — It's me
              </button>
            </div>

            {challenge?.has_trusted_helpers && challenge?.trusted_helpers?.length > 0 && (
              <div className="card" style={{ padding: 20 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>Being helped by someone?</div>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>Select the trusted person making this payment on your behalf.</p>
                {challenge.trusted_helpers.map(h => (
                  <button key={h.helper_id} className="btn btn-ghost btn-full" style={{ marginBottom: 8 }}
                    onClick={() => handleChallenge('helper', h.helper_id)}>
                    👤 {h.helper_name} — {h.relationship}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ── */}
        {stage === STAGE.RESULT && result && (
          <div className="anim-fade-up" style={{ textAlign: 'center' }}>

            {/* Result icon */}
            <div style={{
              width: 90, height: 90, borderRadius: '50%', margin: '0 auto 24px',
              background: result.type === 'approved' ? 'rgba(0,214,143,0.1)' : 'rgba(255,77,79,0.1)',
              border: `1px solid ${result.type === 'approved' ? 'rgba(0,214,143,0.3)' : 'rgba(255,77,79,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: result.type === 'approved' ? '0 0 40px rgba(0,214,143,0.15)' : '0 0 40px rgba(255,77,79,0.15)',
            }}>
              {result.type === 'approved'
                ? <CheckCircle size={40} color="var(--squad-green)" strokeWidth={1.5} />
                : <XCircle size={40} color="var(--red)" strokeWidth={1.5} />}
            </div>

            <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 8 }}>
              {result.type === 'approved' ? 'Payment Approved ✓' : 'Payment Blocked'}
            </h2>
            <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              {result.type === 'approved'
                ? `Verified: ${result.recipient_name || 'recipient'}. Proceed to checkout.`
                : result.block_reason || 'Behavioral pattern did not match. Payment blocked for your protection.'}
            </p>

            {/* Score breakdown card */}
            {result.breakdown && (
              <div className="card" style={{ padding: '20px', textAlign: 'left', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>
                  Score Breakdown
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <ScoreRing score={result.behavioral_score} size={100} />
                </div>
                {[
                  { label: 'Isolation Forest', val: result.breakdown.stage1_isolation_forest, desc: 'Population anomaly — 35% weight' },
                  { label: 'Cosine Similarity', val: result.breakdown.stage2_cosine_similarity, desc: 'Profile match — 65% weight' },
                  { label: 'Profile Sessions', val: result.breakdown.sessions_in_profile, desc: 'Behavioral data points used', raw: true },
                ].map(({ label, val, desc, raw }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--squad-border)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{desc}</div>
                    </div>
                    <span style={{
                      fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 15,
                      color: raw ? 'var(--text-2)' : val >= 70 ? 'var(--squad-green)' : val >= 50 ? 'var(--gold)' : 'var(--red)',
                    }}>
                      {raw ? val : val?.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {result.type === 'approved' && result.checkout_url && (
              <a href={result.checkout_url} className="btn btn-primary btn-full btn-lg" style={{ display: 'flex', marginBottom: 12 }}>
                Continue to Squad Checkout <ArrowRight size={15} />
              </a>
            )}
            <button className="btn btn-ghost btn-full" onClick={() => { setStage(STAGE.FORM); setResult(null); setTyped('') }}>
              {result.type === 'approved' ? 'Make Another Payment' : 'Try Again'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
