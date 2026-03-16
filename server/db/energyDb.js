import { getPool } from './inviteDb.js';

/**
 * 检查 sender 今日是否已投射过（每人每日 1 枚 Glimmer_Core）
 */
export async function hasProjectedToday(connectionString, senderId) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT 1 FROM energy_projections
     WHERE sender_id = $1
     AND (created_at AT TIME ZONE 'Asia/Singapore')::date = (now() AT TIME ZONE 'Asia/Singapore')::date
     LIMIT 1`,
    [senderId]
  );
  return res.rows.length > 0;
}

/**
 * 创建一条能量投射记录
 */
export async function createProjection(connectionString, senderId, recipientId) {
  const db = getPool(connectionString);
  const res = await db.query(
    `INSERT INTO energy_projections (sender_id, recipient_id)
     VALUES ($1, $2)
     RETURNING id, sender_id, recipient_id, created_at`,
    [senderId, recipientId]
  );
  return res.rows[0];
}

/**
 * 获取被投射者未读的投射列表（用于下次打开 App 时展示特效）
 */
export async function listPendingForRecipient(connectionString, recipientId) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT id, sender_id, recipient_id, created_at
     FROM energy_projections
     WHERE recipient_id = $1 AND seen_at IS NULL
     ORDER BY created_at ASC`,
    [recipientId]
  );
  return res.rows;
}

/**
 * 标记为已读（被投射者看过特效后调用）
 */
export async function markSeen(connectionString, recipientId, projectionIds) {
  if (!projectionIds || projectionIds.length === 0) return;
  const db = getPool(connectionString);
  await db.query(
    `UPDATE energy_projections SET seen_at = now()
     WHERE recipient_id = $1 AND id = ANY($2::uuid[])`,
    [recipientId, projectionIds]
  );
}
