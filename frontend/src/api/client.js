import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
const isLocalHost = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredBaseUrl || '')
const fallbackBaseUrl = import.meta.env.DEV
  ? 'http://localhost:3000'
  : window.location.origin

const API_BASE_URL = (import.meta.env.PROD && isLocalHost
  ? fallbackBaseUrl
  : (configuredBaseUrl || fallbackBaseUrl)).replace(/\/$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor: inject Bearer token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('consistency_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: 401 → redirect to /login ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('consistency_token')
      localStorage.removeItem('consistency_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
