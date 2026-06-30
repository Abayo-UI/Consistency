import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { dailyLogApi } from '../../api/services'
import { useFetch, useMutation } from '../../hooks/useApi'
import { todayISO } from '../../utils/helpers'
import { LoadingPage, ErrorBanner, PageHeader, HabitCheck, NumberField, SectionTitle, Spinner } from '../../components/ui'

const DEFAULT_HABITS = {
  exercise: false,
  bathed: false,
  abstained: false,
  wokeBefore7: false,
  addedMoreKnowledge: false,
  prayed: false,
  trabajo: false,
  noDoomScrolling: false,
  sugarFree: false,
  candyCrush: false,
  upskilling: false,
}

const DEFAULT_HEALTH = {
  sleepHours: '',
  steps: '',
  heartPoints: '',
  waterLitres: '',
}

const HABIT_META = [
  { key: 'exercise',        label: 'Exercised',               icon: '💪' },
  { key: 'bathed',          label: 'Bathed',                  icon: '🚿' },
  { key: 'abstained',       label: 'Abstained',               icon: '🧠' },
  { key: 'wokeBefore7',     label: 'Woke up before 7 AM',     icon: '⏰' },
  { key: 'addedMoreKnowledge', label: 'Added more knowledge',  icon: '📖' },
  { key: 'prayed',          label: 'Prayed',                  icon: '🙏' },
  { key: 'trabajo',         label: 'Trabajo',                 icon: '🛠️' },
  { key: 'upskilling',      label: 'Upskilling',              icon: '📚' },
  { key: 'sugarFree',         label: 'Avoided Sweetened Tea',   icon: '🍵' },
  { key: 'noDoomScrolling', label: 'No Doom Scrolling',       icon: '🚫' },
  { key: 'candyCrush',      label: 'Played Candy Crush',      icon: '🍬' },
]

export default function DailyLogPage({ mode = 'morning' }) {
  const today = todayISO()
  const [date, setDate] = useState(today)
  const [habits, setHabits] = useState(DEFAULT_HABITS)
  const [health, setHealth] = useState(DEFAULT_HEALTH)
  // exercises checklist moved to Exercises page
  const [isEdit, setIsEdit] = useState(false)

  const isPast = date < today

  // Load existing log
  const { data: existingLog, loading, error, refetch } = useFetch(
    () => dailyLogApi.getByDate(date), [date]
  )

  // Populate form from existing log
  useEffect(() => {
    const log = existingLog?.log ?? existingLog
    if (log) {
      setIsEdit(true)
      // populate habits from both legacy `habits` and normalized `growth`/`entertainment` fields
      const fromHabits = { ...DEFAULT_HABITS, ...(log.habits ?? {}) }
      const normalized = {
        addedMoreKnowledge: !!(log.growth?.knowledge || log.growth?.learn || log.learning || log.learn),
        upskilling: !!(log.growth?.upskilling || log.growth?.skill || log.growth?.upskill),
        noDoomScrolling: !!(log.entertainment?.avoidDoomScrolling || log.habits?.noDoomScrolling),
        candyCrush: !!(log.entertainment?.candyCrushPlayed || log.habits?.candyCrush),
      }
      setHabits({ ...fromHabits, ...normalized })
      setHealth({
        sleepHours: log.health?.sleepHours ?? '',
        steps: log.health?.steps ?? '',
        heartPoints: log.health?.heartPoints ?? '',
        waterLitres: log.health?.waterLitres ?? '',
      })
      // no exercises UI in daily checks; exercises are managed on Exercises page
      // notes and growth fields intentionally omitted from daily check-ins now
    } else {
      setIsEdit(false)
      setHabits(DEFAULT_HABITS)
      setHealth(DEFAULT_HEALTH)
      // reset omitted fields
    }
  }, [existingLog])

  const { mutate: save, loading: saving } = useMutation(
    (payload) => isEdit ? dailyLogApi.update(date, payload) : dailyLogApi.create(payload),
    {
      onSuccess: () => {
        toast.success(isEdit ? 'Log updated!' : 'Log saved!')
        refetch()
      },
      onError: (msg) => toast.error(msg),
    }
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      date,
      habits,
      health: {
        sleepHours: health.sleepHours !== '' ? Number(health.sleepHours) : undefined,
        steps: health.steps !== '' ? Number(health.steps) : undefined,
        heartPoints: health.heartPoints !== '' ? Number(health.heartPoints) : undefined,
        waterLitres: health.waterLitres !== '' ? Number(health.waterLitres) : undefined,
      },
      // exercises intentionally omitted; use Exercises page to add attendance to today's log
    }
    await save(payload)
  }

  const setHabit = (key, val) => setHabits(h => ({ ...h, [key]: val }))
  const setHealthField = (e) => setHealth(h => ({ ...h, [e.target.name]: e.target.value }))

  if (loading) return <LoadingPage />

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <PageHeader
        title={mode === 'morning' ? '🌅 Morning Check-in' : '🌙 Evening Check-in'}
        subtitle={isEdit ? 'Updating existing log' : 'Log your day'}
        action={
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => setDate(e.target.value)}
            className="input w-auto text-sm"
          />
        }
      />

      {error && <ErrorBanner message="Couldn't load existing log." onRetry={refetch} />}

      {/* Health metrics */}
      <div className="card p-5 space-y-4">
        <SectionTitle>Health Metrics</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Sleep" name="sleepHours" value={health.sleepHours} onChange={setHealthField} min={0} max={24} step={0.5} unit="hours" placeholder="7.5" disabled={isEdit && isPast} />
          <NumberField label="Steps" name="steps" value={health.steps} onChange={setHealthField} min={0} placeholder="10000" disabled={isEdit && isPast} />
          <NumberField label="Heart Points" name="heartPoints" value={health.heartPoints} onChange={setHealthField} min={0} placeholder="45" disabled={isEdit && isPast} />
          <NumberField label="Water" name="waterLitres" value={health.waterLitres} onChange={setHealthField} min={0} max={10} step={0.01} unit="litres" placeholder="2.5" disabled={isEdit && isPast} />
          {/* Weight removed from daily check-ins — use Goals / Weight History for monthly entries */}
        </div>
      </div>

      {/* Habits */}
      <div className="card p-5">
        <SectionTitle>Today's Habits</SectionTitle>
        {HABIT_META.map(({ key, label, icon }) => (
          <HabitCheck key={key} label={label} icon={icon} checked={!!habits[key]} onChange={v => setHabit(key, v)} disabled={isEdit && isPast} />
        ))}
      </div>

      

      {/* Growth / Learning and Reflection removed — not used in DB */}

      <button type="submit" disabled={saving || (isEdit && isPast)} className="btn-primary flex items-center gap-2 px-6 py-3">
        {saving && <Spinner size="sm" />}
        {isEdit ? 'Update Log' : 'Save Log'}
      </button>
    </form>
  )
}
