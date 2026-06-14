import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'

// Layouts
import CustomerLayout from './components/common/CustomerLayout'
import ProviderLayout from './components/common/ProviderLayout'

// Customer Pages
import FindParking  from './pages/customer/FindParking'
import BookingPage  from './pages/customer/BookingPage'
import TicketPage   from './pages/customer/TicketPage'
import ActiveSession from './pages/customer/ActiveSession'
import HistoryPage  from './pages/customer/HistoryPage'
import ProfilePage  from './pages/customer/ProfilePage'
import OverviewPage from './pages/customer/OverviewPage'

// Provider Pages
import LoginPage    from './pages/provider/LoginPage'
import Dashboard    from './pages/provider/Dashboard'
import LocationsPage from './pages/provider/LocationsPage'
import BookingsPage  from './pages/provider/BookingsPage'
import AnalyticsPage from './pages/provider/AnalyticsPage'
import DetectionPage from './pages/provider/DetectionPage'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/find-parking" replace />} />

            {/* Customer routes */}
            <Route element={<CustomerLayout />}>
              <Route path="/find-parking" element={<FindParking />} />
              <Route path="/book"         element={<BookingPage />} />
              <Route path="/ticket"       element={<TicketPage />} />
              <Route path="/session"      element={<ActiveSession />} />
              <Route path="/history"      element={<HistoryPage />} />
              <Route path="/profile"      element={<ProfilePage />} />
              <Route path="/overview"     element={<OverviewPage />} />
            </Route>

            {/* Provider auth (no layout) */}
            <Route path="/provider/login" element={<LoginPage />} />

            {/* Provider dashboard (protected layout) */}
            <Route element={<ProviderLayout />}>
              <Route path="/provider/dashboard" element={<Dashboard />} />
              <Route path="/provider/locations"  element={<LocationsPage />} />
              <Route path="/provider/bookings"   element={<BookingsPage />} />
              <Route path="/provider/analytics"  element={<AnalyticsPage />} />
              <Route path="/provider/detection"  element={<DetectionPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/find-parking" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
