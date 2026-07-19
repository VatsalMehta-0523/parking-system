import { useState, useRef, useEffect, useCallback } from 'react'
import { detectSurveillance } from '../../api/api'

// ─── Slot Colors ────────────────────────────────────────────────────────────
const SLOT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

function getSlotColor(index) {
  return SLOT_COLORS[index % SLOT_COLORS.length]
}

// ─── Slot Name Modal ────────────────────────────────────────────────────────
function SlotNameModal({ onConfirm, onCancel, slotIndex }) {
  const [name, setName] = useState(`Slot ${String.fromCharCode(65 + slotIndex)}`)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) onConfirm(name.trim())
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal animate-slide-up" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div className="font-display font-bold mb-4" style={{ fontSize: 18 }}>Name This Slot</div>
        <p className="text-sm text-muted mb-20">
          Enter a name for the polygon region you just drew.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-20">
            <label className="form-label">Slot Name</label>
            <input
              ref={inputRef}
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Slot A, Zone 1"
              required
            />
          </div>
          <div className="flex gap-8">
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
              Save Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Canvas Drawing Engine ──────────────────────────────────────────────────
function useCanvasDrawing(canvasRef, image, slots, setSlots, activePolygon, setActivePolygon) {
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // Draw completed slots
    slots.forEach((slot, idx) => {
      const color = getSlotColor(idx)
      const points = slot.polygon.map(([nx, ny]) => [nx * canvas.width, ny * canvas.height])

      // Fill
      ctx.beginPath()
      points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
      ctx.closePath()

      if (slot.status === 'occupied') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.30)'
        ctx.strokeStyle = '#ef4444'
      } else if (slot.status === 'vacant') {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.30)'
        ctx.strokeStyle = '#22c55e'
      } else {
        ctx.fillStyle = color + '25'
        ctx.strokeStyle = color
      }
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Label
      const cx = points.reduce((s, [x]) => s + x, 0) / points.length
      const cy = points.reduce((s, [, y]) => s + y, 0) / points.length

      // Label background
      ctx.font = 'bold 13px "DM Sans", sans-serif'
      const metrics = ctx.measureText(slot.name)
      const labelW = metrics.width + 16
      const labelH = 24
      ctx.fillStyle = slot.status === 'occupied' ? '#ef4444'
        : slot.status === 'vacant' ? '#22c55e' : color
      ctx.beginPath()
      ctx.roundRect(cx - labelW / 2, cy - labelH / 2, labelW, labelH, 6)
      ctx.fill()

      // Label text
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(slot.name, cx, cy)

      // Vertex dots
      points.forEach(([x, y]) => {
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
      })
    })

    // Draw active polygon being drawn
    if (activePolygon.length > 0) {
      const color = getSlotColor(slots.length)
      const points = activePolygon.map(([nx, ny]) => [nx * canvas.width, ny * canvas.height])

      ctx.beginPath()
      points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Semi-transparent fill preview
      if (points.length >= 3) {
        ctx.beginPath()
        points.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
        ctx.closePath()
        ctx.fillStyle = color + '15'
        ctx.fill()
      }

      // Vertex dots for active polygon
      points.forEach(([x, y], i) => {
        ctx.beginPath()
        ctx.arc(x, y, i === 0 ? 7 : 5, 0, Math.PI * 2)
        ctx.fillStyle = i === 0 ? color : '#ffffff'
        ctx.fill()
        ctx.strokeStyle = i === 0 ? '#ffffff' : color
        ctx.lineWidth = 2
        ctx.stroke()
      })

      // Hint: highlight first point when enough vertices
      if (points.length >= 3) {
        const [fx, fy] = points[0]
        ctx.beginPath()
        ctx.arc(fx, fy, 12, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3])
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }, [canvasRef, image, slots, activePolygon])

  useEffect(() => {
    draw()
  }, [draw])

  return draw
}

