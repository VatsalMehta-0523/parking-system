import { createContext, useContext, useState, useEffect } from 'react'
import { providerLogin, providerRegister } from '../api/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [provider, setProvider] = useState(() => {
    const d = localStorage.getItem('provider_data')
    return d ? JSON.parse(d) : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const login = async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await providerLogin({ email, password })
      localStorage.setItem('provider_token', data.access_token)
      localStorage.setItem('provider_data', JSON.stringify(data.provider))
      setProvider(data.provider)
      return data.provider
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const data = await providerRegister(payload)
      localStorage.setItem('provider_token', data.access_token)
      localStorage.setItem('provider_data', JSON.stringify(data.provider))
      setProvider(data.provider)
      return data.provider
    } catch (e) {
      setError(e.response?.data?.detail || 'Registration failed')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('provider_token')
    localStorage.removeItem('provider_data')
    setProvider(null)
  }

  return (
    <AuthContext.Provider value={{ provider, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
