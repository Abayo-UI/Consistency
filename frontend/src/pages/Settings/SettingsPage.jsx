import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authApi, exerciseTemplateApi, auditLogApi, googleFitApi } from '../../api/services'
import { useFetch, useMutation } from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { LoadingPage, PageHeader, SectionTitle, Spinner, ErrorBanner } from '../../components/ui'
import { fmtDate } from '../../utils/helpers'

const DEFAULT_EXERCISES = [
  { name: 'Push-ups', sets: 3, reps: 20 },
  { name: 'Squats', sets: 3, reps: 20 },
  { name: 'Pull-ups', sets: 3, reps: 10 },
  { name: 'Plank', sets: 3, reps: 60 },
  { name: 'Sit-ups', sets: 3, reps: 20 },
  { name: 'Lunges', sets: 3, reps: 16 },
  { name: 'Burpees', sets: 3, reps: 10 },
  { name: 'Mountain Climbers', sets: 3, reps: 30 },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'exercises', label: 'Exercises' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'audit', label: 'Audit Log' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === t.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab user={user} />}
      {tab === 'exercises' && <ExercisesTab />}
      {tab === 'integrations' && <IntegrationsTab />}
      {tab === 'audit' && <AuditTab />}
    </div>
  )
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ user }) {
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwError, setPwError] = useState('')

  const { mutate: updateProfile, loading } = useMutation(
    (d) => authApi.update(d),
    {
      onSuccess: (res) => {
        toast.success('Profile updated!')
      },
      onError: (err) => {
        const remote = err?.response?.data
        const msg = remote?.error ?? remote?.message ?? err?.message ?? 'Failed to update profile.'
        toast.error(msg)
      }
    }
  )

  const handlePwSubmit = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    if (pwForm.newPassword.length < 6) { setPwError('At least 6 characters required.'); return }
    setPwError('')
    try {
      await authApi.update({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setPwError(err?.response?.data?.message ?? 'Failed to change password.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-4">
        <SectionTitle>Personal Info</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
        <button onClick={() => updateProfile({ name: form.name, email: form.email })} disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <Spinner size="sm" />}
          Save Changes
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <SectionTitle>Change Password</SectionTitle>
        {pwError && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{pwError}</div>}
        <div className="space-y-3">
          <div>
            <label className="label">Current Password</label>
            <input className="input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input className="input" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input className="input" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          <button onClick={handlePwSubmit} className="btn-secondary">Update Password</button>
        </div>
      </div>
    </div>
  )
}

// ── Exercises Tab ─────────────────────────────────────────────────────────────
function ExercisesTab() {
  const { data, loading, refetch } = useFetch(() => exerciseTemplateApi.get(), [])
  const template = data?.template ?? data
  const [exercises, setExercises] = useState([])
  const [newEx, setNewEx] = useState({ name: '', sets: 3, reps: 10 })

  useEffect(() => {
    if (Array.isArray(template?.items)) {
      setExercises(template.items.map((item, idx) => ({
        ...item,
        name: String(item.name || '').trim(),
        sets: Number(item.sets) || 3,
        reps: Number(item.reps) || 10,
        defaultChecked: !!item.defaultChecked,
        order: item.order ?? idx,
      })))
    }
  }, [template])

  const { mutate: loadDefaults, loading: loadingDefaults } = useMutation(
    () => exerciseTemplateApi.createDefaults(),
    { onSuccess: () => { toast.success('Default exercises loaded!'); refetch() }, onError: m => toast.error(m) }
  )

  const { mutate: saveTemplate, loading: saving } = useMutation(
    (d) => template ? exerciseTemplateApi.update(d) : exerciseTemplateApi.create(d),
    { onSuccess: () => { toast.success('Template saved!'); refetch() }, onError: m => toast.error(m) }
  )

  const normalizeExercises = (items) => items.map((item, idx) => ({
    name: String(item.name || '').trim(),
    sets: item.sets !== undefined && item.sets !== null ? Number(item.sets) : 3,
    reps: item.reps !== undefined && item.reps !== null ? Number(item.reps) : 10,
    defaultChecked: !!item.defaultChecked,
    order: item.order ?? idx,
  }))

  const persistExercises = (nextExercises) => {
    const normalized = normalizeExercises(nextExercises)
    setExercises(normalized)
    saveTemplate({ items: normalized })
    return normalized
  }

  const addExercise = () => {
    const trimmedName = newEx.name.trim()
    if (!trimmedName) return
    const next = [...exercises, { name: trimmedName, sets: Number(newEx.sets) || 3, reps: Number(newEx.reps) || 10, defaultChecked: false, order: exercises.length }]
    setNewEx({ name: '', sets: 3, reps: 10 })
    persistExercises(next)
  }

  const removeExercise = (i) => {
    const next = exercises.filter((_, idx) => idx !== i)
    persistExercises(next)
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <SectionTitle>Exercise Template</SectionTitle>
      </div>

      {loading ? <div className="text-sm text-gray-400">Loading…</div> : (
        <div className="space-y-2">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
              <span className="text-sm font-medium text-gray-800 flex-1">💪 {ex.name}</span>
              <span className="text-xs text-gray-500">{ex.sets}×{ex.reps}</span>
              <button onClick={() => removeExercise(i)} className="text-xs text-red-400 hover:text-red-600 ml-2">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="Exercise name" value={newEx.name} onChange={e => setNewEx(x => ({ ...x, name: e.target.value }))} />
        <input className="input w-16" type="number" min={1} placeholder="Sets" value={newEx.sets} onChange={e => setNewEx(x => ({ ...x, sets: e.target.value }))} />
        <input className="input w-16" type="number" min={1} placeholder="Reps" value={newEx.reps} onChange={e => setNewEx(x => ({ ...x, reps: e.target.value }))} />
        <button onClick={addExercise} className="btn-secondary shrink-0">Add</button>
      </div>

      <button onClick={() => persistExercises(exercises)} disabled={saving || !exercises.length} className="btn-primary flex items-center gap-2">
        {saving && <Spinner size="sm" />}
        Save Template
      </button>
    </div>
  )
}

// ── Integrations Tab ──────────────────────────────────────────────────────────
function IntegrationsTab() {
  const { data: fitStatus, loading, refetch } = useFetch(() => googleFitApi.status(), [])
  const { mutate: syncFit, loading: syncing } = useMutation(
    () => googleFitApi.sync({}),
    { onSuccess: () => { toast.success('Google Fit synced!'); refetch() }, onError: m => toast.error(m) }
  )

  return (
    <div className="card p-5 space-y-4">
      <SectionTitle>Google Fit</SectionTitle>
      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏃</span>
          <div>
            <p className="font-medium text-gray-800">Google Fit</p>
            <p className="text-xs text-gray-500">Sync steps and heart points automatically</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${fitStatus?.connected ? 'bg-brand-100 text-brand-700' : 'bg-gray-200 text-gray-500'}`}>
            {loading ? '…' : fitStatus?.connected ? 'Connected' : 'Not connected'}
          </span>
          {fitStatus?.connected && (
            <button onClick={() => syncFit()} disabled={syncing} className="btn-primary text-sm flex items-center gap-1">
              {syncing && <Spinner size="sm" />}
              Sync now
            </button>
          )}
        </div>
      </div>
      {fitStatus?.lastSync && (
        <p className="text-xs text-gray-400">Last synced: {fmtDate(fitStatus.lastSync)}</p>
      )}
    </div>
  )
}

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
function AuditTab() {
  const { data, loading, error } = useFetch(() => auditLogApi.getAll({ limit: 20 }), [])
  const logs = data?.logs ?? data ?? []

  return (
    <div className="card p-5">
      <SectionTitle>Recent Activity</SectionTitle>
      {loading ? <div className="text-sm text-gray-400 py-4">Loading…</div> :
        error ? <ErrorBanner message="Couldn't load audit logs." /> : (
          <div className="space-y-1">
            {logs.map((l, i) => (
              <div key={l._id ?? i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 shrink-0 w-32">{l.createdAt?.slice(0,16).replace('T', ' ')}</span>
                <span className="text-sm text-gray-700">{l.action ?? l.description}</span>
                {l.resource && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto shrink-0">{l.resource}</span>}
              </div>
            ))}
            {!logs.length && <p className="text-sm text-gray-400 py-4 text-center">No activity recorded yet.</p>}
          </div>
        )
      }
    </div>
  )
}
