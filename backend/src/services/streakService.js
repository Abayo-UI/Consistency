import Streak from "../models/Streak.js";
import DailyLog from "../models/DailyLog.js";
import AuditLog from "../models/AuditLog.js";
import DailyExercise from "../models/DailyExercise.js";

const categories = {
  // Abstinence now requires both abstained and no doom-scrolling to count
  abstinence: (log) => {
    const abstained = log?.habits?.abstained === true;
    const noDoom = log?.entertainment?.avoidDoomScrolling === true || log?.habits?.noDoomScrolling === true;
    return abstained && noDoom;
  },
  sugarFree: (log) => log?.habits?.sugarFree === true,
  exercise: (log) => {
    if (log?.habits?.exercise === true) return true;
    // prefer attached _exercises (populated by caller) then fallback to log.exercises for backward compat
    if (Array.isArray(log?._exercises) && log._exercises.some(e => e && e.checked)) return true;
    if (Array.isArray(log?.exercises) && log.exercises.some(e => e && e.checked)) return true;
    return false;
  },
  earlyWake: (log) => log?.habits?.wokeBefore7 === true,
  waterGoal: (log) => (log?.health?.waterLitres || 0) >= (process.env.WATER_GOAL_LITRES ? Number(process.env.WATER_GOAL_LITRES) : 2),
  avoidDoomScrolling: (log) => log?.entertainment?.avoidDoomScrolling === true,
  trabajo: (log) => log?.habits?.trabajo === true,
  prayed: (log) => log?.habits?.prayed === true,
  knowledge: (log) => log?.growth?.knowledge === true,
  upskilling: (log) => log?.growth?.upskilling === true,
};

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function recordAudit(userId, category, referenceId, oldValue, newValue, source = "auto", note = "") {
  try {
    await AuditLog.create({ userId, entity: "streak", category, referenceId, oldValue, newValue, source, note });
  } catch (e) {
    console.error("recordAudit failed:", e);
  }
}

export async function updateFromDailyLog(userId, date, dailyLog) {
  try {
    if (!userId) return;
    let streak = await Streak.findOne({ userId });
    if (!streak) {
      streak = new Streak({ userId });
    }

    const now = new Date();

    // attach today's exercises to the dailyLog object so predicates can check them
    try {
      let dayStr = dailyLog?.day;
      if (!dayStr && dailyLog?.date) {
        const d = new Date(dailyLog.date);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        dayStr = `${y}-${m}-${dd}`;
      }
      if (dayStr) {
        const exDoc = await DailyExercise.findOne({ userId, day: dayStr });
        if (exDoc && Array.isArray(exDoc.items)) dailyLog._exercises = exDoc.items;
      }
    } catch (e) {
      console.error('failed to attach daily exercises for streaks:', e);
    }

    for (const [category, predicate] of Object.entries(categories)) {
      try {
        const achieved = predicate(dailyLog);
        const bucket = streak[category];
        const lastUpdated = bucket?.lastUpdated;
        const lastUpdatedIsSameDayAsLog = isSameDay(lastUpdated, date);
        const isLogForToday = isSameDay(date, now);

        const oldValue = { current: bucket.current, longest: bucket.longest, lastUpdated: bucket.lastUpdated };

        if (achieved) {
          // If already recorded today and current > 0, do nothing (already counted)
          if (lastUpdatedIsSameDayAsLog && bucket.current > 0) {
            // no-op
          } else if (lastUpdatedIsSameDayAsLog && bucket.current === 0) {
            // previously reset earlier today; now mark as achieved -> set to 1
            bucket.current = 1;
            if (!bucket.longest || bucket.current > bucket.longest) bucket.longest = bucket.current;
            bucket.lastUpdated = now;
            const newValue = { current: bucket.current, longest: bucket.longest, lastUpdated: bucket.lastUpdated };
            await recordAudit(userId, category, dailyLog._id, oldValue, newValue, "auto", `Incremented (same-day correction) from dailyLog ${dailyLog._id}`);
          } else {
            // not updated today -> increment
            bucket.current = (bucket.current || 0) + 1;
            if (!bucket.longest || bucket.current > bucket.longest) bucket.longest = bucket.current;
            bucket.lastUpdated = now;
            const newValue = { current: bucket.current, longest: bucket.longest, lastUpdated: bucket.lastUpdated };
            await recordAudit(userId, category, dailyLog._id, oldValue, newValue, "auto", `Incremented from dailyLog ${dailyLog._id}`);
          }
        } else {
          // not achieved
          // Do not reset streak for today's provisional entries (user may fill later in the day)
          if (isLogForToday) {
            // no-op for today's partial/provisional logs
          } else if (lastUpdatedIsSameDayAsLog && bucket.current === 0) {
            // no-op if already reset today
          } else if (bucket.current && bucket.current !== 0) {
            // reset streak for past days or definitive logs
            bucket.current = 0;
            bucket.lastUpdated = now;
            const newValue = { current: bucket.current, longest: bucket.longest, lastUpdated: bucket.lastUpdated };
            await recordAudit(userId, category, dailyLog._id, oldValue, newValue, "auto", `Reset from dailyLog ${dailyLog._id}`);
          }
        }
      } catch (inner) {
        console.error("updateFromDailyLog category error", category, inner);
      }
    }

    await streak.save();
    return streak;
  } catch (e) {
    console.error("updateFromDailyLog error:", e);
    throw e;
  }
}

export async function reconcileUserStreak(userId) {
  try {
    const logs = await DailyLog.find({ userId }).sort({ date: 1 });
    if (!logs || logs.length === 0) return null;

    const computed = {};
    for (const category of Object.keys(categories)) {
      computed[category] = { current: 0, longest: 0 };
    }

    for (const log of logs) {
      for (const [category, predicate] of Object.entries(categories)) {
        const achieved = predicate(log);
        if (achieved) {
          computed[category].current += 1;
          if (computed[category].current > computed[category].longest) computed[category].longest = computed[category].current;
        } else {
          computed[category].current = 0;
        }
      }
    }

    let streak = await Streak.findOne({ userId });
    if (!streak) streak = new Streak({ userId });

    for (const category of Object.keys(categories)) {
      const oldValue = { current: streak[category].current, longest: streak[category].longest };
      const newValue = { current: computed[category].current, longest: computed[category].longest };
      streak[category].current = newValue.current;
      streak[category].longest = newValue.longest;
      streak[category].lastUpdated = new Date();
      if (oldValue.current !== newValue.current || oldValue.longest !== newValue.longest) {
        await recordAudit(userId, category, null, oldValue, newValue, "reconcile", "Reconciled from DailyLog history");
      }
    }

    await streak.save();
    return streak;
  } catch (e) {
    console.error("reconcileUserStreak error:", e);
    throw e;
  }
}

export async function reconcileAllUsers() {
  const users = await Streak.find().select('userId');
  for (const u of users) {
    await reconcileUserStreak(u.userId);
  }
}

export default { updateFromDailyLog, reconcileUserStreak, reconcileAllUsers };
