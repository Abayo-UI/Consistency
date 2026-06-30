import AuditLog from "../models/AuditLog.js";

export async function getAuditLogs(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { entity, category, source, from, to, limit = 100, skip = 0, user } = request.query;

    const query = {};
    if (entity) query.entity = entity;
    if (category) query.category = category;
    if (source) query.source = source;
    if (user) query.userId = user;

    // Only allow users to view their own audit logs unless the audit has no userId (system events)
    query.$or = [{ userId }, { userId: { $exists: false } }, { userId: null }];

    if (from || to) query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);

    const rows = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip, 10))
      .limit(Math.min(1000, parseInt(limit, 10)));

    return response.status(200).json(rows);
  } catch (e) {
    console.error('getAuditLogs error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAuditLogById(request, response) {
  try {
    const userId = request.user && request.user._id;
    if (!userId) return response.status(401).json({ error: 'Unauthorized' });

    const { id } = request.params;
    const row = await AuditLog.findById(id);
    if (!row) return response.status(404).json({ error: 'Audit log not found' });

    // Allow viewing if entry belongs to the user, or is system-level (no userId)
    if (row.userId && String(row.userId) !== String(userId)) {
      return response.status(403).json({ error: 'Forbidden' });
    }

    return response.status(200).json(row);
  } catch (e) {
    console.error('getAuditLogById error:', e);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
