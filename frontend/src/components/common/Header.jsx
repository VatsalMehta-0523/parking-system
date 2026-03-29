import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function Header({ title, subtitle, greeting }) {
  const { theme, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header className={`top-header ${scrolled ? 'scrolled' : ''}`}>
      <div>
        {greeting ? (
          <div>
            <span className="font-display font-bold text-lg">{greeting}</span>
            {subtitle && <p className="text-sm text-secondary mt-4">{subtitle}</p>}
          </div>
        ) : (
          <div>
            <h1 className="font-display" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>
              {title}
            </h1>
            {subtitle && <p className="text-sm text-secondary" style={{ marginTop: 2 }}>{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div style={{ position: 'relative' }}>
          <button className="btn-icon" title="Notifications" onClick={() => setShowNotifs(!showNotifs)}>
            <BellIcon />
          </button>
          
          {showNotifs && (
            <div className="card animate-slide-up" style={{ 
              position: 'absolute', top: '120%', right: 0, width: 260, padding: 0, overflow: 'hidden', zIndex: 100 
            }}>
              <div style={{ padding: '16px', background: 'var(--bg-surface-2)', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>
                Notifications
              </div>
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No notifications
              </div>
            </div>
          )}
        </div>
        <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  )
}
