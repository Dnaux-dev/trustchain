import { useState, useEffect } from 'react'
import {
  CheckCircle, AlertTriangle, XCircle, Clock, Download,
  Search, Filter, ArrowUpRight, TrendingUp, TrendingDown
} from 'lucide-react'
import { usersAPI } from '../api/client'

const FILTERS = ['All', 'Approved', 'Challenged', 'Blocked']

export default function History() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const PER_PAGE = 10

  useEffect(() => {
    usersAPI.getSessions(100)
      .then(r => setSessions(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = sessions.filter(s => {
    const dec = s.decision || ''
    if (filter === 'Approved' && dec !== 'APPROVED' && dec !== 'COMPLETE') return false
    if (filter === 'Challenged' && dec !== 'CHALLENGE') return false
    if (filter === 'Blocked' && dec !== 'BLOCKED') return false
    if (search) {
      const q = search.toLowerCase()
      if (!String(s.payment_amount).includes(q) && !dec.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  // Summary stats
  const approved = sessions.filter(s => s.decision === 'APPROVED' || s.decision === 'COMPLETE').length
  const challenged = sessions.filter(s => s.decision === 'CHALLENGE').length
  const blocked = sessions.filter(s => s.decision === 'BLOCKED').length
  const totalAmount = sessions.reduce((sum, s) => sum + (s.payment_amount || 0), 0)

  const decisionMeta = (decision) => {
    if (decision === 'APPROVED' || decision === 'COMPLETE') return { icon: CheckCircle, color: 'var(--green)', bg: 'var(--green-dim)', badge: 'badge-green' }
    if (decision === 'CHALLENGE') return { icon: AlertTriangle, color: 'var(--gold)', bg: 'var(--gold-dim)', badge: 'badge-gold' }
    return { icon: XCircle, color: 'var(--red)', bg: 'var(--red-dim)', badge: 'badge-red' }
  }

  return (
    <div className="page" style={{ padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div className="anim-fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px' }}>Transaction History</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>Full log of all your payment sessions and behavioral decisions.</p>
        </div>

        {/* Summary cards */}
        <div className="anim-fade-up d1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Volume', value: `₦${totalAmount.toLocaleString()}`, icon: TrendingUp, color: 'var(--purple-bright)' },
            { label: 'Total Sessions', value: sessions.length, icon: Clock, color: 'var(--cyan)' },
            { label: 'Approved', value: approved, icon: CheckCircle, color: 'var(--green)' },
            { label: 'Challenged', value: challenged, icon: AlertTriangle, color: 'var(--gold)' },
            { label: 'Blocked', value: blocked, icon: XCircle, color: 'var(--red)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-chip">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{label}</span>
                <Icon size={14} color={color} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="anim-fade-up d2" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              id="history-search"
              className="input-field"
              placeholder="Search by amount or status…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              style={{ paddingLeft: 38, paddingTop: 10, paddingBottom: 10, fontSize: 14 }}
            />
          </div>

          {/* Filter tabs */}
          <div className="tab-bar" style={{ flexShrink: 0 }}>
            {FILTERS.map(f => (
              <button
                key={f}
                id={`history-filter-${f.toLowerCase()}`}
                className={`tab-btn ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setPage(0) }}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Export */}
          <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* Table */}
        <div className="anim-fade-up d3 card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 90px 110px',
            gap: 0, padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}>
            {['', 'Date & Time', 'Amount', 'Score', 'Status', 'Decision'].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              Loading history…
            </div>
          ) : paged.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No transactions found
              {search || filter !== 'All' ? '. Try adjusting your filters.' : '. Your history will appear here.'}
            </div>
          ) : (
            paged.map((s, i) => {
              const { icon: Icon, color, bg, badge } = decisionMeta(s.decision)
              const scoreColor = (s.behavioral_score || 0) >= 70 ? 'var(--green)' : (s.behavioral_score || 0) >= 50 ? 'var(--gold)' : 'var(--red)'
              return (
                <div
                  key={s.id}
                  className="tx-item"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 120px 100px 90px 110px',
                    padding: '14px 20px',
                    borderBottom: i < paged.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={color} />
                  </div>

                  {/* Date */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {new Date(s.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(s.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                    ₦{(s.payment_amount || 0).toLocaleString()}
                  </div>

                  {/* Score */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: scoreColor }}>
                    {s.behavioral_score ? s.behavioral_score.toFixed(1) : '—'}
                  </div>

                  {/* Score bar */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 60, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.behavioral_score || 0}%`, background: scoreColor, borderRadius: 2 }} />
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    <span className={`badge ${badge}`} style={{ fontSize: 10 }}>{s.decision}</span>
                  </div>
                </div>
              )
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderTop: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  ← Prev
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
