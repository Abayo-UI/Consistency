import connectDb from '../src/config/db.js';
import streakService from '../src/services/streakService.js';

async function run() {
  await connectDb();
  console.log('Connected to DB — reconciling all user streaks');
  try {
    await streakService.reconcileAllUsers();
    console.log('Reconcile complete');
  } catch (e) {
    console.error('Reconcile failed:', e);
    process.exit(1);
  }
  process.exit(0);
}

run();
