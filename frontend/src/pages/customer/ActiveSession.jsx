import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getBooking, endSession } from '../../api/api'
import { SessionTimer } from '../../components/common/CountdownTimer'
import { StatusBadge, formatPaise } from '../../components/common/StatusBadge'
import { format } from 'date-fns'

export default function ActiveSession() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(state?.booking || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSummary, setShowSummary] = useState(false)
  const [completedBooking, setCompletedBooking] = useState(null)

  useEffect(() => {
    if (!booking) { navigate('/find-parking'); return }
    const id = setInterval(async () => {
      try {
        const fresh = await getBooking(booking.booking_id)
        setBooking(fresh)
      } catch {}
    }, 30000)
    return () => clearInterval(id)
  }, [])

  if (!booking) return null

  const handleEnd = async () => {
    if (!window.confirm('End your parking session now?')) return
    setLoading(true)
    setError(null)
    try {
      const updated = await endSession(booking.booking_id)
      setCompletedBooking(updated)
      setShowSummary(true)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to end session')
    } finally {
      setLoading(false)
    }
  }

  // ─── Payment Summary Modal ───────────────────────────────────────────────
  if (showSummary && completedBooking) {
    const duration = completedBooking.actual_start && completedBooking.actual_end
      ? ((new Date(completedBooking.actual_end) - new Date(completedBooking.actual_start)) / 3600000).toFixed(2)
      : null
    return (
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>✅</div>
        <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          Session Ended
        </h1>
        <p className="text-secondary mb-24">Thank you for using ParkSmart!</p>

        <div className="card mb-20" style={{ textAlign: 'left' }}>
          <div className="font-display font-bold mb-16" style={{ fontSize: 16 }}>Session Summary</div>
          {[
            ['Location', completedBooking.location_name],
            ['Slot', completedBooking.slot_name],
            ['Started', completedBooking.actual_start ? format(new Date(completedBooking.actual_start), 'dd MMM, h:mm a') : '—'],
            ['Ended', completedBooking.actual_end ? format(new Date(completedBooking.actual_end), 'dd MMM, h:mm a') : '—'],
            ['Duration', duration ? `${duration} hrs` : '—'],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-sm text-secondary">{l}</span>
              <span className="text-sm font-semibold">{v}</span>
            </div>
          ))}
          <div className="flex justify-between items-center" style={{ padding: '14px 0 0' }}>
            <span className="font-bold" style={{ fontSize: 16 }}>Total Amount</span>
            <span className="font-display font-800 text-accent" style={{ fontSize: 22 }}>
              {formatPaise(completedBooking.total_price)}
            </span>
          </div>
        </div>

        <div className="alert alert-info mb-20" style={{ textAlign: 'left' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          <span>Please pay <strong>{formatPaise(completedBooking.total_price)}</strong> at the parking counter or to the attendant.</span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/history')}>
            View History
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/find-parking')}>
            Park Again
          </button>
        </div>
      </div>
    )
  }

  // ─── Active Session ──────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Status */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {booking.status === 'OVERSTAY' ? '⚠️' : '🚗'}
        </div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>
          {booking.status === 'OVERSTAY' ? 'Overstay Detected' : 'Session Active'}
        </h1>
        <div style={{ marginTop: 8 }}><StatusBadge status={booking.status} /></div>
      </div>

      {booking.status === 'OVERSTAY' && (
        <div className="alert alert-warning mb-16">
          ⚠️ Your scheduled time has elapsed. Additional charges may apply. Please end your session.
        </div>
      )}

      {/* Live Timer */}
      <div className="card mb-20" style={{ textAlign: 'center', padding: 32 }}>
        {booking.actual_start && <SessionTimer startTime={booking.actual_start} />}
      </div>

      {/* Session Details */}
      <div className="card mb-20">
        <div className="font-semibold mb-12" style={{ fontSize: 14 }}>Session Details</div>
        {[
          ['Location', booking.location_name],
          ['Area', booking.location_area],
          ['Slot', booking.slot_name],
          ['Vehicle', booking.user_phone],
          ['Started', booking.actual_start ? format(new Date(booking.actual_start), 'dd MMM, h:mm a') : '—'],
          ['Scheduled End', booking.scheduled_end ? format(new Date(booking.scheduled_end), 'dd MMM, h:mm a') : '—'],
        ].filter(([, v]) => v).map(([l, v]) => (
          <div key={l} className="flex justify-between items-center" style={{ padding: '9px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span className="text-sm text-secondary">{l}</span>
            <span className="text-sm font-semibold">{v}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert-error mb-16">{error}</div>}

      <button
        className={`btn ${booking.status === 'OVERSTAY' ? 'btn-danger' : 'btn-primary'} btn-lg btn-full`}
        onClick={handleEnd}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-8"><span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> Ending...</span>
        ) : '🏁 End Session'}
      </button>

      <div className="text-center mt-16">
        <div className="text-xs text-muted">Booking ID</div>
        <div className="text-xs font-semibold" style={{ fontFamily: 'monospace', marginTop: 2 }}>{booking.booking_id}</div>
      </div>
    </div>
  )
}
