/**
 * 双人星轨 / 共鸣 API：拉取 shared_resonance、好友列表
 */

const API_BASE = process.env.REACT_APP_API_URL || '';

function base() {
  return API_BASE.replace(/\/$/, '');
}

/**
 * GET /api/shared_resonance?user_id_a=xxx&user_id_b=yyy&week_start=zzz
 */
export async function fetchSharedResonance(userIdA, userIdB, weekStart) {
  if (!base() || !userIdA || !userIdB) return null;
  try {
    const params = new URLSearchParams({
      user_id_a: userIdA,
      user_id_b: userIdB,
    });
    if (weekStart) params.set('week_start', weekStart);
    const res = await fetch(`${base()}/api/shared_resonance?${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/me/friends?user_id=xxx
 */
export async function fetchFriends(userId) {
  if (!base() || !userId) return [];
  try {
    const res = await fetch(
      `${base()}/api/me/friends?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.friends ?? [];
  } catch {
    return [];
  }
}
