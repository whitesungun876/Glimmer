import { Router } from 'express';
import {
  hasProjectedToday,
  createProjection,
  listPendingForRecipient,
  markSeen,
} from '../db/energyDb.js';

const router = Router();

/**
 * POST /api/energy/project
 * Body: { sender_id, recipient_id }
 * 当日仅可投射 1 次（1 枚 Glimmer_Core）
 */
router.post('/energy/project', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { sender_id: senderId, recipient_id: recipientId } = req.body || {};
  if (!senderId || !recipientId) {
    return res.status(400).json({ error: 'sender_id and recipient_id are required' });
  }
  try {
    const already = await hasProjectedToday(connectionString, senderId);
    if (already) {
      return res.status(400).json({ error: '今日已投射过，明日再来' });
    }
    const row = await createProjection(connectionString, senderId, recipientId);
    return res.status(201).json({ id: row.id, ok: true });
  } catch (err) {
    console.error('energy/project', err);
    return res.status(500).json({ error: 'Failed to project energy' });
  }
});

/**
 * GET /api/energy/pending?user_id=xxx
 * 被投射者拉取未读投射（下次打开 App 时展示特效用）
 */
router.get('/energy/pending', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const list = await listPendingForRecipient(connectionString, userId);
    return res.status(200).json({ projections: list });
  } catch (err) {
    console.error('energy/pending', err);
    return res.status(500).json({ error: 'Failed to list pending' });
  }
});

/**
 * POST /api/energy/seen
 * Body: { user_id, projection_ids: [uuid, ...] }
 * 标记为已读（看过特效后调用）
 */
router.post('/energy/seen', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { user_id: userId, projection_ids: projectionIds } = req.body || {};
  if (!userId || !Array.isArray(projectionIds) || projectionIds.length === 0) {
    return res.status(400).json({ error: 'user_id and projection_ids are required' });
  }
  try {
    await markSeen(connectionString, userId, projectionIds);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('energy/seen', err);
    return res.status(500).json({ error: 'Failed to mark seen' });
  }
});

export default router;
