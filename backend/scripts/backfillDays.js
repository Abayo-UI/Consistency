import connectDb from '../src/config/db.js';
import DailyLog from '../src/models/DailyLog.js';

async function run() {
  await connectDb();
  console.log('Connected to DB — starting backfill');
  const cursor = DailyLog.find({ $or: [{ day: { $exists: false } }, { day: null }] }).cursor();
  let count = 0;
  for await (const doc of cursor) {
    if (!doc.date) continue;
    const d = new Date(doc.date);
    if (Number.isNaN(d.getTime())) continue;
    // compute UTC date components to avoid timezone shifts
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    doc.day = `${y}-${m}-${da}`;
    try {
      await doc.save();
      count += 1;
    } catch (e) {
      console.warn('failed to save doc', doc._id, e.message);
    }
  }
  console.log(`Backfill complete — updated ${count} documents.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Backfill job failed:', e);
  process.exit(1);
});
