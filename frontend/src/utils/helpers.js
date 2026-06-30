import { format, parseISO, isToday, isYesterday } from 'date-fns'

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export const fmtDate = (d) => {
  if (!d) return ''
  const date = typeof d === 'string' ? parseISO(d) : d
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d, yyyy')
}

export const fmtDateShort = (d) => {
  if (!d) return ''
  return format(typeof d === 'string' ? parseISO(d) : d, 'MMM d')
}

export const scoreColor = (score) => {
  if (score >= 80) return 'text-brand-500'
  if (score >= 60) return 'text-yellow-500'
  return 'text-red-500'
}

export const scoreBg = (score) => {
  if (score >= 80) return 'bg-brand-500'
  if (score >= 60) return 'bg-yellow-400'
  return 'bg-red-400'
}

export const scoreStroke = (score) => {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  return '#ef4444'
}

export const scoreLabel = (score) => {
  if (score >= 90) return 'Excellent! 🏆'
  if (score >= 80) return 'Great job! 🎉'
  if (score >= 70) return 'Good work! 👍'
  if (score >= 60) return 'Keep going! 💪'
  return 'You can do it! 🌱'
}

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

export const getErrorMessage = (err) =>
  err?.response?.data?.message ?? err?.message ?? 'An unexpected error occurred'
