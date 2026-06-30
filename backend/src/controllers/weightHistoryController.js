import WeightHistory from "../models/WeightHistory.js";

function monthStringFromDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString('default', { month: 'long', year: 'numeric' });
  } catch (e) {
    return "";
  }
}

export async function addWeightEntry(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { weight, date = Date.now(), notes = '' } = request.body;
    if (weight === undefined || weight === null) return response.status(400).json({ error: 'weight is required' });

    const month = monthStringFromDate(date);

    const entry = new WeightHistory({ userId, weight, date, month, notes });
    await entry.save();
    return response.status(201).json(entry);
  } catch (e) {
    console.error('addWeightEntry error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getWeightHistory(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { limit = 100, skip = 0, from, to } = request.query;
    const query = { userId };
    if (from || to) query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);

    const entries = await WeightHistory.find(query)
      .sort({ date: -1 })
      .skip(parseInt(skip, 10))
      .limit(Math.min(1000, parseInt(limit, 10)));

    return response.status(200).json(entries);
  } catch (e) {
    console.error('getWeightHistory error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getWeightEntryById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await WeightHistory.findById(id);
    if (!entry) return response.status(404).json({ error: 'Weight entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });
    return response.status(200).json(entry);
  } catch (e) {
    console.error('getWeightEntryById error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateWeightEntry(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await WeightHistory.findById(id);
    if (!entry) return response.status(404).json({ error: 'Weight entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    const { weight, date, notes } = request.body;
    if (weight !== undefined) entry.weight = weight;
    if (date !== undefined) {
      entry.date = date;
      entry.month = monthStringFromDate(date);
    }
    if (notes !== undefined) entry.notes = notes;

    await entry.save();
    return response.status(200).json(entry);
  } catch (e) {
    console.error('updateWeightEntry error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteWeightEntry(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const entry = await WeightHistory.findById(id);
    if (!entry) return response.status(404).json({ error: 'Weight entry not found' });
    if (String(entry.userId) !== String(userId)) return response.status(403).json({ error: 'Forbidden' });

    await WeightHistory.findByIdAndDelete(id);
    return response.status(200).json({ message: 'Weight entry deleted' });
  } catch (e) {
    console.error('deleteWeightEntry error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
