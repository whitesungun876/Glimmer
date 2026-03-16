import { getPool } from './inviteDb.js';

/**
 * 获取用户 A 的好友 ID 列表（relationships 中 user_id=A 或 friend_id=A）
 */
export async function getFriendIds(connectionString, userId) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT friend_id AS id FROM relationships WHERE user_id = $1
     UNION
     SELECT user_id AS id FROM relationships WHERE friend_id = $1`,
    [userId]
  );
  return res.rows.map((r) => r.id);
}

/**
 * 为 A 的每位好友创建一条 PENDING 验证请求（Top 1 天赋）
 * 由周报生成侧调用，传入 target_strength（如 Empathy）
 */
export async function createValidationRequests(connectionString, params) {
  const { requesterId, weekStart, targetStrength, requesterDisplayName } = params;
  const friendIds = await getFriendIds(connectionString, requesterId);
  if (friendIds.length === 0) return [];
  const db = getPool(connectionString);
  const inserted = [];
  for (const validatorId of friendIds) {
    const res = await db.query(
      `INSERT INTO validation_requests (requester_id, validator_id, week_start, target_strength, requester_display_name, status)
       VALUES ($1, $2, $3::date, $4, $5, 'PENDING')
       ON CONFLICT (requester_id, validator_id, week_start, target_strength) DO NOTHING
       RETURNING id, requester_id, validator_id, week_start, target_strength, requester_display_name, status, created_at`,
      [requesterId, validatorId, weekStart, targetStrength, requesterDisplayName ?? null]
    );
    if (res.rows[0]) inserted.push(res.rows[0]);
  }
  return inserted;
}

/** 表无 unique(requester_id, validator_id, week_start, target_strength)，用 ON CONFLICT DO NOTHING 避免重复；若需唯一可加约束 */
export async function listPendingForValidator(connectionString, validatorId) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT id, requester_id, validator_id, week_start, target_strength, requester_display_name, created_at
     FROM validation_requests
     WHERE validator_id = $1 AND status = 'PENDING'
     ORDER BY created_at ASC`,
    [validatorId]
  );
  return res.rows;
}

export async function getRequestById(connectionString, requestId) {
  const db = getPool(connectionString);
  const res = await db.query(
    'SELECT id, requester_id, validator_id, week_start, target_strength, requester_display_name, status FROM validation_requests WHERE id = $1',
    [requestId]
  );
  return res.rows[0] ?? null;
}

export async function setRequestStatus(connectionString, requestId, status) {
  const db = getPool(connectionString);
  await db.query(
    'UPDATE validation_requests SET status = $1 WHERE id = $2',
    [status, requestId]
  );
}

/**
 * 将 A 的某天赋 luminosity +1
 */
export async function incrementStrengthLuminosity(connectionString, userId, strengthTag) {
  const db = getPool(connectionString);
  await db.query(
    `INSERT INTO user_strength_luminosity (user_id, strength_tag, luminosity, updated_at)
     VALUES ($1, $2, 1, now())
     ON CONFLICT (user_id, strength_tag)
     DO UPDATE SET luminosity = user_strength_luminosity.luminosity + 1, updated_at = now()`,
    [userId, strengthTag]
  );
}

/**
 * 获取用户各天赋的 luminosity
 */
export async function getStrengthLuminosity(connectionString, userId) {
  const db = getPool(connectionString);
  const res = await db.query(
    'SELECT strength_tag, luminosity FROM user_strength_luminosity WHERE user_id = $1',
    [userId]
  );
  return Object.fromEntries(res.rows.map((r) => [r.strength_tag, r.luminosity]));
}
