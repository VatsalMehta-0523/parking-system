import { useEffect, useRef } from 'react'

import L from 'leaflet'

function getLeaflet() {
  return L
}

function availColor(available, total) {
  if (total === 0) return '#9b9690'
  const ratio = available / total
  if (ratio > 0.5) return '#16a34a'
  if (ratio > 0.2) return '#d97706'
  return '#dc2626'
}

function createMarkerIcon(color) {
  const leaflet = getLeaflet()
  if (!leaflet) return null
  return leaflet.divIcon({
    className: '',
    html: `
      <div style="
        width:36px;height:36px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      "></div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  })
}

export default function ParkingMap({ locations = [], center, onLocationSelect, userLocation }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (mapInstanceRef.current) return
    const leaflet = getLeaflet()
    if (!leaflet) return

    const defaultCenter = center || (userLocation ? [userLocation.lat, userLocation.lon] : [23.0225, 72.5714])

    mapInstanceRef.current = leaflet.map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true,
    })

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstanceRef.current)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update center when user location changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    if (userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lon], 13)
      const leaflet = getLeaflet()
      if (leaflet) {
        const userIcon = leaflet.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.25)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        leaflet.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup('Your location')
      }
    }
  }, [userLocation])

  // Render location markers
  useEffect(() => {
    const leaflet = getLeaflet()
    if (!leaflet || !mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    locations.forEach((loc) => {
      const color = availColor(loc.available_slots, loc.total_slots)
      const icon = createMarkerIcon(color)
      if (!icon) return

      const marker = leaflet
        .marker([Number(loc.latitude), Number(loc.longitude)], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family:'DM Sans',sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:14px;margin-bottom:6px">${loc.name}</div>
            <div style="font-size:12px;color:#5a5750;margin-bottom:8px">${loc.area || loc.city}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
              <span style="font-size:12px;color:${color};font-weight:600">${loc.available_slots}/${loc.total_slots} available</span>
              <span style="font-size:12px;font-weight:600">₹${(loc.hourly_rate / 100).toFixed(0)}/hr</span>
            </div>
            <button
              onclick="window.selectLocation && window.selectLocation('${loc.location_id}')"
              style="width:100%;padding:7px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer"
            >
              Reserve
            </button>
          </div>
        `)

      marker.on('click', () => {
        if (onLocationSelect) onLocationSelect(loc)
      })

      markersRef.current.push(marker)
    })

    // expose for popup button
    window.selectLocation = (id) => {
      const loc = locations.find((l) => l.location_id === id)
      if (loc && onLocationSelect) onLocationSelect(loc)
    }
  }, [locations])

  return (
    <div
      ref={mapRef}
      className="map-container"
      style={{ height: '420px', width: '100%' }}
    />
  )
}
