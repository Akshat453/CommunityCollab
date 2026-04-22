import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cc_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('cc_token', data.token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const register = async (name, email, password, city) => {
    const { data } = await api.post('/auth/register', { name, email, password, city })
    localStorage.setItem('cc_token', data.token)
    localStorage.setItem('cc_user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('cc_token')
    localStorage.removeItem('cc_user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/users/me')
      localStorage.setItem('cc_user', JSON.stringify(data.data))
      setUser(data.data)
    } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
