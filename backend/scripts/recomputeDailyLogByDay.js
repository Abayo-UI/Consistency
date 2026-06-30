import connectDb from '../src/config/db.js';
import DailyLog from '../src/models/DailyLog.js';
import DailyExercise from '../src/models/DailyExercise.js';
import scoreService from '../src/services/scoreService.js';
import streakService from '../src/services/streakService.js';

async function run(userId, day) {
  await connectDb();
  if (!userId || !day) {
    console.error('Usage: node recomputeDailyLogByDay.js <userId> <YYYY-MM-DD>');
    process.exit(2);
  }

  const log = await DailyLog.findOne({ userId, day });
  if (!log) {
    console.error('DailyLog not found for', userId, day);
    process.exit(3);
  }

  let exItems = [];
  try {
    const exDoc = await DailyExercise.findOne({ userId, day });
    if (exDoc && Array.isArray(exDoc.items)) exItems = exDoc.items;
  } catch (e) {
    console.error('error loading exercises', e);
  }

  const logObj = log.toObject ? log.toObject() : log;
  const newScore = scoreService.computePercent({ ...logObj, exercises: exItems });
  console.log('Old score:', log.score, 'New score:', newScore);
  log.score = newScore;
  await log.save();

  try {
    await streakService.updateFromDailyLog(userId, log.date, log);
    console.log('Streaks updated');
  } catch (e) {
    console.error('streak update failed', e);
  }

  console.log('Done');
  process.exit(0);
}

const [,, userId, day] = process.argv;
run(userId, day).catch(e => { console.error(e); process.exit(1); });
