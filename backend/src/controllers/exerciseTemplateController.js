import ExerciseTemplate from "../models/ExerciseTemplate.js";

export async function getMyTemplate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const tpl = await ExerciseTemplate.findOne({ userId });
    if (!tpl) return response.status(200).json({ items: [] });
    return response.status(200).json(tpl);
  } catch (e) {
    console.error('getMyTemplate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function upsertMyTemplate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { items } = request.body;
    if (!Array.isArray(items)) return response.status(400).json({ error: 'items array required' });

    // normalize items: preserve custom sets/reps while ensuring name is present
    const normalized = items.map((it, idx) => ({
      name: String(it.name || '').trim(),
      sets: it.sets !== undefined && it.sets !== null ? Number(it.sets) : 3,
      reps: it.reps !== undefined && it.reps !== null ? Number(it.reps) : 10,
      defaultChecked: !!it.defaultChecked,
      order: (it.order !== undefined ? it.order : idx),
    }));

    let tpl = await ExerciseTemplate.findOne({ userId });
    if (tpl) {
      tpl.items = normalized;
      await tpl.save();
    } else {
      tpl = new ExerciseTemplate({ userId, items: normalized });
      await tpl.save();
    }

    return response.status(200).json(tpl);
  } catch (e) {
    console.error('upsertMyTemplate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteMyTemplate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    await ExerciseTemplate.findOneAndDelete({ userId });
    return response.status(200).json({ message: 'Template deleted' });
  } catch (e) {
    console.error('deleteMyTemplate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function createDefaultTemplate(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const defaultItems = [
      'rope skipping',
      'wall angles',
      'squats',
      'chin tucks',
      'thoracic extensions',
      'glutes bridge',
      'posterior reset drill',
      'butterfly kegels',
    ].map((name, idx) => ({ name, sets: 3, reps: 10, defaultChecked: false, order: idx }));

    let tpl = await ExerciseTemplate.findOne({ userId });
    if (tpl) {
      tpl.items = defaultItems;
      await tpl.save();
    } else {
      tpl = new ExerciseTemplate({ userId, items: defaultItems });
      await tpl.save();
    }

    return response.status(200).json(tpl);
  } catch (e) {
    console.error('createDefaultTemplate error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
