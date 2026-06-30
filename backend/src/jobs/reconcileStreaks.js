import streakService from "../services/streakService.js";

async function run() {
  try {
    console.log('Starting streak reconciliation...');
    await streakService.reconcileAllUsers();
    console.log('Streak reconciliation complete.');
    process.exit(0);
  } catch (e) {
    console.error('Reconcile failed:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

export default run;
