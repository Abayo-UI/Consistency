import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/',          label: 'Dashboard',       icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 13.5h6V20H4zM14 4h6v16h-6zM9 4h2v16H9z" /></svg> },
  { to: '/calendar',  label: 'Calendar',         icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="5" width="16" height="15" rx="2" /><path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" /></svg> },
  { to: '/analytics', label: 'Analytics',        icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="M5 19V9" /><path strokeLinecap="round" d="M12 19V5" /><path strokeLinecap="round" d="M19 19v-7" /></svg> },
  { to: '/habits',    label: 'Habits',           icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.5 9 16l10-10" /></svg> },
  { to: '/exercises', label: 'Exercises',        icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 12h8M8 17h8M5 7h1M18 7h1M5 12h1M18 12h1M5 17h1M18 17h1" /></svg> },
  { to: '/goals',     label: 'Health',           icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4c3 3 6 4 6 8a6 6 0 1 1-12 0c0-4 3-5 6-8Z" /></svg> },
  { to: '/streaks',   label: 'Streaks',          icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" /></svg> },
  { to: '/settings',  label: 'Settings',         icon: <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" d="M19 12a7.9 7.9 0 0 0-.1-1.2l2.1-1.6-2-3.5-2.5 1a8.2 8.2 0 0 0-2.1-1.2L14 2h-4l-.5 2.7a8.2 8.2 0 0 0-2.1 1.2l-2.5-1-2 3.5 2.1 1.6A7.9 7.9 0 0 0 5 12c0 .4 0 .8.1 1.2L3 14.8l2 3.5 2.5-1c.6.5 1.3.9 2.1 1.2L10 22h4l.5-2.7c.8-.3 1.5-.7 2.1-1.2l2.5 1 2-3.5-2.1-1.6c.1-.4.1-.8.1-1.2Z" /></svg> },
]

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true))
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="relative flex h-screen bg-gray-50 overflow-hidden">
      {isMobile && isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
        />
      )}

      {isMobile && !isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
          aria-label="Open navigation"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex h-full flex-col border-r border-gray-100 bg-white py-4 shadow-sm transition-all duration-300 ${isMobile ? (isSidebarOpen ? 'w-56' : 'w-0') : (isSidebarOpen ? 'w-56' : 'w-16')} ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'} md:static md:translate-x-0 md:shrink-0 overflow-hidden`}
      >
        <div className={`mb-6 flex items-center ${isSidebarOpen ? 'justify-between px-5' : 'justify-center px-3'}`}>
          {isSidebarOpen ? (
            <span className="text-lg font-bold text-gray-900">Consistency</span>
          ) : null}

          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
            aria-label={isSidebarOpen ? 'Collapse navigation' : 'Open navigation'}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => {
                if (isMobile) setIsSidebarOpen(false)
              }}
              className={({ isActive }) =>
                `flex items-center rounded-xl py-2 text-sm font-medium transition-colors ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center text-brand-600">{icon}</span>
              {isSidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-gray-100 px-3 pt-4">
          <div className={`flex items-center ${isSidebarOpen ? 'gap-2.5 px-2' : 'justify-center'}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-800">{user?.name ?? 'User'}</p>
                <button onClick={handleLogout} className="text-xs text-gray-400 transition-colors hover:text-red-500">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className={`mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${isMobile ? 'pt-16' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  )
}
