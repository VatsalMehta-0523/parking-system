import { useState, useEffect } from 'react'
import {
  getMyLocations, createLocation, updateLocation,
  getLocationSlots, addSlot, updateSlot,
} from '../../api/api'
import { formatPaise } from '../../components/common/StatusBadge'

// ─── Add Location Modal ────────────────────────────────────────────────────
function AddLocationModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', area: '', city: '', latitude: '', longitude: '',
    hourly_rate_rs: '', reservation_fee_rs: '', map_link: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createLocation({
        name: form.name, area: form.area || null, city: form.city,
        latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude),
        hourly_rate: Math.round(parseFloat(form.hourly_rate_rs) * 100),
        reservation_fee: form.reservation_fee_rs ? Math.round(parseFloat(form.reservation_fee_rs) * 100) : 0,
        map_link: form.map_link || null,
      })
      onSaved()
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to create location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-bold mb-20" style={{ fontSize: 18 }}>Add New Location</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Location Name *</label>
            <input name="name" className="form-input" placeholder="Central Park Parking" value={form.name} onChange={handle} required />
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Area</label>
              <input name="area" className="form-input" placeholder="Navrangpura" value={form.area} onChange={handle} />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input name="city" className="form-input" placeholder="Ahmedabad" value={form.city} onChange={handle} required />
            </div>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Latitude *</label>
              <input name="latitude" type="number" step="any" className="form-input" placeholder="23.0225" value={form.latitude} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude *</label>
              <input name="longitude" type="number" step="any" className="form-input" placeholder="72.5714" value={form.longitude} onChange={handle} required />
            </div>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Hourly Rate (₹) *</label>
              <input name="hourly_rate_rs" type="number" step="0.01" className="form-input" placeholder="50" value={form.hourly_rate_rs} onChange={handle} required />
            </div>
            <div className="form-group">
              <label className="form-label">Reservation Fee (₹)</label>
              <input name="reservation_fee_rs" type="number" step="0.01" className="form-input" placeholder="0" value={form.reservation_fee_rs} onChange={handle} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Google Maps Link</label>
            <input name="map_link" className="form-input" placeholder="https://maps.google.com/..." value={form.map_link} onChange={handle} />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="flex gap-10 mt-4">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Pricing Modal ────────────────────────────────────────────────────
