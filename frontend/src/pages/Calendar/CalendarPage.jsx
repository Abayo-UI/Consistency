import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, startOfYear, endOfYear } from 'date-fns'
import { Link } from 'react-router-dom'
import { dailyLogApi } from '../../api/services'
import { useFetch } from '../../hooks/useApi'
import { LoadingPage, ErrorBanner, StatCard, PageHeader } from '../../components/ui'

function scoreColor(score) {
  if (!score && score !== 0) return null
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date())
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 2030 - 2025 + 1 }, (_, i) => String(2025 + i))
  const [selectedYear, setSelectedYear] = useState(
    String(currentYear >= 2025 && currentYear <= 2030 ? currentYear : 2025)
  )
  const [selectedMonth, setSelectedMonth] = useState('whole-year')
  const start = startOfMonth(current)
  const end = endOfMonth(current)

  // compute from/to for stats fetch based on selectedYear + selectedMonth
  let statsFrom = format(startOfYear(new Date(Number(selectedYear), 0, 1)), 'yyyy-MM-dd')
  let statsTo = format(endOfYear(new Date(Number(selectedYear), 0, 1)), 'yyyy-MM-dd')
  if (selectedMonth && selectedMonth !== 'whole-year') {
    const monthIndex = Number(selectedMonth)
    const s = startOfMonth(new Date(Number(selectedYear), monthIndex - 1, 1))
    const e = endOfMonth(s)
    statsFrom = format(s, 'yyyy-MM-dd')
    statsTo = format(e, 'yyyy-MM-dd')
  }

  // calendar fetch range (based on currently visible month)
  const calendarFrom = format(start, 'yyyy-MM-dd')
  const calendarTo = format(end, 'yyyy-MM-dd')

  // Fetch stats (controlled by the dropdown)
  const { data: statsData, loading: statsLoading, error: statsError, refetch: statsRefetch } = useFetch(
    () => dailyLogApi.getRecent({ from: statsFrom, to: statsTo, limit: 400 }),
    [statsFrom, statsTo]
  )

  // Fetch calendar data (always based on the visible month)
  const { data: calData, loading: calLoading, error: calError, refetch: calRefetch } = useFetch(
    () => dailyLogApi.getRecent({ from: calendarFrom, to: calendarTo, limit: 400 }),
    [calendarFrom, calendarTo]
  )

  const statsLogs = statsData?.logs ?? statsData ?? []

  const logs = calData?.logs ?? calData ?? []
  const logsByDate = {}
  logs.forEach(l => { logsByDate[l.date?.slice(0, 10)] = l })

  const days = eachDayOfInterval({ start, end })

  // Pad start
  const startDow = start.getDay() // 0=Sun
  const padStart = Array(startDow).fill(null)

  const prev = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const next = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  // compute stats from fetched logs
  const stats = useMemo(() => {
    const s = { sleep: 0, steps: 0, heart: 0, water: 0, bathed: 0 }
    statsLogs.forEach(l => {
      s.sleep += Number(l.health?.sleepHours || 0)
      s.steps += Number(l.health?.steps || 0)
      s.heart += Number(l.health?.heartPoints || 0)
      s.water += Number(l.health?.waterLitres || 0)
      if (l.habits?.bathed) s.bathed += 1
    })
    return s
  }, [statsLogs])

  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" />

      <div className="text-sm text-gray-600">
        <p className="mt-1">Quick view of your activity — click any day to open its log.</p>
      </div>

      {statsError && <ErrorBanner message="Couldn't load stats." onRetry={statsRefetch} />}

      {/* Range selector and stats */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="input w-32">
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="input w-44">
            <option value="whole-year">Whole year</option>
            {Array.from({ length: 12 }, (_, i) => {
              const monthLabel = format(new Date(2025, i, 1), 'MMMM')
              return <option key={i + 1} value={String(i + 1)}>{monthLabel}</option>
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="🌙" label="Total hours slept" value={`${stats.sleep.toFixed(1)}h`} />
          <StatCard icon="👟" label="Total steps" value={stats.steps.toLocaleString()} />
          <StatCard icon="❤️" label="Total heart points" value={stats.heart.toLocaleString()} />
          <StatCard icon="💧" label="Total litres drank" value={`${stats.water.toFixed(2)}L`} />
        </div>
      </div>

      {/* Calendar moved down */}
      <div className="mt-4 max-w-xl space-y-4">
        <div className="card p-3">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={prev} className="btn-ghost">‹</button>
            <h2 className="font-semibold text-gray-800">{format(current, 'MMMM yyyy')}</h2>
            <button onClick={next} className="btn-ghost">›</button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-0.5">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          {calLoading ? (
            <div className="h-48 flex items-center justify-center"><span className="text-gray-400">Loading…</span></div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {padStart.map((_, i) => <div key={`pad-${i}`} />)}
              {days.map(day => {
                const iso = format(day, 'yyyy-MM-dd')
                const log = logsByDate[iso]
                const score = log?.score ?? log?.consistencyScore
                const color = scoreColor(score)
                const today = isToday(day)

                return (
                  <Link
                    key={iso}
                    to={`/log?date=${iso}`}
                    className={`relative flex flex-col items-center justify-center w-10 h-10 rounded-md text-sm transition-colors hover:bg-gray-50
                      ${today ? 'ring-2 ring-brand-400 bg-brand-50' : ''}
                    `}
                  >
                    <span className={`font-medium ${today ? 'text-brand-700' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </span>
                    {color && (
                      <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: color }} />
                    )}
                    {score != null && (
                      <span className="text-[10px] font-semibold" style={{ color }}>{score}%</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-sm text-gray-500">
          {[['#22c55e', '≥80%'], ['#eab308', '60–79%'], ['#ef4444', '<60%']].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
