import { useState } from 'react'
import { format, subDays, subMonths } from 'date-fns'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { dailyLogApi, achievementApi } from '../../api/services'
import { useFetch } from '../../hooks/useApi'
import { todayISO, fmtDateShort } from '../../utils/helpers'
import { LoadingPage, ErrorBanner, PageHeader } from '../../components/ui'

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

export default function AnalyticsPage() {
  const [range, setRange] = useState(30)
  const today = todayISO()
  const from = format(subDays(new Date(), range - 1), 'yyyy-MM-dd')

  const { data: logsData, loading, error, refetch } = useFetch(
    () => dailyLogApi.getRecent({ from, to: today, limit: range }),
    [range]
  )
  const { data: achievements } = useFetch(() => achievementApi.getAll(), [])

  const logs = logsData?.logs ?? logsData ?? []

  // Score trend
  const trendData = logs.map(l => ({
    date: fmtDateShort(l.date),
    score: l.score ?? l.consistencyScore ?? 0,
  })).reverse()

  const avg = trendData.length
    ? Math.round(trendData.reduce((s, d) => s + d.score, 0) / trendData.length)
    : 0
  const best = trendData.length ? Math.max(...trendData.map(d => d.score)) : 0

  if (loading) return <LoadingPage />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Your consistency at a glance"
        action={
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {RANGES.map(r => (
              <button
                key={r.days}
                onClick={() => setRange(r.days)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${range === r.days ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error && <ErrorBanner message="Couldn't load analytics." onRetry={refetch} />}

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Average Score', value: `${avg}%`, color: avg >= 80 ? 'text-brand-500' : avg >= 60 ? 'text-yellow-500' : 'text-red-500' },
          { label: 'Best Score', value: `${best}%`, color: 'text-brand-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Score trend */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Score Trend</h2>
        {trendData.length ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v) => [`${v}%`, 'Score']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              />
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-8">No data for this period.</p>
        )}
      </div>

      {/* Achievements */}
      {achievements?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {achievements.map(a => (
              <div key={a._id} className="bg-brand-50 rounded-xl p-3 flex items-center gap-2">
                <span className="text-2xl">{a.icon ?? '🏆'}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
