import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../common/Sidebar'
import Header from '../common/Header'

const PAGE_META = {
  '/provider/dashboard': { title: 'Dashboard', subtitle: 'Overview of your parking operations' },
  '/provider/locations': { title: 'Locations',  subtitle: 'Manage your parking facilities' },
  '/provider/bookings':  { title: 'Bookings',   subtitle: 'All reservations across your locations' },
  '/provider/analytics': { title: 'Analytics',  subtitle: 'Performance metrics and trends' },
  '/provider/surveillance': { title: 'Surveillance', subtitle: 'AI-powered parking slot detection' },
}

export default function ProviderLayout() {
  const { provider } = useAuth()
  const location = useLocation()

  if (!provider) {
    return <Navigate to="/provider/login" replace />
  }

  const meta = PAGE_META[location.pathname] || { title: 'ParkSmart', subtitle: '' }
  const hour = new Date().getHours()
  const greeting = `Hello, ${provider.name.split(' ')[0]} 👋`

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header greeting={greeting} subtitle={meta.subtitle} />
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
