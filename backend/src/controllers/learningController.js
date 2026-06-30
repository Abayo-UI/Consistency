import Learning from "../models/Learning.js";

export async function createLearning(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { type, title, description, date, notes, durationMinutes, resources, tags, source } = request.body;

    if (!type || !['knowledge','upskilling'].includes(type)) {
      return response.status(400).json({ error: 'type is required and must be "knowledge" or "upskilling"' });
    }
    if (!title) return response.status(400).json({ error: 'title is required' });

    const entry = new Learning({ userId, type, title, description, date, notes, durationMinutes, resources, tags, source });
    await entry.save();

    return response.status(201).json(entry);
  } catch (e) {
    console.error('createLearning error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLearnings(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { type, from, to, search, tags, limit = 100, skip = 0 } = request.query;
    const query = { userId };
    if (type) query.type = type;
    if (from || to) query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : tags.split(',') };

    if (search) {
      const re = new RegExp(search, 'i');
      query.$or = [ { title: re }, { description: re }, { notes: re } ];
    }

    const rows = await Learning.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip, 10))
      .limit(Math.min(1000, parseInt(limit, 10)));

    return response.status(200).json(rows);
  } catch (e) {
    console.error('getLearnings error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLearningById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await Learning.findById(id);
    if (!entry) return response.status(404).json({ error: 'Learning entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });
    return response.status(200).json(entry);
  } catch (e) {
    console.error('getLearningById error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateLearning(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await Learning.findById(id);
    if (!entry) return response.status(404).json({ error: 'Learning entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    const updatable = ['type','title','description','date','notes','durationMinutes','resources','tags','source'];
    updatable.forEach((key) => {
      if (request.body[key] !== undefined) entry[key] = request.body[key];
    });

    await entry.save();
    return response.status(200).json(entry);
  } catch (e) {
    console.error('updateLearning error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteLearning(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await Learning.findById(id);
    if (!entry) return response.status(404).json({ error: 'Learning entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    await Learning.findByIdAndDelete(id);
    return response.status(200).json({ message: 'Learning entry deleted' });
  } catch (e) {
    console.error('deleteLearning error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
