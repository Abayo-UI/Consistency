import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import { healthProfileApi, weightHistoryApi } from '../../api/services'
import { useFetch, useMutation } from '../../hooks/useApi'
import { LoadingPage, ErrorBanner, PageHeader, NumberField, SectionTitle, Spinner } from '../../components/ui'

export default function GoalsPage() {
  const { data: profileData, loading: pLoading, refetch: refetchProfile } = useFetch(() => healthProfileApi.get(), [])
  const { data: weightData, loading: wLoading, refetch: refetchWeight } = useFetch(() => weightHistoryApi.getAll({ limit: 30 }), [])

  const profile = profileData?.profile ?? profileData
  const weights = weightData?.weights ?? weightData ?? []

  const [profileForm, setProfileForm] = useState({ height: '', targetWeight: '', bloodGroup: '', restingHeartRate: '', dateOfBirth: '', notes: '' })
  const [showNotesFull, setShowNotesFull] = useState(false)
  const notesRef = useRef(null)
  const [newWeight, setNewWeight] = useState({ weight: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' })
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [weightOpen, setWeightOpen] = useState(false)

  const { mutate: saveProfile, loading: savingProfile } = useMutation(
    (d) => profile ? healthProfileApi.update(d) : healthProfileApi.create(d),
    { onSuccess: () => { toast.success('Profile saved!'); setEditingProfile(false); refetchProfile() }, onError: t => toast.error(t) }
  )

  const { mutate: addWeight, loading: addingWeight } = useMutation(
    (d) => weightHistoryApi.add(d),
    { onSuccess: () => { toast.success('Weight logged!'); setNewWeight({ weight: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' }); refetchWeight() }, onError: t => toast.error(t) }
  )

  const { mutate: deleteWeight } = useMutation(
    (id) => weightHistoryApi.delete(id),
    { onSuccess: () => { toast.success('Entry removed'); refetchWeight() } }
  )

  const chartData = [...weights].reverse().map(w => ({ date: w.date?.slice(0,10), weight: w.weight }))

  // BMI will be computed from the display weight (latest monthly or profile fallback)

  // Autofill weight from latest entry in the current month if available
  const currentMonthPrefix = format(new Date(), 'yyyy-MM')
  const monthlyWeights = weights.filter(w => w.date?.slice(0,7) === currentMonthPrefix)
  const latestMonthly = monthlyWeights.length ? monthlyWeights.sort((a,b) => b.date.localeCompare(a.date))[0] : null
  const latestOverall = weights.length ? [...weights].sort((a,b) => b.date.localeCompare(a.date))[0] : null
  const displayWeight = latestMonthly?.weight ?? latestOverall?.weight ?? profile?.weight
  const displayBmi = profile?.height && displayWeight ? ((displayWeight) / ((profile.height / 100) ** 2)).toFixed(1) : null

  if (pLoading || wLoading) return <LoadingPage />

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Goals & Health" subtitle="Long-term health tracking" />

      

      {/* Profile Summary (below log weight) */}
      <div className="card p-5">
        <SectionTitle>Profile Summary</SectionTitle>
            {profile ? (
              <>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Height</p>
                    <p className="text-lg font-bold text-gray-800">{profile.height ?? '—'} <span className="text-sm font-normal">cm</span></p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="text-lg font-bold text-gray-800">{displayWeight ?? '—'} <span className="text-sm font-normal">kg</span></p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">BMI</p>
                    <p className="text-lg font-bold text-gray-800">{displayBmi ?? '—'}</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Blood Group</p>
                    <p className="text-lg font-bold text-gray-800">{profile.bloodGroup ?? '—'}</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Resting HR</p>
                    <p className="text-lg font-bold text-gray-800">{profile.restingHeartRate ?? '—'} <span className="text-sm font-normal">bpm</span></p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Date of Birth</p>
                    <p className="text-lg font-bold text-gray-800">{profile.dateOfBirth ? profile.dateOfBirth.slice(0,10) : '—'}</p>
                  </div>
                </div>

                {profile.notes ? (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 mb-2">Medical Notes</p>
                      <button
                        onClick={() => {
                          // open editor and focus notes
                          setProfileOpen(true)
                          setEditingProfile(true)
                          setProfileForm({ height: profile?.height ?? '', targetWeight: profile?.targetWeight ?? '', bloodGroup: profile?.bloodGroup ?? '', restingHeartRate: profile?.restingHeartRate ?? '', dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0,10) : '', notes: profile?.notes ?? '' })
                          setTimeout(() => notesRef.current?.focus(), 60)
                        }}
                        className="text-sm text-brand-600"
                      >
                        Edit notes
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>
                      {showNotesFull ? profile.notes : (profile.notes.length > 120 ? `${profile.notes.slice(0,120)}...` : profile.notes)}
                    </div>
                    {profile.notes.length > 120 && (
                      <button onClick={() => setShowNotesFull(s => !s)} className="mt-2 text-sm text-brand-600">{showNotesFull ? 'Show less' : 'Show more'}</button>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-gray-400 py-3">No profile set up yet.</p>
            )}
      </div>

      {/* Weight chart */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <SectionTitle>Weight Progress</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip formatter={(v) => [`${v} kg`, 'Weight']} contentStyle={{ borderRadius: 8, border: 'none' }} />
              <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weight history list */}
      <div className="card p-5">
        <SectionTitle>Weight History</SectionTitle>
        <div className="space-y-1">
          {weights.slice(0, 10).map(w => (
            <div key={w._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-500">{w.date?.slice(0, 10)}</span>
              <span className="text-sm font-semibold text-gray-800">{w.weight} kg</span>
              <button onClick={() => deleteWeight(w._id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
            </div>
          ))}
          {!weights.length && <p className="text-sm text-gray-400 text-center py-4">No weight entries yet.</p>}
        </div>
      </div>

      {/* Health Profile (collapsible) */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setProfileOpen(p => !p)} className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <span className={`inline-block transform transition-transform ${profileOpen ? 'rotate-90' : ''}`}>▶</span>
              <SectionTitle className="!m-0">Health Profile</SectionTitle>
            </button>
          </div>
          <button onClick={() => { setEditingProfile(e => { const next = !e; if (next) setProfileOpen(true); return next }); setProfileForm({ height: profile?.height ?? '', targetWeight: profile?.targetWeight ?? '', bloodGroup: profile?.bloodGroup ?? '', restingHeartRate: profile?.restingHeartRate ?? '', dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.slice(0,10) : '', notes: profile?.notes ?? '' }) }} className="btn-secondary text-sm">
            {editingProfile ? 'Cancel' : (profile ? 'Edit' : 'Set up')}
          </button>
        </div>

        {profileOpen && (
          <div>
            {!editingProfile && profile ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Height</p>
                    <p className="text-xl font-bold text-gray-800">{profile.height ?? '—'} <span className="text-sm font-normal">cm</span></p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="text-xl font-bold text-gray-800">{displayWeight ?? '—'} <span className="text-sm font-normal">kg</span></p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">BMI</p>
                    <p className="text-xl font-bold text-gray-800">{displayBmi ?? '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Blood Group</p>
                    <p className="text-xl font-bold text-gray-800">{profile.bloodGroup ?? '—'}</p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Resting HR</p>
                    <p className="text-xl font-bold text-gray-800">{profile.restingHeartRate ?? '—'} <span className="text-sm font-normal">bpm</span></p>
                  </div>
                  <div className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Date of Birth</p>
                    <p className="text-xl font-bold text-gray-800">{profile.dateOfBirth ? profile.dateOfBirth.slice(0,10) : '—'}</p>
                  </div>
                </div>
              </>
            ) : editingProfile ? (
                <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <NumberField label="Height" name="height" value={profileForm.height} onChange={e => setProfileForm(f => ({ ...f, height: e.target.value }))} unit="cm" placeholder="175" />
                  <NumberField label="Target Weight" name="targetWeight" value={profileForm.targetWeight} onChange={e => setProfileForm(f => ({ ...f, targetWeight: e.target.value }))} unit="kg" placeholder="70" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Blood Group</label>
                    <input className="input" name="bloodGroup" value={profileForm.bloodGroup} onChange={e => setProfileForm(f => ({ ...f, bloodGroup: e.target.value }))} placeholder="A+" />
                  </div>
                  <NumberField label="Resting HR" name="restingHeartRate" value={profileForm.restingHeartRate} onChange={e => setProfileForm(f => ({ ...f, restingHeartRate: e.target.value }))} unit="bpm" />
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input type="date" className="input" value={profileForm.dateOfBirth} onChange={e => setProfileForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Medical Notes</label>
                  <textarea ref={notesRef} className="input h-28" value={profileForm.notes} onChange={e => setProfileForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. May 2026 — malaria; June 2026 — headache" />
                </div>
                <button onClick={() => saveProfile({ height: Number(profileForm.height), targetWeight: Number(profileForm.targetWeight), bloodGroup: profileForm.bloodGroup || undefined, restingHeartRate: profileForm.restingHeartRate ? Number(profileForm.restingHeartRate) : undefined, dateOfBirth: profileForm.dateOfBirth || undefined, notes: profileForm.notes || undefined })} disabled={savingProfile} className="btn-primary flex items-center gap-2">
                  {savingProfile && <Spinner size="sm" />}
                  Save Profile
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Set up your health profile to track BMI and progress.</p>
            )}
          </div>
        )}
      </div>

      {/* Log Weight (collapsible) */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setWeightOpen(w => !w)} className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className={`inline-block transform transition-transform ${weightOpen ? 'rotate-90' : ''}`}>▶</span>
            <SectionTitle className="!m-0">Log Weight</SectionTitle>
          </button>
        </div>

        {weightOpen && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            <NumberField label="Weight" name="weight" value={newWeight.weight} onChange={e => setNewWeight(w => ({ ...w, weight: e.target.value }))} unit="kg" step={0.1} />
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={newWeight.date} max={format(new Date(), 'yyyy-MM-dd')} onChange={e => setNewWeight(w => ({ ...w, date: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <button onClick={() => addWeight({ weight: Number(newWeight.weight), date: newWeight.date, notes: newWeight.notes })} disabled={!newWeight.weight || addingWeight} className="btn-primary w-full flex items-center justify-center gap-2">
                {addingWeight && <Spinner size="sm" />}
                Log
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
