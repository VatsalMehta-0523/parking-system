import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createInstantBooking, createAdvanceBooking } from '../../api/api'
import { formatPaise } from '../../components/common/StatusBadge'

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

export default function BookingPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const location = state?.location
  const type = state?.type || 'INSTANT'

  const [form, setForm] = useState({ name: '', phone: '', email: '', vehicle_number: '' })
  const [advTime, setAdvTime] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!location) {
    return (
      <div className="empty-state">
        <p>No location selected.</p>
        <button className="btn btn-primary mt-16" onClick={() => navigate('/find-parking')}>Find Parking</button>
      </div>
    )
  }

  const hourlyRate = location.hourly_rate || 0

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.phone) { setError('Name and phone are required'); return }
    setLoading(true)
    setError(null)
    try {
      let booking
      if (type === 'INSTANT') {
        booking = await createInstantBooking({
          location_id: location.location_id,
          user_name: form.name,
          phone: form.phone,
          email: form.email || null,
          vehicle_number: form.vehicle_number || null,
        })
      } else {
        if (!advTime.start || !advTime.end) { setError('Please select start and end time'); setLoading(false); return }
        booking = await createAdvanceBooking({
          location_id: location.location_id,
          scheduled_start: new Date(advTime.start).toISOString(),
          scheduled_end: new Date(advTime.end).toISOString(),
          user_name: form.name,
          phone: form.phone,
          email: form.email || null,
          vehicle_number: form.vehicle_number || null,
        })
      }
      navigate('/ticket', { state: { booking, location } })
    } catch (e) {
      setError(e.response?.data?.detail || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-12 mb-24">
        <button className="btn-icon" onClick={() => navigate(-1)} title="Back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="font-display" style={{ fontSize: 22, fontWeight: 800 }}>
            {type === 'INSTANT' ? '⚡ Park Now' : '📅 Reserve for Later'}
          </h1>
          <p className="text-sm text-secondary">Complete your booking</p>
        </div>
      </div>

      {/* Location Summary */}
      <div className="card mb-20">
        <div className="font-display font-bold" style={{ fontSize: 17, marginBottom: 12 }}>
          {location.name}
        </div>
        <InfoRow label="Area" value={`${location.area || ''}${location.area ? ', ' : ''}${location.city}`} />
        <InfoRow label="Rate" value={`${formatPaise(hourlyRate)}/hr`} />
        <InfoRow label="Available" value={`${location.available_slots} of ${location.total_slots} slots`} />
        {type === 'INSTANT' && (
          <InfoRow label="Default Duration" value="3 hours" />
        )}
        {location.reservation_fee > 0 && (
          <InfoRow label="Reservation Fee" value={formatPaise(location.reservation_fee)} />
        )}
      </div>

      {/* Advance Time Selection */}
      {type === 'ADVANCE' && (
        <div className="card mb-20">
          <div className="font-semibold mb-16" style={{ fontSize: 14 }}>Select Time Slot</div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={advTime.start}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                onChange={(e) => setAdvTime((p) => ({ ...p, start: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={advTime.end}
                min={advTime.start || new Date().toISOString().slice(0, 16)}
                onChange={(e) => setAdvTime((p) => ({ ...p, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Details Form */}
      <div className="card">
        <div className="font-semibold mb-16" style={{ fontSize: 14 }}>Your Details</div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input name="name" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input name="phone" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="text-muted">(optional)</span></label>
              <input name="email" type="email" className="form-input" placeholder="you@email.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Number <span className="text-muted">(optional)</span></label>
              <input name="vehicle_number" className="form-input" placeholder="GJ 01 AB 1234" value={form.vehicle_number} onChange={handleChange} />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-8"><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</span>
                ) : (
                  type === 'INSTANT' ? 'Confirm Booking' : 'Reserve Slot'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
