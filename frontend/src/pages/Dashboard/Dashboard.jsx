import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { useFetch } from '../../hooks/useApi'
import { dailyLogApi, streakApi } from '../../api/services'
import { todayISO, scoreLabel, fmtDateShort } from '../../utils/helpers'
import { ScoreRing, StatCard, LoadingPage, ErrorBanner } from '../../components/ui'

const SCORE_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444', gray: '#d1d5db' }
function barColor(score) {
  if (!score && score !== 0) return SCORE_COLORS.gray
  if (score >= 80) return SCORE_COLORS.green
  if (score >= 60) return SCORE_COLORS.yellow
  return SCORE_COLORS.red
}

export default function Dashboard() {
  const { user } = useAuth()
  const today = todayISO()

  const { data: todayLog, loading: logLoading, error: logError } = useFetch(
    () => dailyLogApi.getByDate(today), [today]
  )
  const { data: streakData, loading: streakLoading } = useFetch(
    () => streakApi.get(), []
  )
  const { data: recentLogs, loading: recentLoading } = useFetch(
    () => dailyLogApi.getRecent({ limit: 7 }), []
  )

  const loading = logLoading || streakLoading

  // Build 7-day chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    const iso = format(d, 'yyyy-MM-dd')
    const log = recentLogs?.logs?.find(l => l.date?.slice(0,10) === iso)
      ?? recentLogs?.find?.(l => l.date?.slice(0,10) === iso)
    return {
      day: format(d, 'EEE'),
      date: iso,
      score: log?.score ?? log?.consistencyScore ?? null,
    }
  })

  const weekScores = last7.filter(d => d.score != null)
  const avgScore = weekScores.length
    ? Math.round(weekScores.reduce((s, d) => s + d.score, 0) / weekScores.length)
    : null
  const bestDay = weekScores.length
    ? weekScores.reduce((a, b) => b.score > a.score ? b : a)
    : null

  const log = todayLog?.log ?? todayLog
  const score = log?.score ?? log?.consistencyScore ?? 0
  const streak = streakData?.streak ?? streakData?.currentStreak ?? streakData?.days ?? 0


  if (loading) return <LoadingPage />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeOfDay()}, {user?.name?.split(' ')[0] ?? 'there'}! 👋
          </h1>
          <p className="text-sm text-green-600">What you are not changing, you are choosing!</p>
        </div>
        <span className="text-sm text-gray-400 font-medium">{format(new Date(), 'MMMM d, yyyy')}</span>
      </div>

      {logError && <ErrorBanner message="Couldn't load today's log." />}

      {/* Top row: Score + Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Score */}
        <div className="card p-5 flex flex-col items-center justify-center">
          <p className="text-sm font-semibold text-gray-500 mb-2">Today's Score</p>
          <ScoreRing score={score} size={120} />
        </div>

        {/* Sleep */}
        {(() => {
          const raw = log?.health?.sleepHours ? Math.round((log.health.sleepHours / 9) * 100) : 0
          const pct = Math.min(raw, 100)
          const color = raw <= 20 ? SCORE_COLORS.red : (raw <= 60 ? SCORE_COLORS.yellow : SCORE_COLORS.green)
          const sub = log?.health?.sleepHours
            ? (raw >= 100 ? 'Goal achieved! 🎉' : (log.health.sleepHours >= 7 ? 'Good' : 'Needs improvement'))
            : 'Not logged'
          return (
            <StatCard
              icon="🌙"
              label="Sleep (last night)"
              value={log?.health?.sleepHours ? `${Math.floor(log.health.sleepHours)}h ${Math.round((log.health.sleepHours % 1) * 60)}m` : '—'}
              sub={sub}
              progress={pct}
              progressColor={color}
            />
          )
        })()}

        {/* Steps */}
        {(() => {
          const raw = log?.health?.steps ? Math.round((log.health.steps / 10000) * 100) : 0
          const pct = Math.min(raw, 100)
          const color = raw <= 20 ? SCORE_COLORS.red : (raw <= 60 ? SCORE_COLORS.yellow : SCORE_COLORS.green)
          const sub = log?.health?.steps ? (raw >= 100 ? 'Goal achieved! 🎉' : `${raw}% of goal`) : 'Not logged'
          return (
            <StatCard
              icon="👟"
              label="Steps"
              value={log?.health?.steps?.toLocaleString() ?? '—'}
              sub={sub}
              progress={pct}
              progressColor={color}
            />
          )
        })()}

        {/* Heart Points */}
        {(() => {
          const raw = log?.health?.heartPoints ? Math.round((log.health.heartPoints / 60) * 100) : 0
          const pct = Math.min(raw, 100)
          const color = raw <= 20 ? SCORE_COLORS.red : (raw <= 60 ? SCORE_COLORS.yellow : SCORE_COLORS.green)
          const sub = log?.health?.heartPoints ? (raw >= 100 ? 'Goal achieved! 🎉' : `${raw}% of goal`) : 'Not logged'
          return (
            <StatCard
              icon="❤️"
              label="Heart Points"
              value={log?.health?.heartPoints ?? '—'}
              sub={sub}
              progress={pct}
              progressColor={color}
            />
          )
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Habits */}
        <div className="card p-5 col-span-1">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Today's Habits</h2>
            <Link to="/habits" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
          {log ? (
            <HabitList log={log} />
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">No log for today yet.</p>
          )}

          
        </div>

        {/* Week Overview */}
        <div className="card p-5 col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Week Overview</h2>

          {/* Day dots */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {last7.map((d) => (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400">{d.day}</span>
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: barColor(d.score) }}
                />
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-400">Best Day</p>
              <p className="text-xl font-bold text-gray-800">{bestDay ? `${bestDay.score}%` : '—'}</p>
              {bestDay && <p className="text-xs text-gray-500">{bestDay.day}</p>}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Average Score</p>
              <p className="text-xl font-bold text-gray-800">{avgScore != null ? `${avgScore}%` : '—'}</p>
            </div>
          </div>

          {/* Bar chart */}
          {!recentLoading && (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={last7} barSize={28}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip
                  formatter={(v) => v != null ? [`${v}%`, 'Score'] : ['No data', 'Score']}
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {last7.map((d) => <Cell key={d.date} fill={barColor(d.score)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Entries + Quick Check-in */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent entries */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Recent Entries</h2>
            <Link to="/calendar" className="text-xs text-brand-600 hover:underline font-medium">View all</Link>
          </div>
          <div className="space-y-2">
            {(recentLogs?.logs ?? recentLogs ?? []).slice(0, 5).map((l) => {
              const s = l.score ?? l.consistencyScore ?? 0
              return (
                <div key={l._id ?? l.date} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: barColor(s) }} />
                    <span className="text-sm text-gray-700">{fmtDateShort(l.date)}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: barColor(s) }}>
                    Score: {s}%
                  </span>
                </div>
              )
            })}
            {!recentLoading && !(recentLogs?.logs ?? recentLogs)?.length && (
              <p className="text-sm text-gray-400 py-2 text-center">No entries yet.</p>
            )}
          </div>
        </div>

        {/* Quick Check-in */}
        <div className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800">Quick Check-in</h2>
          <Link to="/log" className="flex items-start gap-3 p-4 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors">
            <span className="text-2xl">🌅</span>
            <div>
              <p className="font-semibold text-gray-800">Morning Check-in</p>
              <p className="text-sm text-gray-500">Start your day right. Log your morning stats and set intentions.</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
                Start Morning Check-in →
              </span>
            </div>
          </Link>
          <Link to="/log/evening" className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="font-semibold text-gray-800">Evening Check-in</p>
              <p className="text-sm text-gray-500">Finish strong. Log your habits and reflect on your day.</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                Start Evening Check-in →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function HabitList({ log }) {
  const habits = log?.habits || {};
  const growth = log?.growth || {};

  const items = [
    { key: 'exercise',         label: 'Exercised',               icon: '💪' },
    { key: 'bathed',           label: 'Bathed',                  icon: '🚿' },
    { key: 'abstained',        label: 'Abstained',               icon: '🧠' },
    { key: 'wokeBefore7',      label: 'Woke up before 7AM',     icon: '⏰' },
    { key: 'addedMoreKnowledge', label: 'Added more knowledge',  icon: '📖' },
    { key: 'prayed',          label: 'Prayed',                  icon: '🙏' },
    { key: 'trabajo',         label: 'Trabajo',                 icon: '🛠️' },
    { key: 'sugarFree',       label: 'Avoided Sweetened Tea',   icon: '🍵' },
  ]

  function habitValue(key) {
    if (key === 'addedMoreKnowledge') {
      // normalized field lives on growth.knowledge; include legacy fallbacks
      return !!(growth.knowledge || growth.learn || log?.learning || log?.learn || habits.addedMoreKnowledge);
    }
    return habits[key];
  }

  return (
    <div>
      {items.map(({ key, label, icon }) => (
        <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="text-sm text-gray-700">{label}</span>
          </div>
          {habitValue(key) === true
            ? <span className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
            : habitValue(key) === false
            ? <span className="w-6 h-6 border-2 border-red-400 rounded-full flex items-center justify-center text-red-400 text-xs">✕</span>
            : <span className="w-6 h-6 border-2 border-gray-200 rounded-full" />
          }
        </div>
      ))}
    </div>
  )
}
