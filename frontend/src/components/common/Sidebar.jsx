import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'

function Icon({ path }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

const navItems = [
  { to: '/provider/dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10' },
  { to: '/provider/locations',  label: 'Locations',  icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6' },
  { to: '/provider/bookings',   label: 'Bookings',   icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { to: '/provider/analytics',  label: 'Analytics',  icon: 'M18 20V10 M12 20V4 M6 20v-6' },
  { to: '/provider/surveillance', label: 'Surveillance', icon: 'M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1-3-3v-1a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z M9 10h.01 M15 10h.01 M9.5 15a3.5 3.5 0 0 0 5 0' },
]

export default function Sidebar() {
  const { provider, logout } = useAuth()
  const navigate = useNavigate()
  
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded')
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded))
  }, [isExpanded])

  const toggleSidebar = () => setIsExpanded(prev => !prev)

  const handleLogout = () => {
    logout()
    navigate('/provider/login')
  }

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

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', padding: isExpanded ? '20px 16px' : '20px 12px' }}>
        {provider && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '8px' : '0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 }}>
              {provider.name.charAt(0).toUpperCase()}
            </div>
            {isExpanded && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {provider.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {provider.email}
                </div>
              </div>
            )}
          </div>
        )}
        <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--text-secondary)', width: '100%', justifyContent: isExpanded ? 'flex-start' : 'center', background: 'transparent', border: 'none', padding: isExpanded ? '10px 12px' : '10px 0', borderRadius: '8px' }} title="Logout">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
          </svg>
          {isExpanded && <span className="sidebar-label">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
