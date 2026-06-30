import GoogleFitData from "../models/GoogleFitData.js";

export async function createGoogleFitEntry(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { date, steps = 0, heartPoints = 0, sleepHours = 0, source, raw } = request.body;

    const entry = new GoogleFitData({ userId, date, steps, heartPoints, sleepHours, source, raw });
    await entry.save();

    return response.status(201).json(entry);
  } catch (e) {
    console.error('createGoogleFitEntry error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getGoogleFitEntries(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { from, to, limit = 100, skip = 0 } = request.query;
    const query = { userId };
    if (from || to) query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);

    const rows = await GoogleFitData.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip, 10))
      .limit(Math.min(1000, parseInt(limit, 10)));

    return response.status(200).json(rows);
  } catch (e) {
    console.error('getGoogleFitEntries error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getGoogleFitEntryById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await GoogleFitData.findById(id);
    if (!entry) return response.status(404).json({ error: 'Entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });
    return response.status(200).json(entry);
  } catch (e) {
    console.error('getGoogleFitEntryById error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateGoogleFitEntry(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await GoogleFitData.findById(id);
    if (!entry) return response.status(404).json({ error: 'Entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    const updatable = ['date','steps','heartPoints','sleepHours','source','raw'];
    updatable.forEach((k) => { if (request.body[k] !== undefined) entry[k] = request.body[k]; });

    await entry.save();
    return response.status(200).json(entry);
  } catch (e) {
    console.error('updateGoogleFitEntry error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteGoogleFitEntry(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await GoogleFitData.findById(id);
    if (!entry) return response.status(404).json({ error: 'Entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    await GoogleFitData.findByIdAndDelete(id);
    return response.status(200).json({ message: 'Entry deleted' });
  } catch (e) {
    console.error('deleteGoogleFitEntry error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
