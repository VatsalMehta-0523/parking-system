import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Inject auth token for provider requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('provider_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('provider_token')
      localStorage.removeItem('provider_data')
    }
    return Promise.reject(err)
  }
)

// ─── Locations ────────────────────────────────────────────────────────────────
export const searchLocations = (params) =>
  api.get('/locations/search', { params }).then((r) => r.data)

export const getLocation = (id) =>
  api.get(`/locations/${id}`).then((r) => r.data)

export const getLocationSlots = (id) =>
  api.get(`/locations/${id}/slots`).then((r) => r.data)

export const getMyLocations = () =>
  api.get('/locations/provider/my-locations').then((r) => r.data)

export const createLocation = (data) =>
  api.post('/locations/', data).then((r) => r.data)

export const updateLocation = (id, data) =>
  api.patch(`/locations/${id}`, data).then((r) => r.data)

// ─── Slots ────────────────────────────────────────────────────────────────────
export const addSlot = (locationId, data) =>
  api.post(`/providers/locations/${locationId}/slots`, data).then((r) => r.data)

export const updateSlot = (slotId, data) =>
  api.patch(`/providers/slots/${slotId}`, data).then((r) => r.data)

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const createInstantBooking = (data) =>
  api.post('/bookings/instant', data).then((r) => r.data)

export const createAdvanceBooking = (data) =>
  api.post('/bookings/advance', data).then((r) => r.data)

export const getBooking = (id) =>
  api.get(`/bookings/${id}`).then((r) => r.data)

export const startSession = (id) =>
  api.post(`/bookings/${id}/start`).then((r) => r.data)

export const endSession = (id) =>
  api.post(`/bookings/${id}/end`).then((r) => r.data)

export const cancelBooking = (id) =>
  api.post(`/bookings/${id}/cancel`).then((r) => r.data)

export const listBookings = (params) =>
  api.get('/bookings/', { params }).then((r) => r.data)

export const markPaid = (id) =>
  api.post(`/bookings/${id}/mark-paid`).then((r) => r.data)

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUserByPhone = (phone) =>
  api.get(`/users/by-phone/${phone}`).then((r) => r.data)

export const getHistoryByPhone = (phone) =>
  api.get(`/users/history/by-phone/${phone}`).then((r) => r.data)

export const updateUser = (id, data) =>
  api.put(`/users/${id}`, data).then((r) => r.data)

// ─── Provider Auth ────────────────────────────────────────────────────────────
export const providerLogin = (data) =>
  api.post('/providers/login', data).then((r) => r.data)

export const providerRegister = (data) =>
  api.post('/providers/register', data).then((r) => r.data)

export const getProviderProfile = () =>
  api.get('/providers/me').then((r) => r.data)

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getDashboardStats = () =>
  api.get('/analytics/dashboard').then((r) => r.data)

export const getRevenueTrend = (days = 30) =>
  api.get('/analytics/revenue', { params: { days } }).then((r) => r.data)

export const getOccupancyByHour = () =>
  api.get('/analytics/occupancy-by-hour').then((r) => r.data)

export const getLocationStats = () =>
  api.get('/analytics/location-stats').then((r) => r.data)

export default api
