import { useState, useEffect } from 'react'
import { listBookings, markPaid } from '../../api/api'
import { StatusBadge, formatPaise } from '../../components/common/StatusBadge'
import { format } from 'date-fns'

const STATUS_OPTIONS = ['', 'RESERVED', 'ACTIVE', 'COMPLETED', 'OVERSTAY', 'CANCELLED', 'EXPIRED']

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [paying, setPaying] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listBookings(status ? { status } : {})
      setBookings(data)
    } catch (e) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [status])

  const handleMarkPaid = async (id) => {
    setPaying(id)
    try {
      await markPaid(id)
      load()
    } catch {
      setError('Failed to mark as paid')
    } finally {
      setPaying(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">All reservations across your locations</p>
        </div>
        <div className="flex items-center gap-10">
          <select
            className="form-input"
            style={{ minWidth: 160 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s || 'All Statuses'}</option>
            ))}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-16">{error}</div>}

      {loading ? (
        <div className="card">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              {[1,2,3,4,5,6].map(j => (
                <div key={j} className="skeleton" style={{ height: 14, flex: 1, borderRadius: 4 }} />
              ))}
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"/>
          </svg>
          <p className="font-semibold mt-12">No bookings found</p>
          <p className="text-sm mt-4">{status ? `No ${status} bookings` : 'Bookings will appear here once customers start reserving'}</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Location / Slot</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Schedule</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const duration = b.actual_start && b.actual_end
                    ? ((new Date(b.actual_end) - new Date(b.actual_start)) / 3600000).toFixed(1)
                    : null
                  return (
                    <tr key={b.booking_id}>
                      <td>
                        <div className="font-semibold text-sm">{b.user_name || '—'}</div>
                        <div className="text-xs text-muted">{b.user_phone}</div>
                      </td>
                      <td>
                        <div className="text-sm font-semibold">{b.location_name || '—'}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="badge badge-accent" style={{ fontSize: 11 }}>
                            {b.slot_name || '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${b.booking_type === 'INSTANT' ? 'badge-info' : 'badge-accent'}`} style={{ fontSize: 11 }}>
                          {b.booking_type === 'INSTANT' ? '⚡' : '📅'} {b.booking_type}
                        </span>
                      </td>
                      <td><StatusBadge status={b.status} /></td>
                      <td>
                        <div className="text-xs">
                          <div>{format(new Date(b.scheduled_start), 'dd MMM, h:mm a')}</div>
                          <div className="text-muted">→ {format(new Date(b.scheduled_end), 'h:mm a')}</div>
                        </div>
                      </td>
                      <td className="text-sm">
                        {duration ? `${duration}h` : '—'}
                      </td>
                      <td className="font-semibold text-sm">
                        {b.total_price != null ? formatPaise(b.total_price) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${b.payment_status === 'PAID_OFFLINE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 11 }}>
                          {b.payment_status === 'PAID_OFFLINE' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td>
                        {b.status === 'COMPLETED' && b.payment_status === 'PENDING' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleMarkPaid(b.booking_id)}
                            disabled={paying === b.booking_id}
                          >
                            {paying === b.booking_id ? '...' : 'Mark Paid'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
