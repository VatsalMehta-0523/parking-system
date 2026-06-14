import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

function Icon({ path }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} />
    </svg>
  )
}

const navItems = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { to: '/provider/locations',  label: 'Locations',  icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6' },
  { to: '/provider/bookings',   label: 'Bookings',   icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { to: '/provider/analytics',  label: 'Analytics',  icon: 'M18 20V10 M12 20V4 M6 20v-6' },
  { to: '/provider/detection',  label: 'AI Detection', icon: 'M15 3h6v6 M9 21H3v-6 M21 3l-7 7 M3 21l7-7 M21 21v-6h-6 M3 3v6h6' },
]

export default function Sidebar() {
  const { provider, logout } = useAuth()
  const navigate = useNavigate()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const sidebarRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/provider/login')
  }

  return (
    <aside 
      ref={sidebarRef}
      className={`sidebar ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
      onMouseEnter={() => setIsExpanded(true)}
    >
      <div className="sidebar-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '24px 20px 20px' : '24px 0 20px', transition: 'padding 0.3s ease' }}>
        <div className="sidebar-logo-text" style={{ fontSize: isExpanded ? 20 : 28, textAlign: 'center' }}>
          {isExpanded ? <>Park<span>Smart</span></> : <>P<span>S</span></>}
        </div>
        <div className="sidebar-subtitle" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>
          Provider Console
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <Icon path={item.icon} />
            <span className="sidebar-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {provider && (
          <div className="sidebar-subtitle" style={{ marginBottom: 12, padding: isExpanded ? '10px 12px' : '0', borderRadius: 10, background: isExpanded ? 'var(--bg-surface-2)' : 'transparent', textAlign: isExpanded ? 'left' : 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {isExpanded ? provider.name : provider.name.charAt(0).toUpperCase()}
            </div>
            {isExpanded && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                {provider.email}
              </div>
            )}
          </div>
        )}
        <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--danger)' }} title="Logout">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
          </svg>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  )
}
