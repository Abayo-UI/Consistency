// Computes raw and percent scores for DailyLog-like objects
function computeRawScore(body = {}) {
  const { health = {}, habits = {}, growth = {}, entertainment = {}, exercises = [] } = body;
  let score = 0;

  [
    habits.exercise,
    habits.bathed,
    habits.wokeBefore7,
    habits.abstained,
    habits.sugarFree,
    habits.trabajo,
    habits.prayed,
    growth.knowledge,
    growth.upskilling,
    entertainment.avoidDoomScrolling,
  ].forEach((v) => { if (v) score += 1 });

  if (Array.isArray(exercises) && exercises.length) {
    const checked = exercises.filter((e) => e && e.checked).length;
    score += Math.min(3, checked * 0.5);
  }

  if (health.sleepHours) score += Math.min(2, Math.round(health.sleepHours / 4));
  if (health.steps) score += Math.min(2, Math.round((health.steps || 0) / 5000));
  if (health.waterLitres) score += Math.min(1, Math.round((health.waterLitres || 0) / 2));

  return score; // raw score (0..~18)
}

function computePercent(body = {}) {
  const raw = computeRawScore(body);
  const max = 18; // theoretical maximum from the heuristic
  const pct = Math.round((raw / max) * 100);
  return Math.min(100, Math.max(0, pct));
}

export default { computeRawScore, computePercent };
