import { useEffect, useMemo, useState } from 'react'
import { streakApi } from '../../api/services'

const CATEGORY_CONFIG = [
  { key: 'abstinence', label: 'Abstinence', description: 'Days without slipping' },
  { key: 'exercise', label: 'Exercise', description: 'Workout streak' },
  { key: 'earlyWake', label: 'Early Wake', description: 'Woke before 7' },
  { key: 'waterGoal', label: 'Water Goal', description: 'Hit your water goal' },
  { key: 'avoidDoomScrolling', label: 'No Doom Scrolling', description: 'Stayed off doom scrolling' },
  { key: 'sugarFree', label: 'Sugar Free', description: 'No sugary intake' },
  { key: 'trabajo', label: 'Trabajo', description: 'Work streak' },
  { key: 'prayed', label: 'Prayer', description: 'Prayer streak' },
  { key: 'knowledge', label: 'Knowledge', description: 'Learning streak' },
  { key: 'upskilling', label: 'Upskilling', description: 'Skill-building streak' },
]

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function StreaksPage() {
  const [streaks, setStreaks] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const response = await streakApi.get()
        if (mounted) {
          setStreaks(response?.data ?? response)
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.message || 'Could not load streaks')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const summary = useMemo(() => {
    if (!streaks) return null

    const active = CATEGORY_CONFIG.filter((item) => (streaks[item.key]?.current || 0) > 0)
    const longest = CATEGORY_CONFIG.reduce((best, item) => {
      const currentLongest = streaks[item.key]?.longest || 0
      return currentLongest > best ? currentLongest : best
    }, 0)

    return { active: active.length, longest }
  }, [streaks])

  if (loading) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Health</p>
            <h1 className="text-2xl font-semibold text-gray-900">Streaks</h1>
            <p className="mt-1 text-sm text-gray-600">Track your daily momentum across the habits you care about most.</p>
          </div>
          <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
            <p className="font-semibold">{summary?.active ?? 0} active streaks</p>
            <p className="text-brand-600">Best run: {summary?.longest ?? 0} days</p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORY_CONFIG.slice()
          .sort((a, b) => {
            const aLongest = streaks?.[a.key]?.longest || 0
            const bLongest = streaks?.[b.key]?.longest || 0
            return bLongest - aLongest
          })
          .map((item) => {
            const bucket = streaks?.[item.key] || {}
            const current = bucket.current || 0
            const longest = bucket.longest || 0
            const lastUpdated = bucket.lastUpdated
            const waterGoal = item.key === 'waterGoal' ? (import.meta.env.VITE_WATER_GOAL_LITRES || 2) : null

            return (
              <div key={item.key} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">{item.label}</h2>
                    {waterGoal !== null ? <span className="text-sm font-medium text-gray-500">({waterGoal}L)</span> : null}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${current > 0 ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                  {current > 0 ? `${current} day${current === 1 ? '' : 's'}` : 'Idle'}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-gray-500">Current</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{current}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <p className="text-gray-500">Longest</p>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{longest}</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500">Last updated: {formatDate(lastUpdated)}</p>
            </div>
            )
          })}
      </div>
    </div>
  )
}
