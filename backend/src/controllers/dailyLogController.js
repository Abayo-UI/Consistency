import DailyLog from "../models/DailyLog.js";
import streakService from "../services/streakService.js";
import DailyExercise from "../models/DailyExercise.js";
import scoreService from "../services/scoreService.js";

function computeScoreIfMissing(body) {
  // Always compute server-side percent score to prevent client-sent overrides.
  return scoreService.computePercent(body);
}

function mergeUpdateValue(currentValue, incomingValue) {
  if (incomingValue === undefined) return currentValue;
  if (incomingValue === null) return null;
  if (Array.isArray(incomingValue)) return incomingValue;
  if (typeof incomingValue === 'object' && typeof currentValue === 'object' && currentValue !== null && !Array.isArray(currentValue)) {
    const merged = { ...(currentValue || {}) };
    Object.entries(incomingValue).forEach(([key, value]) => {
      if (value === undefined) return;
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && typeof merged[key] === 'object' && merged[key] !== null && !Array.isArray(merged[key])) {
        merged[key] = mergeUpdateValue(merged[key], value);
      } else {
        merged[key] = value;
      }
    });
    return merged;
  }
  return incomingValue;
}

// Normalize frontend habit-style keys into backend growth/entertainment shape
function normalizePayload(obj) {
  if (!obj) return obj;
  obj.growth = obj.growth || {};
  obj.entertainment = obj.entertainment || {};
  obj.habits = obj.habits || {};
  if (obj.habits.addedMoreKnowledge !== undefined) {
    obj.growth.knowledge = !!obj.habits.addedMoreKnowledge;
    delete obj.habits.addedMoreKnowledge;
  }
  if (obj.habits.upskilling !== undefined) {
    obj.growth.upskilling = !!obj.habits.upskilling;
    delete obj.habits.upskilling;
  }
  if (obj.habits.noDoomScrolling !== undefined) {
    obj.entertainment.avoidDoomScrolling = !!obj.habits.noDoomScrolling;
    delete obj.habits.noDoomScrolling;
  }
  if (obj.habits.candyCrush !== undefined) {
    obj.entertainment.candyCrushPlayed = !!obj.habits.candyCrush;
    delete obj.habits.candyCrush;
  }
  return obj;
}

