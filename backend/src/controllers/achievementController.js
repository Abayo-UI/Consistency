import Achievement from "../models/Achievement.js";

export async function createAchievement(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { name, description, isUnlocked, unlockedAt, value, metadata } = request.body;
    if (!name) return response.status(400).json({ error: 'name is required' });

    const ach = new Achievement({ userId, name, description, isUnlocked: !!isUnlocked, unlockedAt: isUnlocked ? (unlockedAt || new Date()) : null, value, metadata });
    await ach.save();
    return response.status(201).json(ach);
  } catch (e) {
    console.error('createAchievement error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAchievements(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { unlocked, limit = 100, skip = 0 } = request.query;
    const query = { userId };
    if (unlocked !== undefined) query.isUnlocked = unlocked === 'true' || unlocked === '1';

    const rows = await Achievement.find(query)
      .sort({ unlockedAt: -1, createdAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(Math.min(1000, parseInt(limit, 10)));

    return response.status(200).json(rows);
  } catch (e) {
    console.error('getAchievements error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAchievementById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const ach = await Achievement.findById(id);
    if (!ach) return response.status(404).json({ error: 'Achievement not found' });
    if (String(ach.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });
    return response.status(200).json(ach);
  } catch (e) {
    console.error('getAchievementById error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateAchievement(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const ach = await Achievement.findById(id);
    if (!ach) return response.status(404).json({ error: 'Achievement not found' });
    if (String(ach.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    const updatable = ['name','description','isUnlocked','unlockedAt','value','metadata'];
    updatable.forEach((k) => {
      if (request.body[k] !== undefined) ach[k] = request.body[k];
    });

    if (ach.isUnlocked && !ach.unlockedAt) ach.unlockedAt = new Date();

    await ach.save();
    return response.status(200).json(ach);
  } catch (e) {
    console.error('updateAchievement error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteAchievement(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const ach = await Achievement.findById(id);
    if (!ach) return response.status(404).json({ error: 'Achievement not found' });
    if (String(ach.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    await Achievement.findByIdAndDelete(id);
    return response.status(200).json({ message: 'Achievement deleted' });
  } catch (e) {
    console.error('deleteAchievement error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
