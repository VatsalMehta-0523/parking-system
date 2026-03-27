import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistoryByPhone } from '../../api/api'
import { StatusBadge, formatPaise } from '../../components/common/StatusBadge'
import { format } from 'date-fns'

export default function HistoryPage() {
  const [phone, setPhone] = useState('')
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await getHistoryByPhone(phone.trim())
      setBookings(data)
    } catch (e) {
      setError('Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const handleResume = (b) => {
    if (b.status === 'RESERVED') navigate('/ticket', { state: { booking: b } })
    else if (b.status === 'ACTIVE' || b.status === 'OVERSTAY') navigate('/session', { state: { booking: b } })
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Booking History</h1>
        <p className="page-subtitle">Look up your past and active bookings</p>
      </div>

      <div className="card mb-24" style={{ maxWidth: 480 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
          />
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} /> : 'Search'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error mb-16">{error}</div>}

      {bookings !== null && (
        <>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6"/>
              </svg>
              <p className="font-semibold mt-12">No bookings found</p>
              <p className="text-sm mt-4">Try a different phone number</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bookings.map((b) => (
                <div key={b.booking_id} className="card" style={{ padding: 20 }}>
                  <div className="flex items-start justify-between mb-12">
                    <div>
                      <div className="font-semibold" style={{ fontSize: 15 }}>{b.location_name || '—'}</div>
                      <div className="text-sm text-muted">{b.location_area}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: 14 }}>
                    <div>
                      <div className="text-xs text-muted">Slot</div>
                      <div className="text-sm font-semibold">{b.slot_name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Type</div>
                      <div className="text-sm font-semibold">{b.booking_type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Start</div>
                      <div className="text-sm font-semibold">
                        {format(new Date(b.scheduled_start), 'dd MMM, h:mm a')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Amount</div>
                      <div className="text-sm font-semibold">
                        {b.total_price != null ? formatPaise(b.total_price) : '—'}
                      </div>
                    </div>
                  </div>

                  {(b.status === 'RESERVED' || b.status === 'ACTIVE' || b.status === 'OVERSTAY') && (
                    <button
                      className="btn btn-primary btn-sm btn-full"
                      onClick={() => handleResume(b)}
                    >
                      {b.status === 'RESERVED' ? '🎫 View Ticket' : '🚗 Resume Session'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