export async function createDailyLog(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    // normalize incoming habit keys into backend shape first
    normalizePayload(request.body);

    let { date, health, habits, growth, entertainment } = request.body;
    const origDateStr = (typeof request.body.date === 'string' && request.body.date.split('-').length === 3) ? request.body.date : null;

    // accept date as YYYY-MM-DD string and convert to local Date midnight
    if (origDateStr) {
      const parts = origDateStr.split('-').map(p => Number(p));
      if (!parts.some(isNaN)) {
        const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
        date = parsed;
      }
    }

    // compute normalized day string (needed to fetch any existing exercise attendance)
    let dayStr = origDateStr;
    if (!dayStr && date instanceof Date && !Number.isNaN(date.getTime())) {
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      dayStr = `${y}-${m}-${d}`;
    }

    // load any saved exercises for this user/day to include in score computation
    let exercisesForScore = [];
    try {
      if (dayStr) {
        const exDoc = await DailyExercise.findOne({ userId, day: dayStr });
        if (exDoc && Array.isArray(exDoc.items)) exercisesForScore = exDoc.items;
      }
    } catch (e) {
      console.error('failed to load daily exercises for scoring:', e);
    }

    const score = computeScoreIfMissing({ ...request.body, exercises: exercisesForScore });

    const newLog = new DailyLog({
      userId,
      date,
      health,
      habits,
      growth,
      entertainment,
      score,
    });

    // normalized day string YYYY-MM-DD for reliable queries
    if (origDateStr) {
      newLog.day = origDateStr;
    } else if (date instanceof Date && !Number.isNaN(date.getTime())) {
      // compute using UTC to avoid timezone shifts
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, '0');
      const d = String(date.getUTCDate()).padStart(2, '0');
      newLog.day = `${y}-${m}-${d}`;
    }

    await newLog.save();

    // update streaks based on this new daily log (server authoritative)
    try {
      await streakService.updateFromDailyLog(userId, newLog.date, newLog);
    } catch (e) {
      console.error('streak update after create failed:', e);
    }

    return response.status(201).json(newLog);
  } catch (e) {
    console.error("createDailyLog error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function getDailyLogs(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { limit = 100, skip = 0, from, to } = request.query;

    const filter = { userId };
    if (from || to) {
      // parse YYYY-MM-DD into date range (local midnight to end of day)
      const dateRange = {};
      if (from) {
        const parts = from.split('-').map(p => Number(p));
        if (!(parts.length === 3 && !parts.some(isNaN))) return response.status(400).json({ error: 'invalid from date' });
        const f = new Date(parts[0], parts[1] - 1, parts[2]); f.setHours(0,0,0,0);
        dateRange.$gte = f;
      }
      if (to) {
        const parts = to.split('-').map(p => Number(p));
        if (!(parts.length === 3 && !parts.some(isNaN))) return response.status(400).json({ error: 'invalid to date' });
        const t = new Date(parts[0], parts[1] - 1, parts[2]); t.setHours(23,59,59,999);
        dateRange.$lte = t;
      }
      filter.date = dateRange;
    }

    const logs = await DailyLog.find(filter)
      .sort({ date: -1 })
      .skip(parseInt(skip, 10))
      .limit(Math.min(1000, parseInt(limit, 10)));

    try {
      console.log(`[dailyLog] getDailyLogs user=${userId} returned ${logs.length} items`);
      logs.forEach(l => console.log(`[dailyLog] doc id=${l._id} day=${l.day} date=${l.date?.toISOString?.()}`));
    } catch (e) {
      console.warn('[dailyLog] debug log failed', e);
    }

    return response.status(200).json(logs);
  } catch (e) {
    console.error("getDailyLogs error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function getDailyLogByDate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { date } = request.params; // expect ISO date or YYYY-MM-DD
    if (!date) return response.status(400).json({ error: "date param required" });

    // expect YYYY-MM-DD; query by normalized day field to avoid timezone issues
    const parts = date.split('-').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) return response.status(400).json({ error: "invalid date" });
    const dayStr = `${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;

    console.log(`[dailyLog] lookup day=${dayStr} user=${userId}`);
    let log = await DailyLog.findOne({ userId, day: dayStr });
    if (log) {
      console.log(`[dailyLog] found by day id=${log._id}`);
      return response.status(200).json(log);
    }

    // fallback: try matching by date range for older records that lack `day`, then backfill `day`
    const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
    const start = new Date(parsed); start.setHours(0,0,0,0);
    const end = new Date(parsed); end.setHours(23,59,59,999);
    log = await DailyLog.findOne({ userId, date: { $gte: start, $lte: end } });
    if (log) {
      console.log(`[dailyLog] found by date-range id=${log._id} — backfilling day=${dayStr}`);
      log.day = dayStr;
      try { await log.save(); } catch (e) { console.warn('[dailyLog] backfill save failed', e); }
      return response.status(200).json(log);
    }

    console.log(`[dailyLog] no log found for day=${dayStr}`);
    return response.status(404).json({ error: "Daily log not found for that date" });
  } catch (e) {
    console.error("getDailyLogByDate error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function getDailyLogById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { id } = request.params;
    const log = await DailyLog.findById(id);
    if (!log) return response.status(404).json({ error: "Daily log not found" });
    if (String(log.userId) !== String(userId)) return response.status(403).json({ error: "Forbidden" });

    return response.status(200).json(log);
  } catch (e) {
    console.error("getDailyLogById error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function updateDailyLog(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { id } = request.params;
    const log = await DailyLog.findById(id);
    if (!log) return response.status(404).json({ error: "Daily log not found" });
    if (String(log.userId) !== String(userId)) return response.status(403).json({ error: "Forbidden" });

    // normalize incoming habit keys if present
    normalizePayload(request.body);

    const updatable = ["date", "health", "habits", "growth", "entertainment", "score"];
    updatable.forEach((key) => {
      if (request.body[key] === undefined) return;
      if (key === 'date') {
        let newDate = request.body.date;
        if (typeof newDate === 'string' && newDate.split('-').length === 3) {
          const parts = newDate.split('-').map(p => Number(p));
          if (!parts.some(isNaN)) newDate = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        log.date = newDate;
        if (typeof request.body.date === 'string') {
          log.day = request.body.date;
        } else if (log.date instanceof Date && !Number.isNaN(log.date.getTime())) {
          const y = log.date.getUTCFullYear();
          const m = String(log.date.getUTCMonth() + 1).padStart(2, '0');
          const d = String(log.date.getUTCDate()).padStart(2, '0');
          log.day = `${y}-${m}-${d}`;
        }
      } else if (['health', 'habits', 'growth', 'entertainment'].includes(key)) {
        log[key] = mergeUpdateValue(log[key], request.body[key]);
      } else {
        log[key] = request.body[key];
      }
    });

    // recompute score if not provided — include exercises from DailyExercise model
    if (request.body.score === undefined) {
      try {
        const day = log.day;
        let exItems = [];
        if (day) {
          const exDoc = await DailyExercise.findOne({ userId, day });
          if (exDoc && Array.isArray(exDoc.items)) exItems = exDoc.items;
        }
        const logObj = log.toObject ? log.toObject() : log;
        log.score = computeScoreIfMissing({ ...logObj, exercises: exItems });
      } catch (e) {
        console.error('failed to compute score with exercises:', e);
        log.score = computeScoreIfMissing(log);
      }
    }

    await log.save();

    // update streaks based on this updated daily log
    try {
      await streakService.updateFromDailyLog(userId, log.date, log);
    } catch (e) {
      console.error('streak update after update failed:', e);
    }

    return response.status(200).json(log);
  } catch (e) {
    console.error("updateDailyLog error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function updateDailyLogByDate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { date } = request.params;
    if (!date) return response.status(400).json({ error: "date param required" });
    // parse YYYY-MM-DD into local midnight to avoid timezone shifts
    const parts = date.split('-').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) return response.status(400).json({ error: "invalid date" });
    const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
    const start = new Date(parsed); start.setHours(0,0,0,0);
    const dayStr = `${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    // normalize incoming habit keys if present
    normalizePayload(request.body);

    const log = await DailyLog.findOne({ userId, day: dayStr });
    if (!log) return response.status(404).json({ error: "Daily log not found for that date" });

    // prevent editing logs for past days (allow creating past logs via POST)
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    if (start < todayStart) return response.status(403).json({ error: "Cannot modify logs for past dates" });

    const updatable = ["date", "health", "habits", "growth", "entertainment", "score"];
    updatable.forEach((key) => {
      if (request.body[key] === undefined) return;
      if (key === 'date') {
        let newDate = request.body.date;
        if (typeof newDate === 'string' && newDate.split('-').length === 3) {
          const p = newDate.split('-').map(x => Number(x));
          if (!p.some(isNaN)) newDate = new Date(p[0], p[1] - 1, p[2]);
        }
        log.date = newDate;
        if (typeof request.body.date === 'string') {
          log.day = request.body.date;
        } else if (log.date instanceof Date && !Number.isNaN(log.date.getTime())) {
          const y = log.date.getUTCFullYear();
          const m = String(log.date.getUTCMonth() + 1).padStart(2, '0');
          const d = String(log.date.getUTCDate()).padStart(2, '0');
          log.day = `${y}-${m}-${d}`;
        }
      } else if (['health', 'habits', 'growth', 'entertainment'].includes(key)) {
        log[key] = mergeUpdateValue(log[key], request.body[key]);
      } else {
        log[key] = request.body[key];
      }
    });

    if (request.body.score === undefined) {
      try {
        const day = log.day || dayStr;
        let exItems = [];
        if (day) {
          const exDoc = await DailyExercise.findOne({ userId, day });
          if (exDoc && Array.isArray(exDoc.items)) exItems = exDoc.items;
        }
        const logObj = log.toObject ? log.toObject() : log;
        log.score = computeScoreIfMissing({ ...logObj, exercises: exItems });
      } catch (e) {
        console.error('failed to compute score with exercises:', e);
        log.score = computeScoreIfMissing(log);
      }
    }

    await log.save();

    try {
      await streakService.updateFromDailyLog(userId, log.date, log);
    } catch (e) {
      console.error('streak update after update failed:', e);
    }

    return response.status(200).json(log);
  } catch (e) {
    console.error("updateDailyLogByDate error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteDailyLogByDate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { date } = request.params;
    if (!date) return response.status(400).json({ error: "date param required" });
    // parse YYYY-MM-DD into local midnight to avoid timezone shifts
    const parts = date.split('-').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) return response.status(400).json({ error: "invalid date" });
    const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
    const start = new Date(parsed);
    start.setHours(0, 0, 0, 0);
    const end = new Date(parsed);
    end.setHours(23, 59, 59, 999);

    const dayStr = `${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    const log = await DailyLog.findOne({ userId, day: dayStr });
    if (!log) return response.status(404).json({ error: "Daily log not found for that date" });

    // prevent deleting logs for past days
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    if (start < todayStart) return response.status(403).json({ error: "Cannot delete logs for past dates" });

    await DailyLog.findByIdAndDelete(log._id);
    return response.status(200).json({ message: "Daily log deleted" });
  } catch (e) {
    console.error("deleteDailyLogByDate error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteDailyLog(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: "Unauthorized" });

    const { id } = request.params;
    const log = await DailyLog.findById(id);
    if (!log) return response.status(404).json({ error: "Daily log not found" });
    if (String(log.userId) !== String(userId)) return response.status(403).json({ error: "Forbidden" });

    await DailyLog.findByIdAndDelete(id);

    return response.status(200).json({ message: "Daily log deleted" });
  } catch (e) {
    console.error("deleteDailyLog error:", e);
    return response.status(500).json({ error: "Internal server error" });
  }
}
