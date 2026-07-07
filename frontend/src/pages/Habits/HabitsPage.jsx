import { useState } from 'react'
import { endOfMonth, endOfYear, format, isSameMonth, isSameYear, startOfMonth, startOfYear } from 'date-fns'
import toast from 'react-hot-toast'
import { dailyLogApi, streakApi, learningApi } from '../../api/services'
import { useFetch, useMutation } from '../../hooks/useApi'
import { todayISO } from '../../utils/helpers'
import { LoadingPage, ErrorBanner, PageHeader, SectionTitle, Spinner } from '../../components/ui'
import BrainProgress from '../../components/BrainProgress'

export default function HabitsPage() {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth))

  const yearOptions = Array.from({ length: 2030 - 2025 + 1 }, (_, i) => String(2025 + i))

  const selectedDate = new Date(Number(selectedYear), selectedMonth === 'whole-year' ? 0 : Number(selectedMonth) - 1, 1)
  const from = selectedMonth === 'whole-year'
    ? format(startOfYear(selectedDate), 'yyyy-MM-dd')
    : format(startOfMonth(selectedDate), 'yyyy-MM-dd')
  const toDate = selectedMonth === 'whole-year'
    ? (isSameYear(selectedDate, today) ? today : endOfYear(selectedDate))
    : (isSameMonth(selectedDate, today) ? today : endOfMonth(selectedDate))
  const to = format(toDate, 'yyyy-MM-dd')
  const selectedLabel = selectedMonth === 'whole-year'
    ? `${selectedYear}`
    : format(selectedDate, 'MMMM yyyy')

  const { data: streakData, loading: streakLoading } = useFetch(() => streakApi.get(), [])
  const { data: logsData, loading: logsLoading } = useFetch(
    () => dailyLogApi.getRecent({ from, to, limit: 400 }), [from, to]
  )
  const { data: learnings, loading: learnLoading, refetch: refetchLearnings } = useFetch(
    () => learningApi.getAll({ limit: 10 }), []
  )

  const [newLearning, setNewLearning] = useState({ title: '', note: '', type: 'knowledge' })
  const [showLearnForm, setShowLearnForm] = useState(false)

  const { mutate: addLearning, loading: addingLearning } = useMutation(
    (d) => learningApi.create({
      type: d.type,
      title: d.title,
      notes: d.note,
      description: d.note,
      date: new Date().toISOString(),
    }),
    {
      onSuccess: () => { toast.success('Learning saved!'); setShowLearnForm(false); setNewLearning({ title: '', note: '', type: 'knowledge' }); refetchLearnings() },
      onError: (m) => toast.error(m),
    }
  )

  // `streakData` may be either the Streak document or { streak: Streak }
  const streakObj = streakData?.streak ?? streakData ?? {};
  // read abstinence streak from DB (normalized path)
  const abstainDays = Number(streakObj?.abstinence?.current ?? 0)

  const logs = logsData?.logs ?? logsData ?? []

  // Compute habit frequency for the last 30 days
  const HABIT_META = [
    { key: 'exercise', label: 'Exercise', icon: '💪', color: '#22c55e' },
    { key: 'bathed', label: 'Bathed', icon: '🚿', color: '#3b82f6' },
    { key: 'abstained', label: 'Abstained', icon: '🧠', color: '#8b5cf6' },
    { key: 'wokeBefore7', label: 'Early Rise', icon: '⏰', color: '#f59e0b' },
    { key: 'addedMoreKnowledge', label: 'Added more knowledge', icon: '📖', color: '#06b6d4' },
    { key: 'prayed', label: 'Prayed', icon: '🙏', color: '#ec4899' },
    { key: 'trabajo', label: 'Trabajo', icon: '🛠️', color: '#10b981' },
    { key: 'sugarFree', label: 'Avoided Sweetened Tea', icon: '🍵', color: '#f97316' },
    { key: 'upskilling', label: 'Upskilling', icon: '📚', color: '#06b6d4' },
    { key: 'noDoomScrolling', label: 'No Doom Scrolling', icon: '🚫', color: '#ef4444' },
  ]

  // Helper: read a logical habit value from a log, supporting legacy locations and normalized fields
  const getHabitValue = (log, key) => {
    if (!log) return undefined;
    // direct habit field
    if (log.habits && Object.prototype.hasOwnProperty.call(log.habits, key)) return log.habits[key];

    // special mappings for normalized fields
    switch (key) {
      case 'addedMoreKnowledge':
        return !!(log.growth?.knowledge || log.growth?.learn || log.learning || log.learn);
      case 'upskilling':
        return !!(log.growth?.upskilling || log.growth?.skill || log.growth?.upskill);
      case 'noDoomScrolling':
        return !!(log.entertainment?.avoidDoomScrolling || log.habits?.noDoomScrolling);
      case 'candyCrush':
        return !!(log.entertainment?.candyCrushPlayed || log.habits?.candyCrush);
      default:
        return log.habits ? log.habits[key] : undefined;
    }
  };

  const habitStats = HABIT_META.map(h => {
    const tracked = logs.filter(l => getHabitValue(l, h.key) !== undefined)
    const done = tracked.filter(l => getHabitValue(l, h.key) === true)
    return { ...h, rate: tracked.length ? Math.round((done.length / tracked.length) * 100) : 0, done: done.length, total: tracked.length }
  })

  // sort by highest percentage (then by number done) so UI updates dynamically
  const habitStatsSorted = [...habitStats].sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate
    return (b.done || 0) - (a.done || 0)
  })

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Habits" subtitle="Track your daily discipline" />

      {/* Abstinence brain */}
      <div className="card p-6 flex flex-col md:flex-row gap-6 md:gap-8 items-center">
        <div className="flex flex-col items-center gap-3">
          <BrainProgress days={abstainDays} />
          <div className="text-center">
            <p className="text-sm text-gray-500 mt-1">{Math.round((Math.min(abstainDays,365) / 365) * 100)}% of the journey complete</p>
            <p className="text-xs text-gray-400 mt-1">This is how your brain looks like currently</p>
            {abstainDays === 0 && <p className="text-xs text-gray-400 mt-1">Your brain rebuilds as you stay consistent.</p>}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Abstinence Journey</h2>
          <p className="text-gray-500 text-sm">Your brain is healing and rewiring. Every day of abstinence is visible progress. The black brain fills with color as you stay consistent.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Current streak</p>
              <p className="text-2xl font-bold text-purple-700">{abstainDays} days</p>
            </div>
            <div className="bg-brand-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-brand-700">{Math.max(0, 365 - abstainDays)} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habit completion grid */}
      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <SectionTitle>{selectedLabel} Habit Summary</SectionTitle>
            <p className="text-sm text-gray-500">Showing data through {format(toDate, 'MMM d, yyyy')}</p>
          </div>
          <div className="flex flex-row flex-wrap items-center gap-2">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="input w-28 min-w-[7rem]">
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="input w-36 min-w-[9rem]">
              <option value="whole-year">Whole year</option>
              {Array.from({ length: 12 }, (_, i) => {
                const monthDate = new Date(Number(selectedYear), i, 1)
                return <option key={i + 1} value={String(i + 1)}>{format(monthDate, 'MMMM')}</option>
              })}
            </select>
          </div>
        </div>
        {logsLoading ? <div className="h-20 flex items-center justify-center text-gray-400 text-sm">Loading…</div> : (
          <div className="space-y-2">
            {habitStatsSorted.map(h => (
              <div key={h.key} className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50/60 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-0 sm:border-0 sm:bg-transparent">
                <div className="flex items-center gap-2 sm:w-36">
                  <span className="text-lg w-6 shrink-0">{h.icon}</span>
                  <span className="text-sm font-medium text-gray-700 leading-tight break-words">{h.label}</span>
                </div>
                <div className="flex items-center gap-2 sm:flex-1">
                  <div className="h-2 flex-1 bg-gray-100 rounded-full min-w-0">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${h.rate}%`, backgroundColor: h.color }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-10 text-right shrink-0">{h.rate}%</span>
                  <span className="text-xs text-gray-400 shrink-0">{h.done}/{h.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learnings */}
      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <SectionTitle>Learnings & Knowledge</SectionTitle>
          <button onClick={() => setShowLearnForm(s => !s)} className="btn-secondary text-sm self-start sm:self-auto">
            {showLearnForm ? 'Cancel' : '+ Add Learning'}
          </button>
        </div>

        {showLearnForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input" value={newLearning.title} onChange={e => setNewLearning(l => ({ ...l, title: e.target.value }))} placeholder="What did you learn?" />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={newLearning.type} onChange={e => setNewLearning(l => ({ ...l, type: e.target.value }))}>
                <option value="knowledge">Knowledge</option>
                <option value="upskilling">Upskilling</option>
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={2} value={newLearning.note} onChange={e => setNewLearning(l => ({ ...l, note: e.target.value }))} placeholder="Details…" />
            </div>
            <button onClick={() => addLearning(newLearning)} disabled={!newLearning.title || addingLearning} className="btn-primary flex items-center gap-2">
              {addingLearning && <Spinner size="sm" />}
              Save Learning
            </button>
          </div>
        )}

        {learnLoading ? <div className="text-sm text-gray-400 py-4 text-center">Loading…</div> : (
          <div className="space-y-2">
            {(learnings?.learnings ?? learnings ?? []).map(l => (
              <div key={l._id} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-lg">📚</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{l.title}</p>
                  {l.note && <p className="text-xs text-gray-500 mt-0.5">{l.note}</p>}
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full mt-1 inline-block">{l.type ?? 'general'}</span>
                </div>
                <span className="ml-auto text-xs text-gray-400 shrink-0">{l.date?.slice(0,10)}</span>
              </div>
            ))}
            {!(learnings?.learnings ?? learnings)?.length && (
              <p className="text-sm text-gray-400 py-4 text-center">No learnings recorded yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
