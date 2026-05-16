import { useState } from 'react'
import { X, Building2, CheckCircle, Plus, Trash2, Star } from 'lucide-react'
import { banksAPI } from '../api/client'
import BANKS from '../api/banks'
import toast from 'react-hot-toast'

export default function LinkBankModal({ isOpen, onClose, linkedBanks, onRefresh }) {
  const [tab, setTab] = useState('list') // list | add
  const [form, setForm] = useState({ bank_code: '', account_number: '', nickname: '' })
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(null)

  if (!isOpen) return null

  const handleLink = async e => {
    e.preventDefault()
    if (form.account_number.length !== 10) { toast.error('Account number must be 10 digits'); return }
    setLoading(true)
    try {
      const { data } = await banksAPI.linkBank(form)
      toast.success(`${data.bank_name} linked! Account: ${data.account_name}`)
      setForm({ bank_code: '', account_number: '', nickname: '' })
      setTab('list')
      onRefresh()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to link bank')
    } finally { setLoading(false) }
  }

  const handleUnlink = async (id, name) => {
    if (!confirm(`Unlink ${name}?`)) return
    setRemoving(id)
    try {
      await banksAPI.unlinkBank(id)
      toast.success('Bank account unlinked')
      onRefresh()
    } catch { toast.error('Failed to unlink') }
    finally { setRemoving(null) }
  }

  const handleSetPrimary = async (id) => {
    try {
      await banksAPI.setPrimary(id)
      toast.success('Primary bank updated')
      onRefresh()
    } catch { toast.error('Failed to update') }
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 401, width: '100%', maxWidth: 480,
        margin: '0 16px',
        background: '#0E0A0C',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        animation: 'fadeUp 0.25s cubic-bezier(0.23,1,0.32,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(244,82,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={17} color="var(--squad-orange)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Linked Banks</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{linkedBanks.length}/5 accounts</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {[{ id: 'list', label: 'My Banks' }, { id: 'add', label: '+ Link New' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '12px', background: 'none', border: 'none',
              color: tab === t.id ? 'var(--squad-orange)' : 'rgba(255,255,255,0.4)',
              fontSize: 13, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.id ? 'var(--squad-orange)' : 'transparent'}`,
              transition: 'all 0.15s', fontFamily: 'var(--font)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 22px', maxHeight: '60vh', overflowY: 'auto' }}>

          {/* LIST TAB */}
          {tab === 'list' && (
            <div>
              {linkedBanks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)' }}>
                  <Building2 size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>No banks linked yet</div>
                  <div style={{ fontSize: 13, marginBottom: 20 }}>Link a bank to fund your wallet or make direct payments</div>
                  <button className="btn btn-primary" onClick={() => setTab('add')}>
                    <Plus size={14} /> Link First Bank
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {linkedBanks.map(bank => (
                    <div key={bank.id} style={{
                      background: bank.is_primary ? 'rgba(244,82,30,0.06)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${bank.is_primary ? 'rgba(244,82,30,0.2)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: 12, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      {/* Bank icon */}
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                        🏦
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{bank.nickname}</div>
                          {bank.is_primary && <span className="badge badge-orange" style={{ fontSize: 9 }}>Primary</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 1 }}>
                          {bank.bank_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--mono)' }}>
                          **** {bank.account_number?.slice(-4)} · {bank.account_name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {!bank.is_primary && (
                          <button onClick={() => handleSetPrimary(bank.id)} title="Set as primary" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '6px 8px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>
                            <Star size={13} />
                          </button>
                        )}
                        <button onClick={() => handleUnlink(bank.id, bank.bank_name)} disabled={removing === bank.id} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '6px 8px', color: 'var(--red)', cursor: 'pointer' }}>
                          {removing === bank.id ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}

                  {linkedBanks.length < 5 && (
                    <button className="btn btn-ghost btn-full" style={{ marginTop: 4 }} onClick={() => setTab('add')}>
                      <Plus size={14} /> Link Another Bank
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ADD TAB */}
          {tab === 'add' && (
            <form onSubmit={handleLink} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '12px 14px', background: 'rgba(244,82,30,0.05)', border: '1px solid rgba(244,82,30,0.12)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                🔒 Your account will be verified instantly via <strong style={{ color: 'var(--squad-orange)' }}>Squad Account Lookup API</strong> before being linked.
              </div>

              <div className="input-group">
                <label className="input-label">Bank</label>
                <select className="input-field" value={form.bank_code} onChange={e => setForm(f => ({ ...f, bank_code: e.target.value }))} required>
                  <option value="">Select bank</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Account Number</label>
                <input className="input-field" placeholder="10-digit account number"
                  value={form.account_number}
                  onChange={e => setForm(f => ({ ...f, account_number: e.target.value.replace(/\D/g, '') }))}
                  maxLength={10} required />
              </div>

              <div className="input-group">
                <label className="input-label">Nickname (optional)</label>
                <input className="input-field" placeholder="e.g. My Salary Account"
                  value={form.nickname}
                  onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setTab('list')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading
                    ? <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#fff' }} />Verifying...</>
                    : <><CheckCircle size={14} /> Verify & Link</>}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
