import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

import AuthPage from './pages/Auth/AuthPage'
import Dashboard from './pages/Dashboard/Dashboard'
import DailyLogPage from './pages/DailyLog/DailyLogPage'
import CalendarPage from './pages/Calendar/CalendarPage'
import AnalyticsPage from './pages/Analytics/AnalyticsPage'
import HabitsPage from './pages/Habits/HabitsPage'
import GoalsPage from './pages/Goals/GoalsPage'
import SettingsPage from './pages/Settings/SettingsPage'
import ExercisesPage from './pages/Exercises/ExercisesPage'
import StreaksPage from './pages/Streaks/StreaksPage'

// Wrapper so DailyLogPage can read ?date= query param
function DailyLogWrapper({ mode }) {
  return <DailyLogPage mode={mode} />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '14px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login"  element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/"              element={<Dashboard />} />
                    <Route path="/log"           element={<DailyLogWrapper mode="morning" />} />
                    <Route path="/log/evening"   element={<DailyLogWrapper mode="evening" />} />
                    <Route path="/calendar"      element={<CalendarPage />} />
                    <Route path="/analytics"     element={<AnalyticsPage />} />
                    <Route path="/habits"        element={<HabitsPage />} />
                    <Route path="/exercises"     element={<ExercisesPage />} />
                    <Route path="/goals"         element={<GoalsPage />} />
                    <Route path="/streaks"      element={<StreaksPage />} />
                    <Route path="/settings"      element={<SettingsPage />} />
                    <Route path="*"              element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
