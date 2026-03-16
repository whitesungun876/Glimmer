import pg from 'pg';
const { Pool } = pg;

let pool = null;

export function getPool(connectionString) {
  if (!connectionString) throw new Error('DATABASE_URL is required');
  if (!pool) pool = new Pool({ connectionString });
  return pool;
}

/**
 * 根据 invite_code 查 user_id
 */
export async function getUserIdByInviteCode(connectionString, inviteCode) {
  const db = getPool(connectionString);
  const res = await db.query(
    'SELECT id FROM users WHERE invite_code = $1',
    [inviteCode]
  );
  return res.rows[0]?.id ?? null;
}

/**
 * 创建 PENDING 关系
 */
export async function createRelationship(connectionString, userId, friendId) {
  const db = getPool(connectionString);
  await db.query(
    `INSERT INTO relationships (user_id, friend_id, status)
     VALUES ($1, $2, 'PENDING')
     ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'PENDING', created_at = now()`,
    [userId, friendId]
  );
}

/**
 * 获取或生成用户的 invite_code；若用户不存在则先插入
 */
export async function getOrCreateInviteCode(connectionString, userId) {
  const db = getPool(connectionString);
  const existing = await db.query(
    'SELECT invite_code FROM users WHERE id = $1',
    [userId]
  );
  if (existing.rows[0]) return existing.rows[0].invite_code;
  const code = Math.random().toString(36).slice(2, 10);
  await db.query(
    `INSERT INTO users (id, invite_code) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET invite_code = EXCLUDED.invite_code`,
    [userId, code]
  );
  return code;
}
