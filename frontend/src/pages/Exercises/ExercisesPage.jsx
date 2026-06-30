import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { exerciseTemplateApi, exerciseApi, dailyLogApi } from '../../api/services'
import { useFetch, useMutation } from '../../hooks/useApi'
import { todayISO } from '../../utils/helpers'
import { PageHeader, SectionTitle, Spinner } from '../../components/ui'

function getHistoryKey(name) {
  return String(name || '').trim().toLowerCase()
}

export default function ExercisesPage() {
  const { data, loading, refetch } = useFetch(() => exerciseTemplateApi.get(), [])
  const template = data?.template ?? data
  const [exercises, setExercises] = useState([])
  const today = todayISO()

  // fetch existing exercises for today and the daily log to support marking attendance and showing updated score
  const { data: todayExercisesData, loading: todayExercisesLoading, refetch: refetchTodayExercises } = useFetch(() => exerciseApi.getByDate(today), [today])
  const todayExercises = todayExercisesData?.log ?? todayExercisesData
  const { data: todayDailyLogData, loading: todayDailyLogLoading, refetch: refetchTodayDailyLog } = useFetch(() => dailyLogApi.getByDate(today), [today])
  const todayLog = todayDailyLogData?.log ?? todayDailyLogData
  const [attendance, setAttendance] = useState({})
  const [exerciseHistory, setExerciseHistory] = useState({})

  useEffect(() => {
    if (Array.isArray(template?.items)) {
      setExercises(template.items.map((item, idx) => ({
        ...item,
        name: String(item.name || '').trim(),
        sets: item.sets !== undefined && item.sets !== null ? Number(item.sets) : 3,
        reps: item.reps !== undefined && item.reps !== null ? Number(item.reps) : 10,
        defaultChecked: !!item.defaultChecked,
        order: item.order ?? idx,
      })))
    }
  }, [template])


  

  // initialize attendance state from today's log or template defaults
  useEffect(() => {
    const initial = {}
    const source = todayExercises && Array.isArray(todayExercises.items) && todayExercises.items.length ? todayExercises.items : (template?.items ?? exercises)
    if (source && Array.isArray(source) && source.length) {
      source.forEach(ex => {
        const id = ex.name ?? ex._id
        initial[id] = { checked: !!ex.checked || !!ex.defaultChecked, reps: ex.reps ?? 0 }
      })
    }
    setAttendance(initial)
  }, [todayExercises, template, exercises])

  useEffect(() => {
    if (!Array.isArray(exercises) || !exercises.length) {
      setExerciseHistory({})
      return
    }

    let active = true
    const dates = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(today)
      d.setDate(d.getDate() - index)
      return d.toISOString().slice(0, 10)
    })

    const loadHistory = async () => {
      const results = await Promise.all(
        dates.map(async (date) => {
          try {
            const response = await exerciseApi.getByDate(date)
            return response?.data ?? response
          } catch {
            return null
          }
        })
      )

      if (!active) return

      const nextHistory = {}
      exercises.forEach((exercise) => {
        const key = getHistoryKey(exercise.name)
        let checkedCount = 0
        let totalDays = 0

        results.forEach((entry) => {
          const items = Array.isArray(entry?.items) ? entry.items : []
          if (!items.length) return
          totalDays += 1
          const match = items.find((item) => getHistoryKey(item?.name) === key)
          if (match?.checked) checkedCount += 1
        })

        nextHistory[key] = { checkedCount, totalDays }
      })

      setExerciseHistory(nextHistory)
    }

    loadHistory()
    return () => { active = false }
  }, [exercises, today])

  const { mutate: saveExercises, loading: savingExercises } = useMutation(
    (payload) => todayExercises ? exerciseApi.upsert(today, { items: payload.items }) : exerciseApi.create(payload),
    { onSuccess: () => { toast.success('Exercises saved to today!'); refetchTodayExercises(); refetchTodayDailyLog(); }, onError: (e) => toast.error(e) }
  )

  const exerciseList = Array.isArray(exercises) && exercises.length ? exercises : (template?.items ?? [])

  return (
    <div className="space-y-6 w-full">
      <PageHeader title="Exercises" subtitle="Mark today's exercises" />

      <div className="card p-5 space-y-4">
        <div className="rounded-2xl border border-brand-100 bg-brand-50/70 p-3 text-sm text-brand-700">
          To add or remove exercises, head to the Settings page and open the Exercise tab.
        </div>

        {/* Today's attendance checklist */}
        <div className="mt-4">
          <SectionTitle className="!m-0">Mark Today</SectionTitle>
          <div className="space-y-2 mt-3">
            {exerciseList.map((ex) => {
              const id = ex.name ?? ex._id
              const st = attendance[id] || { checked: false, reps: 0 }
              const key = getHistoryKey(ex.name)
              const history = exerciseHistory[key] || { checkedCount: 0, totalDays: 0 }
              return (
                <div key={id} className="rounded-lg border bg-white px-3 py-3">
                  <div className="flex items-start gap-3 justify-between">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={!!st.checked} onChange={e => setAttendance(a => ({ ...a, [id]: { ...a[id], checked: e.target.checked } }))} />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{ex.name}</div>
                        <div className="mt-1 text-xs text-gray-500">{ex.sets ?? 3} × {ex.reps ?? 10}</div>
                        <div className="mt-2 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 inline-flex">
                          Recent: {history.checkedCount}/{history.totalDays || 7}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} className="input w-20" value={st.reps ?? ''} onChange={e => setAttendance(a => ({ ...a, [id]: { ...a[id], reps: e.target.value } }))} />
                    </div>
                  </div>

                </div>
              )
            })}

            <div className="flex justify-end mt-3">
              <button onClick={() => {
                const exercisesPayload = exerciseList.map(ex => {
                  const id = ex.name ?? ex._id
                  const s = attendance[id] || { checked: false, reps: 0 }
                  return { name: ex.name, checked: !!s.checked, reps: Number(s.reps) || 0, notes: '' }
                })
                const payload = { date: today, items: exercisesPayload }
                saveExercises(payload)
              }} disabled={savingExercises} className="btn-primary">
                {savingExercises ? <Spinner size="sm" /> : 'Save Today'}
              </button>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  )
}