// ─── Main Surveillance Page ─────────────────────────────────────────────────
export default function SurveillancePage() {
  const [image, setImage] = useState(null)          // HTMLImageElement
  const [imageFile, setImageFile] = useState(null)   // File object for API
  const [imageName, setImageName] = useState('')
  const [slots, setSlots] = useState([])
  const [activePolygon, setActivePolygon] = useState([])
  const [showNameModal, setShowNameModal] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const fileInputRef = useRef(null)

  // Redraw canvas on state change
  useCanvasDrawing(canvasRef, image, slots, setSlots, activePolygon, setActivePolygon)

  // ─── Image Upload ──────────────────────────────────────────────────────
  const handleImageLoad = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return

    setImageFile(file)
    setImageName(file.name)
    setSlots([])
    setActivePolygon([])
    setResults(null)
    setError(null)
    setIsDrawing(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImage(img)

        // Size canvas after image loads
        requestAnimationFrame(() => {
          const canvas = canvasRef.current
          const container = containerRef.current
          if (canvas && container) {
            const maxW = container.clientWidth
            const ratio = img.height / img.width
            canvas.width = maxW
            canvas.height = maxW * ratio
          }
        })
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    handleImageLoad(file)
  }, [handleImageLoad])

  // ─── Canvas Click — Add Polygon Vertex ─────────────────────────────────
  const handleCanvasClick = useCallback((e) => {
    if (!isDrawing || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    // Normalize to 0–1 range
    const nx = x / canvas.width
    const ny = y / canvas.height

    // Check if clicking near first point to close polygon
    if (activePolygon.length >= 3) {
      const [fx, fy] = activePolygon[0]
      const dist = Math.sqrt(
        Math.pow((fx - nx) * canvas.width, 2) + Math.pow((fy - ny) * canvas.height, 2)
      )
      if (dist < 15) {
        // Close polygon — prompt for name
        setShowNameModal(true)
        setIsDrawing(false)
        return
      }
    }

    setActivePolygon(prev => [...prev, [nx, ny]])
  }, [isDrawing, activePolygon])

  // ─── Right-click / double-click to close polygon ───────────────────────
  const handleCanvasDoubleClick = useCallback((e) => {
    e.preventDefault()
    if (activePolygon.length >= 3) {
      setShowNameModal(true)
      setIsDrawing(false)
    }
  }, [activePolygon])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (activePolygon.length >= 3) {
      setShowNameModal(true)
      setIsDrawing(false)
    }
  }, [activePolygon])

  // ─── Slot Name Confirmed ──────────────────────────────────────────────
  const handleSlotNameConfirm = useCallback((name) => {
    setSlots(prev => [...prev, {
      name,
      polygon: [...activePolygon],
      status: null,
      confidence: 0,
      vehicles_detected: 0,
    }])
    setActivePolygon([])
    setShowNameModal(false)
    setResults(null)
  }, [activePolygon])

  const handleSlotNameCancel = useCallback(() => {
    setActivePolygon([])
    setShowNameModal(false)
  }, [])

  // ─── Delete Slot ──────────────────────────────────────────────────────
  const handleDeleteSlot = useCallback((idx) => {
    setSlots(prev => prev.filter((_, i) => i !== idx))
    setResults(null)
  }, [])

  // ─── Start Drawing Mode ───────────────────────────────────────────────
  const startDrawing = useCallback(() => {
    setIsDrawing(true)
    setActivePolygon([])
    setError(null)
  }, [])

  // ─── Cancel Drawing ───────────────────────────────────────────────────
  const cancelDrawing = useCallback(() => {
    setIsDrawing(false)
    setActivePolygon([])
  }, [])

  // ─── Run Detection ────────────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (!imageFile || slots.length === 0) return

    setDetecting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', imageFile)

      const regions = slots.map(s => ({
        slot_name: s.name,
        polygon: s.polygon,
      }))
      formData.append('regions', JSON.stringify(regions))

      const data = await detectSurveillance(formData)

      // Update slots with results
      setSlots(prev => prev.map(slot => {
        const result = data.slots?.find(r => r.slot_name === slot.name)
        if (result) {
          return {
            ...slot,
            status: result.status,
            confidence: result.confidence,
            vehicles_detected: result.vehicles_detected,
          }
        }
        return slot
      }))

      setResults(data)
    } catch (e) {
      console.error('Detection error:', e)
      setError(e.response?.data?.detail || 'Detection failed. Make sure the backend is running and the YOLO model is available.')
    } finally {
      setDetecting(false)
    }
  }, [imageFile, slots])

  // ─── Reset Everything ─────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setImage(null)
    setImageFile(null)
    setImageName('')
    setSlots([])
    setActivePolygon([])
    setResults(null)
    setError(null)
    setIsDrawing(false)
    setDetecting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // ─── Counts ───────────────────────────────────────────────────────────
  const occupiedCount = slots.filter(s => s.status === 'occupied').length
  const vacantCount = slots.filter(s => s.status === 'vacant').length
  const hasResults = slots.some(s => s.status !== null)

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between page-header">
        <div>
          <h1 className="page-title">AI Surveillance</h1>
          <p className="page-subtitle">
            Upload a parking area image, define slot regions, and detect occupancy with YOLOv8
          </p>
        </div>
        {image && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            ↻ Start Over
          </button>
        )}
      </div>

      {/* Upload Area — shown when no image */}
      {!image ? (
        <div
          className={`card animate-fade-in`}
          style={{
            border: dragOver ? '2px dashed var(--accent)' : '2px dashed var(--border)',
            background: dragOver ? 'var(--accent-light)' : 'var(--bg-surface)',
            textAlign: 'center',
            padding: '80px 40px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderRadius: 20,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
        >
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'var(--accent-light)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 36,
          }}>
            📸
          </div>
          <div className="font-display font-bold" style={{ fontSize: 20, marginBottom: 8 }}>
            Upload Parking Area Image
          </div>
          <p className="text-sm text-muted" style={{ maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
            Drag & drop an image here, or click to browse.
            <br />Supports JPEG, PNG, WebP — max 10MB.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => handleImageLoad(e.target.files?.[0])}
          />
        </div>
      ) : (
        <>
          {/* Results Summary Banner */}
          {hasResults && (
            <div className="grid-3 mb-24 animate-slide-up">
              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ background: '#3b82f618' }}>
                  <span style={{ fontSize: 20 }}>🎯</span>
                </div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px' }}>
                  {results?.total_detections ?? 0}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Vehicles Detected</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <span style={{ fontSize: 20 }}>🔴</span>
                </div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--danger)' }}>
                  {occupiedCount}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Occupied Slots</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(34,197,94,0.1)' }}>
                  <span style={{ fontSize: 20 }}>🟢</span>
                </div>
                <div className="font-display" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--success)' }}>
                  {vacantCount}
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Vacant Slots</div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid-2 mb-24" style={{ gridTemplateColumns: '1fr 360px' }}>
            {/* Left — Canvas */}
            <div className="card" style={{ padding: 16, overflow: 'hidden' }}>
              <div className="flex items-center justify-between mb-12" style={{ padding: '0 8px' }}>
                <div>
                  <div className="text-sm font-semibold">{imageName}</div>
                  <div className="text-xs text-muted">
                    {isDrawing
                      ? `Drawing — ${activePolygon.length} points placed. ${activePolygon.length >= 3 ? 'Click first point or double-click to close.' : 'Click to add vertices.'}`
                      : `${slots.length} slot${slots.length !== 1 ? 's' : ''} defined`
                    }
                  </div>
                </div>
                {isDrawing ? (
                  <div className="flex gap-8">
                    {activePolygon.length >= 3 && (
                      <button className="btn btn-success btn-sm" onClick={() => {
                        setShowNameModal(true)
                        setIsDrawing(false)
                      }}>
                        ✓ Complete
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={cancelDrawing}>
                      ✕ Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={startDrawing}>
                    + Draw Slot
                  </button>
                )}
              </div>

              <div
                ref={containerRef}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: isDrawing ? '2px solid var(--accent)' : '1px solid var(--border)',
                  cursor: isDrawing ? 'crosshair' : 'default',
                  transition: 'border 0.2s ease',
                  position: 'relative',
                  background: '#000',
                }}
              >
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onDoubleClick={handleCanvasDoubleClick}
                  onContextMenu={handleContextMenu}
                  style={{
                    width: '100%',
                    display: 'block',
                  }}
                />

                {/* Drawing mode overlay indicator */}
                {isDrawing && (
                  <div style={{
                    position: 'absolute', top: 12, left: 12,
                    background: 'var(--accent)', color: '#fff',
                    padding: '5px 14px', borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.2s ease',
                  }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#fff', animation: 'pulse 1s infinite',
                    }} />
                    Drawing Mode
                  </div>
                )}
              </div>

              {/* Instructions bar */}
              {isDrawing && (
                <div className="animate-fade-in" style={{
                  marginTop: 12, padding: '10px 16px',
                  background: 'var(--accent-light)', borderRadius: 10,
                  fontSize: 12, color: 'var(--accent)', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span>💡</span>
                  Click on the image to place polygon vertices. When you have 3+ points, 
                  click the first point, double-click, or right-click to complete the polygon.
                </div>
              )}
            </div>

            {/* Right — Controls & Slot List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Action Buttons */}
              <div className="card">
                <div className="font-display font-bold mb-12" style={{ fontSize: 15 }}>
                  Detection Controls
                </div>
                <button
                  className="btn btn-primary btn-full mb-8"
                  disabled={slots.length === 0 || detecting || isDrawing}
                  onClick={runDetection}
                  style={{ height: 44 }}
                >
                  {detecting ? (
                    <span className="flex items-center gap-8">
                      <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                      Analyzing...
                    </span>
                  ) : (
                    <>🧠 Run AI Detection</>
                  )}
                </button>
                <p className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
                  {slots.length === 0
                    ? 'Draw at least one slot polygon to enable detection.'
                    : `${slots.length} slot${slots.length !== 1 ? 's' : ''} ready for analysis. Click above to detect vehicles.`
                  }
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error animate-slide-up">
                  <span>⚠</span>
                  <div>
                    <div className="font-semibold" style={{ fontSize: 13 }}>Detection Failed</div>
                    <div className="text-xs mt-4">{error}</div>
                  </div>
                </div>
              )}

              {/* Slot List */}
              <div className="card" style={{ flex: 1 }}>
                <div className="flex items-center justify-between mb-12">
                  <div className="font-display font-bold" style={{ fontSize: 15 }}>
                    Defined Slots
                  </div>
                  {slots.length > 0 && (
                    <span className="badge badge-accent" style={{ fontSize: 11 }}>{slots.length}</span>
                  )}
                </div>

                {slots.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: 'var(--bg-surface-2)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px', fontSize: 24,
                    }}>
                      ✏️
                    </div>
                    <p className="text-sm font-semibold" style={{ marginBottom: 4 }}>No slots defined</p>
                    <p className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
                      Click "Draw Slot" and outline parking spaces on the image.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className="animate-fade-in"
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: 'var(--bg-surface-2)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div className="flex items-center gap-12">
                          <div
                            style={{
                              width: 10, height: 10, borderRadius: '50%',
                              background: slot.status === 'occupied' ? '#ef4444'
                                : slot.status === 'vacant' ? '#22c55e'
                                : getSlotColor(idx),
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <div className="font-semibold text-sm">{slot.name}</div>
                            <div className="text-xs text-muted">
                              {slot.polygon.length} vertices
                              {slot.status && (
                                <> · {slot.confidence > 0 ? `${(slot.confidence * 100).toFixed(0)}% conf` : ''}</>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          {slot.status && (
                            <span className={`badge ${slot.status === 'occupied' ? 'badge-danger' : 'badge-success'}`}
                              style={{ fontSize: 11 }}>
                              {slot.status === 'occupied' ? '🔴 Occupied' : '🟢 Vacant'}
                            </span>
                          )}
                          <button
                            className="btn-icon"
                            style={{ padding: 4, borderRadius: 6 }}
                            onClick={() => handleDeleteSlot(idx)}
                            title="Remove slot"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18 M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Detection Details */}
              {results && (
                <div className="card animate-slide-up">
                  <div className="font-display font-bold mb-8" style={{ fontSize: 15 }}>
                    Detection Details
                  </div>
                  <div className="text-xs text-muted mb-12">
                    Image: {results.image_size?.width}×{results.image_size?.height}px
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.all_detections?.slice(0, 10).map((det, i) => (
                      <div key={i} className="flex items-center justify-between"
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--bg-surface-2)', fontSize: 12 }}>
                        <span className="font-semibold" style={{ textTransform: 'capitalize' }}>
                          {det.class}
                        </span>
                        <span className="text-muted">
                          {(det.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    {results.all_detections?.length > 10 && (
                      <div className="text-xs text-muted" style={{ textAlign: 'center', padding: 4 }}>
                        +{results.all_detections.length - 10} more detections
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Slot Name Modal */}
      {showNameModal && (
        <SlotNameModal
          onConfirm={handleSlotNameConfirm}
          onCancel={handleSlotNameCancel}
          slotIndex={slots.length}
        />
      )}
    </div>
  )
}
