import { Router } from 'express';
import {
  getUserIdByInviteCode,
  createRelationship,
  getOrCreateInviteCode,
} from '../db/inviteDb.js';

const router = Router();

/**
 * POST /api/invite/accept
 * Body: { invite_code: string, new_user_id: string }
 * 根据 invite_code 查出 inviter，插入 PENDING 关系
 */
router.post('/invite/accept', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { invite_code: inviteCode, new_user_id: newUserId } = req.body || {};
  if (!inviteCode || !newUserId) {
    return res.status(400).json({ error: 'invite_code and new_user_id are required' });
  }
  try {
    const inviterId = await getUserIdByInviteCode(connectionString, inviteCode);
    if (!inviterId) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }
    await createRelationship(connectionString, inviterId, newUserId);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('invite/accept', err);
    return res.status(500).json({ error: 'Failed to accept invite' });
  }
});

/**
 * GET /api/me/invite_code?user_id=xxx
 * 为当前用户返回或生成 invite_code
 */
router.get('/me/invite_code', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const code = await getOrCreateInviteCode(connectionString, userId);
    return res.status(200).json({ invite_code: code });
  } catch (err) {
    console.error('me/invite_code', err);
    return res.status(500).json({ error: 'Failed to get invite code' });
  }
});

export default router;
