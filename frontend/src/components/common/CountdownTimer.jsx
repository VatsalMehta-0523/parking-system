import { useState, useEffect } from 'react'

export default function CountdownTimer({ targetTime, label = 'Expires in', onExpire }) {
  const [remaining, setRemaining] = useState(null)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetTime) - new Date()
      setRemaining(Math.max(0, Math.floor(diff / 1000)))
      if (diff <= 0 && onExpire) onExpire()
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [targetTime])

  if (remaining === null) return null

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const isUrgent = remaining < 300 // under 5 min

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        className="text-xs font-semibold"
        style={{
          color: isUrgent ? 'var(--danger)' : 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className="countdown"
        style={{
          color: isUrgent ? 'var(--danger)' : 'var(--accent)',
          fontSize: 44,
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  )
}

export function SessionTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const calc = () => {
      const diff = new Date() - new Date(startTime)
      setElapsed(Math.max(0, Math.floor(diff / 1000)))
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const hours   = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60

  return (
    <div style={{ textAlign: 'center' }}>
      <div className="text-xs font-semibold text-muted" style={{ letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
        Duration
      </div>
      <div className="countdown" style={{ color: 'var(--success)', fontSize: 44 }}>
        {hours > 0 && `${String(hours).padStart(2, '0')}:`}
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  )
}
