/**
 * 每日能量投射 API：投射、拉取待接收、标记已读
 */

const API_BASE = process.env.REACT_APP_API_URL || '';

function base() {
  return API_BASE.replace(/\/$/, '');
}

/**
 * POST /api/energy/project
 * 当日仅可投射 1 次
 */
export async function projectEnergy(senderId, recipientId) {
  if (!base() || !senderId || !recipientId) return false;
  try {
    const res = await fetch(`${base()}/api/energy/project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender_id: senderId, recipient_id: recipientId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/energy/pending?user_id=xxx
 */
export async function fetchPendingEnergy(userId) {
  if (!base() || !userId) return [];
  try {
    const res = await fetch(
      `${base()}/api/energy/pending?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.projections ?? [];
  } catch {
    return [];
  }
}

/**
 * POST /api/energy/seen
 */
export async function markEnergySeen(userId, projectionIds) {
  if (!base() || !userId || !projectionIds?.length) return false;
  try {
    const res = await fetch(`${base()}/api/energy/seen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, projection_ids: projectionIds }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
