import { NavLink } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'

function Icon({ path }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} />
    </svg>
  )
}

const navItems = [
  { to: '/overview',     label: 'Overview',     icon: 'M12 22A10 10 0 1 1 12 2a10 10 0 0 1 0 20z M12 16v-4 M12 8h.01' },
  { to: '/find-parking', label: 'Find Parking', icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6' },
  { to: '/history',      label: 'History',      icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
]

export default function CustomerSidebar() {
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
          Smart Parking Platform
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
        <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title="Profile"
            style={{ marginBottom: 12 }}
          >
            <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            <span className="sidebar-label">Profile</span>
        </NavLink>

        <a
          href="/provider/login"
          target="_blank" 
          rel="noopener noreferrer"
          className="sidebar-item"
          style={{ color: 'var(--text-secondary)' }}
          title="Provider Login"
        >
          <Icon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <span className="sidebar-label">Provider Login</span>
        </a>
      </div>
    </aside>
  )
}
