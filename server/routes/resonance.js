import { Router } from 'express';
import { getSharedResonance, getFriends } from '../db/resonanceDb.js';

const router = Router();

/**
 * 获取当前周周一 (YYYY-MM-DD)
 */
function getCurrentWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * GET /api/shared_resonance?user_id_a=xxx&user_id_b=yyy&week_start=zzz
 * 双人共鸣：两人同周 top_tags 交集 + 共鸣文案 + 两人 viz_json
 */
router.get('/shared_resonance', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const userIdA = req.query.user_id_a;
  const userIdB = req.query.user_id_b;
  const weekStart = req.query.week_start || getCurrentWeekStart();
  if (!userIdA || !userIdB) {
    return res.status(400).json({ error: 'user_id_a and user_id_b are required' });
  }
  try {
    const data = await getSharedResonance(connectionString, userIdA, userIdB, weekStart);
    return res.status(200).json(data);
  } catch (err) {
    console.error('shared_resonance', err);
    return res.status(500).json({ error: 'Failed to get shared resonance' });
  }
});

/**
 * GET /api/me/friends?user_id=xxx
 * 好友列表：与当前用户互为 user_id/friend_id 的用户 ID
 */
router.get('/me/friends', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const friendIds = await getFriends(connectionString, userId);
    return res.status(200).json({ friends: friendIds });
  } catch (err) {
    console.error('me/friends', err);
    return res.status(500).json({ error: 'Failed to get friends' });
  }
});

export default router;
