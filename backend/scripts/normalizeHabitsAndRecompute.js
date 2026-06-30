import connectDb from '../src/config/db.js';
import DailyLog from '../src/models/DailyLog.js';
import streakService from '../src/services/streakService.js';
import scoreService from '../src/services/scoreService.js';

function computeScore(doc) {
  // Return percent 0-100
  return scoreService.computePercent(doc);
}

async function run() {
  await connectDb();
  console.log('Connected to DB — normalizing habit keys on DailyLog docs');

  const query = {
    $or: [
      { 'habits.addedMoreKnowledge': { $exists: true } },
      { 'habits.upskilling': { $exists: true } },
      { 'habits.noDoomScrolling': { $exists: true } },
      { 'habits.candyCrush': { $exists: true } },
      { 'growth.learn': { $exists: true } },
      { 'growth.learning': { $exists: true } },
      { 'growth.learned': { $exists: true } },
      { 'learning': { $exists: true } },
      { 'learn': { $exists: true } },
      { 'growth.skill': { $exists: true } },
      { 'growth.upskill': { $exists: true } },
    ]
  };

  const cursor = DailyLog.find(query).cursor();
  let count = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const h = doc.habits || {};
    doc.growth = doc.growth || {};
    doc.entertainment = doc.entertainment || {};

    // habit -> growth/entertainment mappings
    if (h.addedMoreKnowledge !== undefined) {
      doc.growth.knowledge = !!h.addedMoreKnowledge;
      delete doc.habits.addedMoreKnowledge;
    }
    if (h.upskilling !== undefined) {
      doc.growth.upskilling = !!h.upskilling;
      delete doc.habits.upskilling;
    }
    if (h.noDoomScrolling !== undefined) {
      doc.entertainment.avoidDoomScrolling = !!h.noDoomScrolling;
      delete doc.habits.noDoomScrolling;
    }
    if (h.candyCrush !== undefined) {
      doc.entertainment.candyCrushPlayed = !!h.candyCrush;
      delete doc.habits.candyCrush;
    }

    // older growth keys -> normalize to growth.knowledge / upskilling
    if (doc.growth.learn !== undefined) {
      doc.growth.knowledge = !!doc.growth.learn;
      delete doc.growth.learn;
    }
    if (doc.growth.learning !== undefined) {
      doc.growth.knowledge = !!doc.growth.learning;
      delete doc.growth.learning;
    }
    if (doc.growth.learned !== undefined) {
      doc.growth.knowledge = !!doc.growth.learned;
      delete doc.growth.learned;
    }
    if (doc.learning !== undefined) {
      doc.growth.knowledge = !!doc.learning;
      delete doc.learning;
    }
    if (doc.learn !== undefined) {
      doc.growth.knowledge = !!doc.learn;
      delete doc.learn;
    }
    if (doc.growth.skill !== undefined) {
      doc.growth.upskilling = !!doc.growth.skill;
      delete doc.growth.skill;
    }
    if (doc.growth.upskill !== undefined) {
      doc.growth.upskilling = !!doc.growth.upskill;
      delete doc.growth.upskill;
    }

    // recompute score using the same heuristic
    try {
      doc.score = computeScore(doc);
      await doc.save();
      count += 1;
    } catch (e) {
      console.error('failed to save doc', doc._id, e);
    }
  }

  console.log(`Normalized and updated ${count} DailyLog documents.`);

  // reconcile streaks for all users
  try {
    console.log('Reconciling streaks for all users...');
    await streakService.reconcileAllUsers();
    console.log('Streak reconcile complete');
  } catch (e) {
    console.error('Streak reconcile failed:', e);
  }

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
