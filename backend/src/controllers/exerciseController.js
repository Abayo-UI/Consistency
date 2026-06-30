import DailyExercise from "../models/DailyExercise.js";
import DailyLog from "../models/DailyLog.js";
import scoreService from "../services/scoreService.js";
import streakService from "../services/streakService.js";

// Helper to compute day string YYYY-MM-DD from Date
function toDayStr(date) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export async function getExercisesByDate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { date } = request.params; // YYYY-MM-DD
    if (!date) return response.status(400).json({ error: 'date param required' });
    const parts = date.split('-').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) return response.status(400).json({ error: 'invalid date' });
    const dayStr = `${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    let doc = await DailyExercise.findOne({ userId, day: dayStr });
    if (doc) return response.status(200).json(doc);

    // fallback: try matching by date range
    const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
    const start = new Date(parsed); start.setHours(0,0,0,0);
    const end = new Date(parsed); end.setHours(23,59,59,999);
    doc = await DailyExercise.findOne({ userId, date: { $gte: start, $lte: end } });
    if (doc) {
      doc.day = dayStr;
      try { await doc.save(); } catch (e) { /* ignore */ }
      return response.status(200).json(doc);
    }

    return response.status(404).json({ error: 'Exercises not found for that date' });
  } catch (e) {
    console.error('getExercisesByDate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertExercisesByDate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { date } = request.params; // YYYY-MM-DD
    if (!date) return response.status(400).json({ error: 'date param required' });
    const parts = date.split('-').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) return response.status(400).json({ error: 'invalid date' });
    const dayStr = `${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;

    const payload = request.body && Array.isArray(request.body.items) ? request.body.items : request.body.items || [];
    // Upsert
    let doc = await DailyExercise.findOne({ userId, day: dayStr });
    if (!doc) {
      doc = new DailyExercise({ userId, day: dayStr, items: payload });
    } else {
      doc.items = payload;
      doc.date = new Date(parts[0], parts[1] - 1, parts[2]);
    }
    await doc.save();
        
        // Debug logging: report exercises saved
        try {
            const checked = Array.isArray(doc.items) ? doc.items.filter(e => e && e.checked).length : 0;
            console.log(`[exercises] upsert saved for user=${userId} day=${dayStr} items=${doc.items.length} checked=${checked}`);
        } catch (e) { console.warn('[exercises] upsert debug log failed', e); }

        // Recompute associated DailyLog score (if exists) using exercises
      let updatedLog = null;
      try {
        const log = await DailyLog.findOne({ userId, day: dayStr });
        if (log) {
          const logObj = log.toObject ? log.toObject() : log;
        const newScore = scoreService.computePercent({ ...logObj, exercises: doc.items });
        console.log(`[exercises] recomputing dailyLog user=${userId} day=${dayStr} logId=${log._id} oldScore=${log.score} newScore=${newScore}`);
        log.score = newScore;
          await log.save();
          updatedLog = log;
          // update streaks with updated log
          try { await streakService.updateFromDailyLog(userId, log.date, log); } catch (e) { console.error('streak update after exercises upsert failed', e); }
        }
      } catch (e) {
        console.error('failed to recompute daily log score after exercises upsert:', e);
      }

      return response.status(200).json({ exercises: doc, dailyLog: updatedLog });
  } catch (e) {
    console.error('upsertExercisesByDate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function createExercises(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { date, items } = request.body;
    const dayStr = toDayStr(date) || toDayStr(new Date());
    const parsed = new Date(date);
    const doc = new DailyExercise({ userId, day: dayStr, date: parsed, items: Array.isArray(items) ? items : [] });
    await doc.save();
    try {
      const checked = Array.isArray(doc.items) ? doc.items.filter(e => e && e.checked).length : 0;
      console.log(`[exercises] create saved for user=${userId} day=${dayStr} items=${doc.items.length} checked=${checked}`);
    } catch (e) { console.warn('[exercises] create debug log failed', e); }
    // Recompute associated DailyLog score (if exists)
    let updatedLogCreate = null;
    try {
      const log = await DailyLog.findOne({ userId, day: dayStr });
      if (log) {
        const logObj = log.toObject ? log.toObject() : log;
        const newScore = scoreService.computePercent({ ...logObj, exercises: doc.items });
        console.log(`[exercises] recomputing dailyLog (create) user=${userId} day=${dayStr} logId=${log._id} oldScore=${log.score} newScore=${newScore}`);
        log.score = newScore;
        await log.save();
        updatedLogCreate = log;
        try { await streakService.updateFromDailyLog(userId, log.date, log); } catch (e) { console.error('streak update after exercises create failed', e); }
      }
    } catch (e) {
      console.error('failed to recompute daily log score after exercises create:', e);
    }

    return response.status(201).json({ exercises: doc, dailyLog: updatedLogCreate });
  } catch (e) {
    console.error('createExercises error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteExercisesByDate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { date } = request.params;
    const parts = date.split('-').map(p => Number(p));
    if (parts.length !== 3 || parts.some(isNaN)) return response.status(400).json({ error: 'invalid date' });
    const dayStr = `${String(parts[0]).padStart(4,'0')}-${String(parts[1]).padStart(2,'0')}-${String(parts[2]).padStart(2,'0')}`;
    const doc = await DailyExercise.findOne({ userId, day: dayStr });
    if (!doc) return response.status(404).json({ error: 'Not found' });
    await DailyExercise.findByIdAndDelete(doc._id);
    return response.status(200).json({ message: 'Deleted' });
  } catch (e) {
    console.error('deleteExercisesByDate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
