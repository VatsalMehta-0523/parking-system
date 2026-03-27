import { Outlet, useLocation } from 'react-router-dom'
import CustomerSidebar from '../common/CustomerSidebar'
import Header from '../common/Header'

const PAGE_META = {
  '/find-parking': { title: 'Find Parking',  subtitle: 'Discover and reserve parking near you' },
  '/book':         { title: 'Book a Slot',   subtitle: 'Complete your reservation' },
  '/ticket':       { title: 'Your Ticket',   subtitle: 'Booking confirmation' },
  '/session':      { title: 'Active Session',subtitle: 'Your parking session is live' },
  '/history':      { title: 'Booking History', subtitle: 'Past and active reservations' },
  '/profile':      { title: 'My Profile',    subtitle: 'Manage your account' },
}

export default function CustomerLayout() {
  const location = useLocation()
  const meta = PAGE_META[location.pathname] || { title: 'ParkSmart', subtitle: '' }

  return (
    <div className="app-shell">
      <CustomerSidebar />
      <div className="main-content">
        <Header title={meta.title} subtitle={meta.subtitle} />
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
