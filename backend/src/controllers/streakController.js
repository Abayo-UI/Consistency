import Streak from "../models/Streak.js";

const allowedCategories = [
  'abstinence','sugarFree','exercise','earlyWake','waterGoal','avoidDoomScrolling','trabajo','prayed','knowledge','upskilling'
];

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

async function getOrCreateStreak(userId) {
  let s = await Streak.findOne({ userId });
  if (!s) {
    s = new Streak({ userId });
    await s.save();
  }
  return s;
}

export async function getMyStreak(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const s = await getOrCreateStreak(userId);
    return response.status(200).json(s);
  } catch (e) {
    console.error('getMyStreak error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function createStreak(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const existing = await Streak.findOne({ userId });
    if (existing) return response.status(400).json({ error: 'Streak already exists for user' });
    const s = new Streak({ userId, ...request.body });
    await s.save();
    return response.status(201).json(s);
  } catch (e) {
    console.error('createStreak error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function incrementStreak(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { category } = request.params;
    if (!allowedCategories.includes(category)) return response.status(400).json({ error: 'Invalid category' });

    const amount = parseInt(request.body.amount, 10) || 1;
    const s = await getOrCreateStreak(userId);
    const bucket = s[category];
    if (!bucket) return response.status(400).json({ error: 'Category not found on streak' });

    const now = new Date();
    if (bucket.lastUpdated && isSameDay(bucket.lastUpdated, now)) {
      return response.status(400).json({ error: 'Already updated today' });
    }

    bucket.current = (bucket.current || 0) + amount;
    if (!bucket.longest || bucket.current > bucket.longest) bucket.longest = bucket.current;
    bucket.lastUpdated = now;

    await s.save();
    return response.status(200).json(s);
  } catch (e) {
    console.error('incrementStreak error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function resetStreak(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { category } = request.params;
    if (!allowedCategories.includes(category)) return response.status(400).json({ error: 'Invalid category' });

    const s = await getOrCreateStreak(userId);
    const bucket = s[category];
    if (!bucket) return response.status(400).json({ error: 'Category not found on streak' });

    bucket.current = 0;
    bucket.lastUpdated = new Date();

    await s.save();
    return response.status(200).json(s);
  } catch (e) {
    console.error('resetStreak error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStreakById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { id } = request.params;
    const s = await Streak.findById(id);
    if (!s) return response.status(404).json({ error: 'Streak not found' });
    if (String(s.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });
    return response.status(200).json(s);
  } catch (e) {
    console.error('getStreakById error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateStreak(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { id } = request.params;
    const s = await Streak.findById(id);
    if (!s) return response.status(404).json({ error: 'Streak not found' });
    if (String(s.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    const updatable = ['abstinence','sugarFree','exercise','earlyWake','waterGoal','avoidDoomScrolling','trabajo','prayed','knowledge','upskilling'];
    updatable.forEach((key) => {
      if (request.body[key] !== undefined) s[key] = request.body[key];
    });

    await s.save();
    return response.status(200).json(s);
  } catch (e) {
    console.error('updateStreak error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteStreak(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });
    const { id } = request.params;
    const s = await Streak.findById(id);
    if (!s) return response.status(404).json({ error: 'Streak not found' });
    if (String(s.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    await Streak.findByIdAndDelete(id);
    return response.status(200).json({ message: 'Streak deleted' });
  } catch (e) {
    console.error('deleteStreak error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
