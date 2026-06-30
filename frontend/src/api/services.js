import api from './client'

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (data) => api.post('/user/signup', data),
  login:  (data) => api.post('/user/login', data),
  me:     ()     => api.get('/user/me'),
  update: (data) => api.put('/user/updateInfo', data),
}

// ── DAILY LOGS ────────────────────────────────────────────────────────────────
export const dailyLogApi = {
  getByDate:  (date) => api.get(`/daily-logs/date/${date}`),          // YYYY-MM-DD
  getRecent:  (params) => api.get('/daily-logs', { params }),    // ?limit=7&page=1
  create:     (data) => api.post('/daily-logs', data),
  update:     (date, data) => api.put(`/daily-logs/date/${date}`, data),
  delete:     (date) => api.delete(`/daily-logs/date/${date}`),
}

// ── HEALTH PROFILES ───────────────────────────────────────────────────────────
export const healthProfileApi = {
  get:    () => api.get('/health-profiles/me'),
  create: (data) => api.post('/health-profiles', data),
  update: (data) => api.post('/health-profiles', data),
}

// ── WEIGHT HISTORY ────────────────────────────────────────────────────────────
export const weightHistoryApi = {
  getAll: (params) => api.get('/weight-history', { params }),
  add:    (data)   => api.post('/weight-history', data),
  delete: (id)     => api.delete(`/weight-history/${id}`),
}

// ── STREAKS ───────────────────────────────────────────────────────────────────
export const streakApi = {
  // backend exposes `/streaks/me` for the current user's streak document
  get:    () => api.get('/streaks/me'),
  update: (data) => api.put('/streaks', data),
}

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────
export const auditLogApi = {
  getAll: (params) => api.get('/audit-logs', { params }),
}

// ── LEARNINGS ─────────────────────────────────────────────────────────────────
export const learningApi = {
  getAll:  (params) => api.get('/learnings', { params }),
  create:  (data)   => api.post('/learnings', data),
  update:  (id, data) => api.put(`/learnings/${id}`, data),
  delete:  (id)     => api.delete(`/learnings/${id}`),
}

// ── ACHIEVEMENTS ──────────────────────────────────────────────────────────────
export const achievementApi = {
  getAll: (params) => api.get('/achievements', { params }),
  unlock: (data)   => api.post('/achievements', data),
}

// ── GOOGLE FIT ────────────────────────────────────────────────────────────────
export const googleFitApi = {
  sync:   (data) => api.post('/google-fit/sync', data),
  status: ()     => api.get('/google-fit/status'),
  getLast: ()    => api.get('/google-fit'),
}

// ── EXERCISE TEMPLATES ────────────────────────────────────────────────────────
export const exerciseTemplateApi = {
  get:            ()     => api.get('/exercise-template'),
  create:         (data) => api.post('/exercise-template', data),
  update:         (data) => api.put('/exercise-template', data),
  createDefaults: ()     => api.post('/exercise-template/default'),
}

// ── EXERCISES (attendance) ─────────────────────────────────────────────────
export const exerciseApi = {
  getByDate: (date) => api.get(`/exercises/date/${date}`),
  create:   (data) => api.post('/exercises', data),
  upsert:   (date, data) => api.put(`/exercises/date/${date}`, data),
  delete:   (date) => api.delete(`/exercises/date/${date}`),
}
