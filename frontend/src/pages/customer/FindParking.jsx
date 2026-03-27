import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ParkingMap from '../../components/map/ParkingMap'
import { AvailabilityDot, formatPaise } from '../../components/common/StatusBadge'
import { searchLocations } from '../../api/api'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  )
}

function GpsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    </svg>
  )
}

function LocationCardSkeleton() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 13, width: '40%', marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="skeleton" style={{ height: 28, width: 80 }} />
        <div className="skeleton" style={{ height: 28, width: 80 }} />
      </div>
    </div>
  )
}

export default function FindParking() {
  const [query, setQuery] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const searchTimer = useRef(null)
  const navigate = useNavigate()

  const fetchLocations = async (q = '', coords = null) => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (q) params.city = q
      if (coords) { params.lat = coords.lat; params.lon = coords.lon }
      const data = await searchLocations(params)
      setLocations(data)
    } catch (e) {
      setError('Failed to load parking locations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      fetchLocations(query, userLocation)
    }, 400)
    return () => clearTimeout(searchTimer.current)
  }, [query])

  const handleGps = () => {
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude }
        setUserLocation(coords)
        fetchLocations('', coords)
        setGpsLoading(false)
      },
      () => {
        setGpsLoading(false)
        setError('Location access denied. Showing all locations.')
      }
    )
  }

  const getAvailClass = (loc) => {
    const r = loc.total_slots > 0 ? loc.available_slots / loc.total_slots : 0
    return r > 0.5 ? 'high' : r > 0.2 ? 'medium' : 'low'
  }

  return (
    <div>
      {/* Hero Section */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.1 }}>
          Find Your <span style={{ color: 'var(--accent)' }}>Perfect Spot</span>
        </h1>
        <p className="text-secondary" style={{ marginTop: 6, fontSize: 15 }}>
          Real-time availability · Instant booking · No hassle
        </p>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon />
            </div>
            <input
              className="form-input"
              style={{ paddingLeft: 42, width: '100%' }}
              placeholder="Search by city or area..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleGps}
            disabled={gpsLoading}
            title="Use my location"
            style={{ gap: 6 }}
          >
            <GpsIcon />
            {gpsLoading ? 'Getting...' : 'Near Me'}
          </button>
        </div>
      </div>

      {/* Map */}
      <div style={{ marginBottom: 24 }}>
        <ParkingMap
          locations={locations}
          userLocation={userLocation}
          onLocationSelect={setSelected}
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-16">
        <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>
          {loading ? 'Searching...' : `${locations.length} Location${locations.length !== 1 ? 's' : ''} Found`}
        </h2>
        {userLocation && (
          <span className="badge badge-accent" style={{ fontSize: 11 }}>📍 Sorted by distance</span>
        )}
      </div>

      {error && (
        <div className="alert alert-warning mb-16">{error}</div>
      )}

      {/* Location Cards */}
      {loading ? (
        <div className="grid-2">
          {[1,2,3,4].map(i => <LocationCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid-2">
          {locations.map((loc) => (
            <div
              key={loc.location_id}
              className={`location-card ${selected?.location_id === loc.location_id ? 'card-hover' : ''}`}
              onClick={() => setSelected(loc)}
              style={{
                borderColor: selected?.location_id === loc.location_id ? 'var(--accent)' : undefined,
                boxShadow: selected?.location_id === loc.location_id ? '0 0 0 2px var(--accent)' : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="font-semibold" style={{ fontSize: 15 }}>{loc.name}</div>
                  <div className="text-sm text-muted" style={{ marginTop: 2 }}>
                    {loc.area && `${loc.area}, `}{loc.city}
                  </div>
                </div>
                {loc.distance_km != null && (
                  <span className="badge badge-neutral" style={{ fontSize: 11, flexShrink: 0 }}>
                    {loc.distance_km} km
                  </span>
                )}
              </div>

              <div className="flex items-center gap-16 mb-16" style={{ flexWrap: 'wrap' }}>
                <div className="flex items-center gap-4">
                  <AvailabilityDot available={loc.available_slots} total={loc.total_slots} />
                  <span className="text-sm font-semibold">
                    {loc.available_slots}/{loc.total_slots} available
                  </span>
                </div>
                <div>
                  <span className="font-bold text-accent">{formatPaise(loc.hourly_rate)}</span>
                  <span className="text-xs text-muted">/hr</span>
                </div>
              </div>

              <div className="flex" style={{ gap: 8 }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  disabled={loc.available_slots === 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/book', { state: { location: loc, type: 'INSTANT' } })
                  }}
                >
                  Park Now
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  disabled={loc.available_slots === 0}
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/book', { state: { location: loc, type: 'ADVANCE' } })
                  }}
                >
                  Reserve Later
                </button>
              </div>

              {loc.available_slots === 0 && (
                <div className="text-xs text-danger font-semibold" style={{ marginTop: 8, textAlign: 'center' }}>
                  No slots available
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && locations.length === 0 && !error && (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="font-semibold mt-12">No parking locations found</p>
          <p className="text-sm mt-4">Try a different search or expand your area</p>
        </div>
      )}
    </div>
  )
}
