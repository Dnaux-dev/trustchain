import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, CheckCircle, Clock, Shield, UserCheck, ArrowRight } from 'lucide-react'
import { usersAPI } from '../api/client'
import toast from 'react-hot-toast'

export default function Helpers() {
  const [helpers, setHelpers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ helper_name: '', helper_phone: '', relationship: '' })

  const load = async () => {
    try { const { data } = await usersAPI.getHelpers(); setHelpers(data) }
    catch { toast.error('Failed to load helpers') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleAdd = async e => {
    e.preventDefault(); setAdding(true)
    try {
      await usersAPI.addHelper(form)
      toast.success(`${form.helper_name} added! They need 3 sessions to enroll.`)
      setForm({ helper_name: '', helper_phone: '', relationship: '' })
      setShowForm(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to add') }
    finally { setAdding(false) }
  }

  const handleRemove = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return
    try { await usersAPI.removeHelper(id); toast.success('Removed'); load() }
    catch { toast.error('Failed to remove') }
  }

  return (
    <div className="page" style={{ padding: '80px 24px 48px', maxWidth: 780, margin: '0 auto' }}>

      {/* Header */}
      <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Trusted Helpers</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.6 }}>
            People who can make payments on your behalf using their own behavioral profile
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)} disabled={helpers.length >= 3}>
          <Plus size={15} /> Add Helper
        </button>
      </div>

      {/* How it works */}
      <div className="card anim-fade-up d1" style={{
        padding: '20px 24px', marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(0,214,143,0.06) 0%, rgba(0,214,143,0.02) 100%)',
        border: '1px solid rgba(0,214,143,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: 'rgba(0,214,143,0.1)', border: '1px solid rgba(0,214,143,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={20} color="var(--squad-green)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
              How Trusted Helpers Work
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
              A trusted helper (e.g. your son, daughter, or assistant) completes <strong style={{ color: 'var(--text-1)' }}>3 payment sessions</strong> to enroll their behavioral profile.
              Once enrolled, they can complete payments in the <strong style={{ color: 'var(--gold)' }}>challenge zone</strong> using their own unique interaction pattern.
              <br /><br />
              <strong style={{ color: 'var(--squad-green)' }}>Zero OTP. Zero PIN. Pure behavioral biometrics.</strong>
            </p>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
          {[
            { step: '1', title: 'Add Helper', desc: 'Enter their name & phone number' },
            { step: '2', title: 'They Enroll', desc: '3 sessions to build their profile' },
            { step: '3', title: 'They Can Help', desc: 'Verified by their behavior, not yours' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--squad-border)',
              borderRadius: 10, padding: '14px',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', marginBottom: 10,
                background: 'linear-gradient(135deg, var(--squad-green), var(--squad-green-3))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#000',
              }}>{step}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card anim-fade-up" style={{ padding: 24, marginBottom: 20, border: '1px solid rgba(0,214,143,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Add Trusted Helper</div>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="Helper's name"
                  value={form.helper_name} onChange={e => setForm(f => ({ ...f, helper_name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input className="input-field" placeholder="08012345678"
                  value={form.helper_phone} onChange={e => setForm(f => ({ ...f, helper_phone: e.target.value }))} required />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Relationship</label>
              <select className="input-field" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} required>
                <option value="">Select relationship</option>
                {['Son', 'Daughter', 'Spouse', 'Assistant', 'Sibling', 'Friend', 'Other'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={adding}>
                {adding ? <><span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} />Adding...</> : <>Add Helper <ArrowRight size={14} /></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Helpers list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner spinner-white" style={{ margin: '0 auto', width: 28, height: 28 }} />
        </div>
      ) : helpers.length === 0 ? (
        <div className="card anim-fade-up d2" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--squad-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={28} color="var(--text-3)" strokeWidth={1.5} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No trusted helpers yet</div>
          <p style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Add a trusted person who helps you with payments. They'll use their own behavioral fingerprint — completely separate from yours.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add First Helper
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {helpers.map((h, i) => (
            <div key={h.helper_id} className="card card-3d anim-fade-up" style={{ padding: '20px 22px', animationDelay: `${i * 0.06}s` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: h.is_enrolled
                    ? 'linear-gradient(135deg, rgba(0,214,143,0.15), rgba(0,214,143,0.05))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${h.is_enrolled ? 'rgba(0,214,143,0.25)' : 'var(--squad-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, position: 'relative',
                }}>
                  {h.is_enrolled
                    ? <UserCheck size={24} color="var(--squad-green)" />
                    : <Users size={24} color="var(--text-3)" />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{h.helper_name}</div>
                    <span className={`badge badge-${h.is_enrolled ? 'green' : 'gold'}`}>
                      {h.is_enrolled ? <><CheckCircle size={10} /> Enrolled</> : <><Clock size={10} /> {h.enrollment_sessions}/3</>}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 8 }}>
                    {h.relationship} · {h.helper_phone}
                  </div>

                  {/* Enrollment progress */}
                  {!h.is_enrolled && (
                    <div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 3, overflow: 'hidden', maxWidth: 160 }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          background: 'var(--gold)',
                          width: `${(h.enrollment_sessions / 3) * 100}%`,
                          transition: 'width 0.5s',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                        {3 - h.enrollment_sessions} more payment session{3 - h.enrollment_sessions !== 1 ? 's' : ''} needed
                      </div>
                    </div>
                  )}
                  {h.is_enrolled && (
                    <div style={{ fontSize: 12, color: 'var(--squad-green)' }}>
                      ✓ Can make payments on your behalf in challenge mode
                    </div>
                  )}
                </div>

                {/* Remove */}
                <button className="btn btn-danger" style={{ padding: '8px 12px', flexShrink: 0 }}
                  onClick={() => handleRemove(h.helper_id, h.helper_name)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {helpers.length >= 3 && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
              Maximum 3 trusted helpers per account
            </p>
          )}
        </div>
      )}
    </div>
  )
}
