import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, CheckCircle, Clock } from 'lucide-react'
import { usersAPI } from '../api/client'
import toast from 'react-hot-toast'

export default function Helpers() {
  const [helpers, setHelpers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ helper_name: '', helper_phone: '', relationship: '' })

  const load = async () => {
    try {
      const { data } = await usersAPI.getHelpers()
      setHelpers(data)
    } catch (e) { toast.error('Failed to load helpers') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    setAdding(true)
    try {
      const { data } = await usersAPI.addHelper(form)
      toast.success(`${form.helper_name} added! They need 3 payment sessions to enroll.`)
      setForm({ helper_name: '', helper_phone: '', relationship: '' })
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add helper')
    } finally { setAdding(false) }
  }

  const handleRemove = async (id, name) => {
    if (!confirm(`Remove ${name} as trusted helper?`)) return
    try {
      await usersAPI.removeHelper(id)
      toast.success('Helper removed')
      load()
    } catch { toast.error('Failed to remove') }
  }

  return (
    <div className="page" style={{ paddingTop: 88, paddingBottom: 48, padding: '88px 24px 48px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>

        <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800 }}>Trusted Helpers</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
              People who can make payments on your behalf using their own behavioral profile
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)} disabled={helpers.length >= 3}>
            <Plus size={16} /> Add Helper
          </button>
        </div>

        {/* Info box */}
        <div className="anim-fade-up d1" style={{
          background: 'var(--purple-dim)', border: '1px solid rgba(123,94,167,0.2)',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24,
          fontSize: 13, color: 'var(--purple-bright)', lineHeight: 1.6,
        }}>
          🧠 <strong>How it works:</strong> A trusted helper (e.g. your child, assistant) makes 3 payments on your behalf to enroll their behavioral profile. Once enrolled, they can complete payments in the challenge zone using their own unique interaction pattern — no OTP, no PIN.
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card anim-fade-up" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 16 }}>Add Trusted Helper</div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-wrap">
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="Helper's full name"
                  value={form.helper_name} onChange={e => setForm(f => ({ ...f, helper_name: e.target.value }))} required />
              </div>
              <div className="input-wrap">
                <label className="input-label">Phone Number</label>
                <input className="input-field" placeholder="08012345678"
                  value={form.helper_phone} onChange={e => setForm(f => ({ ...f, helper_phone: e.target.value }))} required />
              </div>
              <div className="input-wrap">
                <label className="input-label">Relationship</label>
                <select className="input-field" value={form.relationship}
                  onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} required>
                  <option value="">Select relationship</option>
                  <option>Son</option>
                  <option>Daughter</option>
                  <option>Spouse</option>
                  <option>Assistant</option>
                  <option>Sibling</option>
                  <option>Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={adding}>
                  {adding ? <span className="spinner" /> : 'Add Helper'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Helpers list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto', width: 28, height: 28 }} />
          </div>
        ) : helpers.length === 0 ? (
          <div className="card anim-fade-up d2" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No trusted helpers yet</div>
            <div style={{ fontSize: 13 }}>Add someone who helps you with payments — they'll use their own behavioral profile to authenticate.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {helpers.map((h, i) => (
              <div key={h.helper_id} className="card anim-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: h.is_enrolled ? 'var(--green-dim)' : 'var(--purple-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    👤
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{h.helper_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {h.relationship} · {h.helper_phone}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {h.is_enrolled ? (
                        <span className="badge badge-green"><CheckCircle size={10} /> Enrolled</span>
                      ) : (
                        <span className="badge badge-gold">
                          <Clock size={10} /> {h.enrollment_sessions}/3 sessions
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-danger" style={{ padding: '8px 12px' }}
                    onClick={() => handleRemove(h.helper_id, h.helper_name)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {helpers.length >= 3 && (
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            Maximum 3 trusted helpers per account
          </p>
        )}
      </div>
    </div>
  )
}
