import { Router } from 'express';
import {
  createValidationRequests,
  listPendingForValidator,
  getRequestById,
  setRequestStatus,
  incrementStrengthLuminosity,
  getStrengthLuminosity,
} from '../db/validationDb.js';

const router = Router();

/**
 * POST /api/validation_requests
 * Body: { requester_id, week_start, target_strength, requester_display_name? }
 * 当 A 的周报生成后由 Phase 2 或 cron 调用，为 A 的每位好友创建一条 PENDING 请求
 */
router.post('/validation_requests', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { requester_id: requesterId, week_start: weekStart, target_strength: targetStrength, requester_display_name: requesterDisplayName } = req.body || {};
  if (!requesterId || !weekStart || !targetStrength) {
    return res.status(400).json({ error: 'requester_id, week_start, target_strength are required' });
  }
  try {
    const rows = await createValidationRequests(connectionString, {
      requesterId,
      weekStart,
      targetStrength,
      requesterDisplayName,
    });
    return res.status(200).json({ created: rows.length, requests: rows });
  } catch (err) {
    console.error('validation_requests create', err);
    return res.status(500).json({ error: 'Failed to create validation requests' });
  }
});

/**
 * GET /api/validation_requests?user_id=xxx&status=PENDING
 * 好友 B 拉取待处理的验证请求（validator_id = user_id）
 */
router.get('/validation_requests', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const userId = req.query.user_id;
  const status = req.query.status || 'PENDING';
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (status !== 'PENDING') {
    return res.status(200).json({ requests: [] });
  }
  try {
    const requests = await listPendingForValidator(connectionString, userId);
    return res.status(200).json({ requests });
  } catch (err) {
    console.error('validation_requests list', err);
    return res.status(500).json({ error: 'Failed to list validation requests' });
  }
});

/**
 * POST /api/validation/confirm
 * Body: { request_id }
 * 好友 B 点击“确实如此”，将 A 的该天赋 luminosity +1
 */
router.post('/validation/confirm', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { request_id: requestId } = req.body || {};
  if (!requestId) {
    return res.status(400).json({ error: 'request_id is required' });
  }
  try {
    const row = await getRequestById(connectionString, requestId);
    if (!row || row.status !== 'PENDING') {
      return res.status(404).json({ error: 'Request not found or already handled' });
    }
    await setRequestStatus(connectionString, requestId, 'CONFIRMED');
    await incrementStrengthLuminosity(connectionString, row.requester_id, row.target_strength);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('validation/confirm', err);
    return res.status(500).json({ error: 'Failed to confirm' });
  }
});

/**
 * POST /api/validation/skip
 * Body: { request_id }
 */
router.post('/validation/skip', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { request_id: requestId } = req.body || {};
  if (!requestId) {
    return res.status(400).json({ error: 'request_id is required' });
  }
  try {
    const row = await getRequestById(connectionString, requestId);
    if (!row || row.status !== 'PENDING') {
      return res.status(404).json({ error: 'Request not found or already handled' });
    }
    await setRequestStatus(connectionString, requestId, 'SKIPPED');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('validation/skip', err);
    return res.status(500).json({ error: 'Failed to skip' });
  }
});

/**
 * GET /api/me/strength_luminosity?user_id=xxx
 * 用户 A 进入图谱时拉取各天赋的 luminosity，用于“扩散光晕”展示
 */
router.get('/me/strength_luminosity', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const userId = req.query.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  try {
    const luminosity = await getStrengthLuminosity(connectionString, userId);
    return res.status(200).json({ strength_luminosity: luminosity });
  } catch (err) {
    console.error('me/strength_luminosity', err);
    return res.status(500).json({ error: 'Failed to get strength luminosity' });
  }
});

export default router;
