import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getBooking, startSession, cancelBooking } from '../../api/api'
import CountdownTimer from '../../components/common/CountdownTimer'
import { StatusBadge, formatPaise } from '../../components/common/StatusBadge'
import { format } from 'date-fns'

export default function TicketPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(state?.booking || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = async () => {
    if (!booking) return
    try {
      const fresh = await getBooking(booking.booking_id)
      setBooking(fresh)
    } catch {}
  }

  useEffect(() => {
    if (!booking) { navigate('/find-parking'); return }
    // Poll every 15s to pick up background status changes
    const id = setInterval(refresh, 15000)
    return () => clearInterval(id)
  }, [])

  if (!booking) return null

  const isInstant = booking.booking_type === 'INSTANT'
  const ttlExpiry = isInstant
    ? new Date(new Date(booking.created_at).getTime() + 30 * 60000)
    : new Date(booking.scheduled_start)

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    try {
      const updated = await startSession(booking.booking_id)
      setBooking(updated)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to start session')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm('Cancel this booking?')) return
    setLoading(true)
    try {
      await cancelBooking(booking.booking_id)
      navigate('/find-parking')
    } catch (e) {
      setError(e.response?.data?.detail || 'Cancel failed')
    } finally {
      setLoading(false)
    }
  }

  // If active, go to active session screen
  if (booking.status === 'ACTIVE' || booking.status === 'OVERSTAY') {
    navigate('/session', { state: { booking } })
    return null
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {/* Status Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {booking.status === 'RESERVED' ? '🎫' : booking.status === 'EXPIRED' ? '⏰' : '❌'}
        </div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>
          {booking.status === 'RESERVED' ? 'Booking Confirmed!' : `Booking ${booking.status}`}
        </h1>
        <div style={{ marginTop: 8 }}><StatusBadge status={booking.status} /></div>
      </div>

      {/* Ticket */}
      <div className="ticket mb-20">
        {/* Slot */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div className="text-xs text-muted" style={{ letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Assigned Slot
          </div>
          <div className="font-display" style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)', letterSpacing: -2 }}>
            {booking.slot_name || '—'}
          </div>
          <div className="text-sm text-secondary">{booking.location_name}</div>
          {booking.location_area && <div className="text-xs text-muted">{booking.location_area}</div>}
        </div>

        <div style={{ borderTop: '1px dashed var(--border)', margin: '16px 0' }} />

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="flex justify-between">
            <span className="text-sm text-secondary">Type</span>
            <span className="text-sm font-semibold">
              {booking.booking_type === 'INSTANT' ? '⚡ Instant' : '📅 Advance'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-secondary">Scheduled Start</span>
            <span className="text-sm font-semibold">
              {format(new Date(booking.scheduled_start), 'dd MMM, h:mm a')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-secondary">Scheduled End</span>
            <span className="text-sm font-semibold">
              {format(new Date(booking.scheduled_end), 'dd MMM, h:mm a')}
            </span>
          </div>
          {booking.hourly_rate && (
            <div className="flex justify-between">
              <span className="text-sm text-secondary">Rate</span>
              <span className="text-sm font-semibold">{formatPaise(booking.hourly_rate)}/hr</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-secondary">Vehicle</span>
            <span className="text-sm font-semibold">{booking.user?.vehicle_number || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* TTL Countdown — only for RESERVED bookings */}
      {booking.status === 'RESERVED' && (
        <div className="card mb-16" style={{ textAlign: 'center' }}>
          <CountdownTimer
            targetTime={ttlExpiry}
            label={isInstant ? '⏱ Time to Start Session' : 'Until Scheduled Start'}
            onExpire={refresh}
          />
          <p className="text-xs text-muted mt-8">
            {isInstant
              ? 'Start your session before the timer runs out'
              : 'Session will be auto-started at scheduled time'}
          </p>
        </div>
      )}

      {error && <div className="alert alert-error mb-16">{error}</div>}

      {/* Actions */}
      {booking.status === 'RESERVED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="btn btn-success btn-lg btn-full"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-8"><span className="spinner" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> Starting...</span>
            ) : '🚗 Start Session'}
          </button>
          <button
            className="btn btn-ghost btn-full"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel Booking
          </button>
        </div>
      )}

      {(booking.status === 'EXPIRED' || booking.status === 'CANCELLED') && (
        <button className="btn btn-primary btn-full" onClick={() => navigate('/find-parking')}>
          Find New Parking
        </button>
      )}

      {/* Booking ID */}
      <div className="text-center mt-20">
        <div className="text-xs text-muted">Booking ID</div>
        <div className="text-xs font-semibold" style={{ fontFamily: 'monospace', marginTop: 2 }}>
          {booking.booking_id}
        </div>
      </div>
    </div>
  )
}
