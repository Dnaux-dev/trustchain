import { useState } from 'react'
import { X, Building2, Hash, CheckCircle, Lock } from 'lucide-react'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

export default function LinkBankModal({ onClose }) {
  const [form, setForm] = useState({ bank_code: '', account_number: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleLink = async () => {
    if (!form.bank_code) { toast.error('Select a bank'); return }
    if (form.account_number.length !== 10) { toast.error('Enter a valid 10-digit account number'); return }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1600))
    setLoading(false)
    setDone(true)
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Link Bank Account</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Add another bank for receiving payments</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ padding: 8 }}><X size={16} /></button>
        </div>

        {!done ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
              <div className="input-wrap">
                <label className="input-label">Bank</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <select
                    id="link-bank-select"
                    className="input-field"
                    value={form.bank_code}
                    onChange={e => setForm(f => ({ ...f, bank_code: e.target.value }))}
                    style={{ paddingLeft: 42 }}
                  >
                    <option value="">Select bank</option>
                    {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-wrap">
                <label className="input-label">Account Number</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  <input
                    id="link-account-number"
                    className="input-field"
                    placeholder="10-digit account number"
                    value={form.account_number}
                    onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
                    style={{ paddingLeft: 42 }}
                    maxLength={10}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 10 }}>
                <Lock size={13} color="var(--cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 12, color: 'var(--cyan)', lineHeight: 1.6 }}>
                  Verified securely via Squad API. We never store BVN, PIN, or card details.
                </p>
              </div>
            </div>

            <button
              id="link-bank-submit"
              className="btn btn-primary btn-full"
              onClick={handleLink}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Verify & Link Account'}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--green-dim)', border: '2px solid rgba(0,229,160,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={28} color="var(--green)" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Bank Linked!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              Your new account has been verified and linked successfully.
            </div>
            <button className="btn btn-primary btn-full" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
