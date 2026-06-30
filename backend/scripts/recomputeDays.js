import connectDb from '../src/config/db.js';
import DailyLog from '../src/models/DailyLog.js';

async function run() {
  await connectDb();
  console.log('Connected to DB — starting full day recompute');
  const cursor = DailyLog.find({}).cursor();
  let updated = 0;
  for await (const doc of cursor) {
    if (!doc.date) continue;
    const d = new Date(doc.date);
    if (Number.isNaN(d.getTime())) continue;
    // compute UTC date components to avoid timezone shifts
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    const computed = `${y}-${m}-${da}`;
    if (doc.day !== computed) {
      doc.day = computed;
      try {
        await doc.save();
        updated += 1;
        console.log('updated', doc._id, '->', computed);
      } catch (e) {
        console.warn('failed to save doc', doc._id, e.message);
      }
    }
  }
  console.log(`Recompute complete — updated ${updated} documents.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('Recompute job failed:', e);
  process.exit(1);
});
