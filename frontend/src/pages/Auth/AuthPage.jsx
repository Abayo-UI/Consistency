import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui'
import toast from 'react-hot-toast'

export default function AuthPage({ mode = 'login' }) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Email and password are required.'); return }
    if (!isLogin && !form.name) { setError('Name is required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password })
      } else {
        await signup({ name: form.name, email: form.email, password: form.password })
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created!')
      navigate('/')
    } catch (err) {
      // Backend returns errors as { error: '...' } while some handlers use { message: '...' }
      const remote = err?.response?.data
      setError(remote?.error ?? remote?.message ?? err?.message ?? 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="font-bold text-2xl text-gray-900">Consistency</span>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{isLogin ? 'Sign in' : 'Create account'}</h1>
          <p className="text-sm text-green-600 mb-5">{isLogin ? 'What you are not changing, you are choosing!' : 'Start your consistency journey.'}</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">Full name</label>
                <input name="name" value={form.name} onChange={set} placeholder="Leslie" className="input" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={set} placeholder="you@example.com" className="input" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" value={form.password} onChange={set} placeholder="••••••••" className="input" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading && <Spinner size="sm" />}
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <Link to={isLogin ? '/signup' : '/login'} className="text-brand-600 font-medium hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
