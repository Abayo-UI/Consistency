import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('consistency_user')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      // Normalize `username` -> `name` if necessary
      if (parsed && !parsed.name) parsed.name = parsed.username ?? parsed.email
      return parsed
    } catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('consistency_token'))
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return }
      try {
        const { data } = await authApi.me()
        // Backend uses `username`; normalize to `name` for UI components
        const raw = data.user ?? data
        const normalized = raw
        if (raw) {
          normalized.name = raw.name ?? raw.username ?? raw.email
        }
        setUser(normalized)
        localStorage.setItem('consistency_user', JSON.stringify(normalized))
      } catch {
        localStorage.removeItem('consistency_token')
        localStorage.removeItem('consistency_user')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    verify()
  }, []) // eslint-disable-line

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials)
    const tok = data.token
    const raw = data.user ?? data
    const usr = raw ? { ...raw, name: raw.name ?? raw.username ?? raw.email } : null
    localStorage.setItem('consistency_token', tok)
    localStorage.setItem('consistency_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
    return usr
  }, [])

  const signup = useCallback(async (credentials) => {
    const { data } = await authApi.signup(credentials)
    const tok = data.token
    const raw = data.user ?? data
    const usr = raw ? { ...raw, name: raw.name ?? raw.username ?? raw.email } : null
    localStorage.setItem('consistency_token', tok)
    localStorage.setItem('consistency_user', JSON.stringify(usr))
    setToken(tok)
    setUser(usr)
    return usr
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('consistency_token')
    localStorage.removeItem('consistency_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