function EditPricingModal({ location, onClose, onSaved }) {
  const [hourly, setHourly] = useState(((location.pricing_policies?.[0]?.hourly_rate || 0) / 100).toString())
  const [resFee, setResFee] = useState(((location.pricing_policies?.[0]?.reservation_fee || 0) / 100).toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateLocation(location.location_id, {
        hourly_rate: Math.round(parseFloat(hourly) * 100),
        reservation_fee: Math.round(parseFloat(resFee) * 100),
      })
      onSaved()
    } catch {
      setError('Failed to update pricing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-bold mb-20" style={{ fontSize: 18 }}>Edit Pricing — {location.name}</div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Hourly Rate (₹)</label>
            <input type="number" step="0.01" className="form-input" value={hourly} onChange={(e) => setHourly(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Reservation Fee (₹)</label>
            <input type="number" step="0.01" className="form-input" value={resFee} onChange={(e) => setResFee(e.target.value)} />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="flex gap-10 mt-4">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Slot Panel ─────────────────────────────────────────────────────────────
function SlotPanel({ location, onClose }) {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSlot, setNewSlot] = useState({ slot_name: '', slot_type: 'CAR' })
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await getLocationSlots(location.location_id)
    setSlots(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (slot) => {
    await updateSlot(slot.slot_id, { is_active: !slot.is_active })
    load()
  }

  const handleAddSlot = async (e) => {
    e.preventDefault()
    setAdding(true)
    await addSlot(location.location_id, newSlot)
    setNewSlot({ slot_name: '', slot_type: 'CAR' })
    setShowAdd(false)
    setAdding(false)
    load()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-20">
          <div>
            <div className="font-display font-bold" style={{ fontSize: 18 }}>Manage Slots</div>
            <div className="text-sm text-muted">{location.name}</div>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd((s) => !s)}>
              + Add Slot
            </button>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>
        </div>

        {showAdd && (
          <form onSubmit={handleAddSlot} className="card mb-16" style={{ background: 'var(--bg-surface-2)', padding: 16 }}>
            <div className="flex gap-10 items-end">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Slot Name</label>
                <input className="form-input" placeholder="A1, B2, etc." value={newSlot.slot_name}
                  onChange={(e) => setNewSlot((n) => ({ ...n, slot_name: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Type</label>
                <select className="form-input" value={newSlot.slot_type}
                  onChange={(e) => setNewSlot((n) => ({ ...n, slot_type: e.target.value }))}>
                  <option>CAR</option><option>BIKE</option><option>EV</option>
                </select>
              </div>
              <button className="btn btn-success btn-sm" type="submit" disabled={adding} style={{ flexShrink: 0, height: 40 }}>
                {adding ? '...' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <p className="text-sm">No slots added yet. Add your first slot above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slots.map((slot) => (
              <div key={slot.slot_id} className="flex items-center justify-between"
                style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-12">
                  <div className="font-display font-bold" style={{ fontSize: 18, minWidth: 36 }}>{slot.slot_name}</div>
                  <div>
                    <span className="badge badge-neutral" style={{ fontSize: 11 }}>{slot.slot_type}</span>
                    {slot.is_occupied && <span className="badge badge-warning ml-4" style={{ fontSize: 11 }}>Occupied</span>}
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-xs text-muted">{slot.is_active ? 'Active' : 'Disabled'}</span>
                  <button
                    className={`toggle ${slot.is_active ? 'on' : ''}`}
                    onClick={() => handleToggle(slot)}
                    title={slot.is_active ? 'Disable slot' : 'Enable slot'}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editPricing, setEditPricing] = useState(null)
  const [slotPanel, setSlotPanel] = useState(null)

  const load = async () => {
    setLoading(true)
    const data = await getMyLocations()
    setLocations(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleToggleActive = async (loc) => {
    await updateLocation(loc.location_id, { is_active: !loc.is_active })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="page-subtitle">Manage your parking facilities and slots</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Location</button>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1,2].map(i => (
            <div key={i} className="card" style={{ height: 220 }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : locations.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6"/>
          </svg>
          <p className="font-semibold mt-12">No locations yet</p>
          <p className="text-sm mt-4">Add your first parking location to get started</p>
          <button className="btn btn-primary mt-16" onClick={() => setShowAdd(true)}>Add Location</button>
        </div>
      ) : (
        <div className="grid-2">
          {locations.map((loc) => {
            const pricing = loc.pricing_policies?.[0]
            const occupancy = loc.active_slots > 0
              ? Math.round(((loc.active_slots - loc.available_slots) / loc.active_slots) * 100)
              : 0
            return (
              <div key={loc.location_id} className="card card-hover animate-fade-in">
                <div className="flex items-start justify-between mb-16">
                  <div>
                    <div className="font-display font-bold" style={{ fontSize: 17 }}>{loc.name}</div>
                    <div className="text-sm text-muted">{loc.area && `${loc.area}, `}{loc.city}</div>
                  </div>
                  <div className="flex items-center gap-8">
                    <span className={`badge ${loc.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {loc.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <button className={`toggle ${loc.is_active ? 'on' : ''}`} onClick={() => handleToggleActive(loc)} />
                  </div>
                </div>

                {/* Occupancy Bar */}
                <div className="mb-16">
                  <div className="flex justify-between mb-6">
                    <span className="text-xs text-muted">Occupancy</span>
                    <span className="text-xs font-semibold">{occupancy}% — {loc.available_slots}/{loc.active_slots} free</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${occupancy}%`,
                      background: occupancy > 80 ? '#ef4444' : occupancy > 50 ? '#f59e0b' : '#10b981',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div className="text-xs text-muted">Total Slots</div>
                    <div className="font-bold" style={{ fontSize: 18 }}>{loc.total_slots}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Hourly Rate</div>
                    <div className="font-bold" style={{ fontSize: 18 }}>{formatPaise(pricing?.hourly_rate || 0)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Res. Fee</div>
                    <div className="font-bold" style={{ fontSize: 18 }}>{formatPaise(pricing?.reservation_fee || 0)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                    onClick={() => setSlotPanel(loc)}>
                    Manage Slots
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}
                    onClick={() => setEditPricing(loc)}>
                    Edit Pricing
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <AddLocationModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />
      )}
      {editPricing && (
        <EditPricingModal
          location={editPricing}
          onClose={() => setEditPricing(null)}
          onSaved={() => { setEditPricing(null); load() }}
        />
      )}
      {slotPanel && (
        <SlotPanel location={slotPanel} onClose={() => setSlotPanel(null)} />
      )}
    </div>
  )
}
