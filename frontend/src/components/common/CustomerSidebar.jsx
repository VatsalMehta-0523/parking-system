import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Icon({ path }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded-customer')
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-customer', JSON.stringify(isExpanded))
  }, [isExpanded])

  const toggleSidebar = () => setIsExpanded(prev => !prev)

  return (
    <aside 
      className={`sidebar ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
      onClick={(e) => {
        if (!isExpanded) setIsExpanded(true)
      }}
      style={{ cursor: !isExpanded ? 'pointer' : 'default' }}
    >
      <div className="sidebar-header" style={{ padding: isExpanded ? '20px 24px' : '20px 0', display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center', borderBottom: '1px solid var(--border)' }}>
        {isExpanded ? (
          <div className="sidebar-logo-text" style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)' }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--text-primary)', color: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
              P
            </div>
            ParkSmart
          </div>
        ) : (
          <button onClick={toggleSidebar} className="btn-icon" style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)' }} title="Expand Sidebar">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        )}
        
        {isExpanded && (
          <button onClick={toggleSidebar} className="btn-icon" style={{ border: 'none', background: 'transparent', padding: 4, color: 'var(--text-secondary)' }} title="Collapse Sidebar">
             <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        )}
      </div>

      <nav className="sidebar-nav" style={{ flex: 1, padding: isExpanded ? '20px 16px' : '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title={item.label}
            style={{ borderRadius: '8px' }}
          >
            <Icon path={item.icon} />
            {isExpanded && <span className="sidebar-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', padding: isExpanded ? '20px 16px' : '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <NavLink
            to="/profile"
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            title="Profile"
            style={{ borderRadius: '8px' }}
          >
            <Icon path="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            {isExpanded && <span className="sidebar-label">Profile</span>}
        </NavLink>

        <a
          href="/provider/login"
          target="_blank" 
          rel="noopener noreferrer"
          className="sidebar-item"
          style={{ color: 'var(--text-secondary)', borderRadius: '8px' }}
          title="Provider Login"
        >
          <Icon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          {isExpanded && <span className="sidebar-label">Provider Login</span>}
        </a>
      </div>
    </aside>
  )
}
