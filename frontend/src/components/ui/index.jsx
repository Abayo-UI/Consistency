// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' }[size]
  return (
    <div className={`${s} animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 ${className}`} />
  )
}

// ── Loading page ──────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
      <p className="text-red-700 text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="ml-4 text-sm font-semibold text-red-600 hover:text-red-800">
          Retry
        </button>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Score Ring SVG ────────────────────────────────────────────────────────────
export function ScoreRing({ score = 0, size = 120, strokeWidth = 10 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'
  const label = score >= 90 ? 'Excellent!' : score >= 80 ? 'Great job!' : score >= 60 ? 'Keep going!' : 'You can do it!'

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.22} fontWeight="700" fill="#111827">
          {score}%
        </text>
      </svg>
      <span style={{ color }} className="text-sm font-semibold mt-1">{label}</span>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, label, value, sub, progress, progressColor = 'bg-brand-500' }) {
  const useHex = typeof progressColor === 'string' && progressColor.startsWith && progressColor.startsWith('#')
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      {sub && (
        <div
          className="text-xs font-medium"
          style={useHex ? { color: progressColor } : {}}
        >
          {sub}
        </div>
      )}
      {typeof progress === 'number' && (
        <div className="h-1.5 bg-gray-100 rounded-full mt-1">
          <div
            className={`h-1.5 rounded-full transition-all ${!useHex ? progressColor : ''}`}
            style={{ width: `${Math.min(progress, 100)}%`, ...(useHex ? { backgroundColor: progressColor } : {}) }}
          />
        </div>
      )}
    </div>
  )
}

// ── Toggle checkbox ───────────────────────────────────────────────────────────
export function HabitCheck({ label, icon, checked, onChange, disabled }) {
  return (
    <div className={`flex items-center justify-between py-2.5 px-1 border-b border-gray-50 last:border-0 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
          ${checked
            ? 'bg-brand-500 border-brand-500 text-white'
            : 'border-gray-300 hover:border-brand-400'
          }`}
      >
        {checked && (
          <svg className="w-3 h-3" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
    </div>
  )
}

// ── Page header ───────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── Number input with label ───────────────────────────────────────────────────
export function NumberField({ label, name, value, onChange, min, max, step = 1, unit, placeholder, disabled }) {
  return (
    <div>
      <label className="label">{label} {unit && <span className="text-gray-400 font-normal">({unit})</span>}</label>
      <input
        type="number"
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="input"
      />
    </div>
  )
}

// ── Section divider ───────────────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{children}</h2>
}
