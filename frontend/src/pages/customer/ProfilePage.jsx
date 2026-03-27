import { useState, useEffect } from 'react'
import { getUserByPhone, updateUser } from '../../api/api'

export default function ProfilePage() {
  const [phone, setPhone] = useState('')
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleLookup = async (e) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLookupLoading(true)
    setError(null)
    try {
      const data = await getUserByPhone(phone.trim())
      setUser(data)
      setForm({ name: data.name, email: data.email || '', vehicle_number: data.vehicle_number || '' })
    } catch {
      setError('No account found for this phone number.')
      setUser(null)
    } finally {
      setLookupLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await updateUser(user.user_id, {
        name: form.name || undefined,
        email: form.email || undefined,
        vehicle_number: form.vehicle_number || undefined,
      })
      setUser(updated)
      setEditing(false)
      setSuccess('Profile updated successfully.')
    } catch {
      setError('Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and update your account details</p>
      </div>

      {/* Phone Lookup */}
      {!user && (
        <div className="card mb-20">
          <div className="font-semibold mb-16" style={{ fontSize: 14 }}>Look up your account</div>
          <form onSubmit={handleLookup} style={{ display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              placeholder="Your registered phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
            />
            <button className="btn btn-primary" type="submit" disabled={lookupLoading}>
              {lookupLoading
                ? <span className="spinner" style={{ width: 16, height: 16, borderTopColor: '#fff' }} />
                : 'Find'}
            </button>
          </form>
          {error && <div className="alert alert-error mt-12">{error}</div>}
        </div>
      )}

      {/* Profile Card */}
      {user && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-12">
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Syne, sans-serif', fontWeight: 800,
                fontSize: 20, color: 'var(--accent)',
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold" style={{ fontSize: 16 }}>{user.name}</div>
                <div className="text-sm text-muted">{user.phone}</div>
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setEditing((e) => !e); setSuccess(null) }}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {success && <div className="alert alert-success mb-16">{success}</div>}

          {editing ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Number</label>
                <input
                  className="form-input"
                  value={form.vehicle_number}
                  onChange={(e) => setForm((f) => ({ ...f, vehicle_number: e.target.value }))}
                  placeholder="GJ 01 AB 1234"
                />
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['Email', user.email || '—'],
                ['Vehicle', user.vehicle_number || '—'],
                ['Member Since', new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center"
                  style={{ padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                  <span className="text-sm text-secondary">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn btn-ghost btn-sm mt-16"
            onClick={() => { setUser(null); setPhone(''); setEditing(false) }}
          >
            Switch Account
          </button>
        </div>
      )}
    </div>
  )
}
