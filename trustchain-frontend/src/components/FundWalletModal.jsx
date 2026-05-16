import { useState } from 'react'
import { X, Plus, CreditCard, Smartphone, Building2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const methods = [
  { id: 'card', icon: CreditCard, label: 'Debit Card', desc: 'Visa, Mastercard, Verve' },
  { id: 'transfer', icon: Building2, label: 'Bank Transfer', desc: 'Direct from any bank' },
  { id: 'ussd', icon: Smartphone, label: 'USSD', desc: '*737#, *901#, etc.' },
]

export default function FundWalletModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('card')
  const [loading, setLoading] = useState(false)

  const quickAmounts = [1000, 5000, 10000, 20000, 50000]

  const handleFund = async () => {
    if (!amount || Number(amount) < 100) {
      toast.error('Minimum amount is ₦100')
      return
    }
    setLoading(true)
    // Simulate funding
    await new Promise(r => setTimeout(r, 1800))
    setLoading(false)
    setStep(3)
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Fund Wallet</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Add money to your Squad Wallet</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ padding: 8 }}>
            <X size={16} />
          </button>
        </div>

        {step === 1 && (
          <>
            {/* Amount */}
            <div className="input-wrap" style={{ marginBottom: 16 }}>
              <label className="input-label">Amount (₦)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-muted)', fontSize: 18 }}>₦</span>
                <input
                  id="fund-amount"
                  className="input-field"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={{ paddingLeft: 36, fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>
            </div>

            {/* Quick select */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              {quickAmounts.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`btn btn-sm ${amount === String(a) ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ fontSize: 12 }}
                >
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Method */}
            <div className="input-wrap" style={{ marginBottom: 20 }}>
              <label className="input-label">Payment Method</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {methods.map(({ id, icon: Icon, label, desc }) => (
                  <button
                    key={id}
                    id={`fund-method-${id}`}
                    onClick={() => setMethod(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10,
                      border: `1.5px solid ${method === id ? 'var(--purple)' : 'var(--border)'}`,
                      background: method === id ? 'var(--purple-dim)' : 'var(--bg-input)',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <Icon size={16} color={method === id ? 'var(--purple-bright)' : 'var(--text-muted)'} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: method === id ? 'var(--text)' : 'var(--text-muted)' }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</div>
                    </div>
                    {method === id && <CheckCircle size={14} color="var(--purple-bright)" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="fund-proceed-btn"
              className="btn btn-primary btn-full"
              onClick={handleFund}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : `Fund ₦${Number(amount || 0).toLocaleString()}`}
            </button>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--green-dim)', border: '2px solid rgba(0,229,160,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', animation: 'glow 2s ease infinite',
            }}>
              <CheckCircle size={28} color="var(--green)" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Payment Initiated!</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 6 }}>
              ₦{Number(amount).toLocaleString()} via {methods.find(m => m.id === method)?.label}
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 12, marginBottom: 24 }}>
              Funds typically arrive within 1–3 minutes
            </div>
            <button className="btn btn-primary btn-full" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
