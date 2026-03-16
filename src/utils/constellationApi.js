/**
 * 星座图 API：拉取 weekly_constellation（Phase 3），用于分享卡片等
 */

/**
 * 获取当前周周一 (YYYY-MM-DD)，按本地日期简单计算
 */
export function getCurrentWeekStart() {
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
 * GET /api/weekly_constellation?user_id=...&week_start=...
 * @param {string} apiBase - 如 process.env.REACT_APP_API_URL
 * @param {string} userId - 当前用户 ID
 * @param {string} [weekStart] - 可选，默认当前周周一
 * @returns {Promise<{ aggregated_json: object, viz_json: object | null } | null>}
 */
export async function fetchWeeklyConstellation(apiBase, userId, weekStart) {
  if (!apiBase || !userId) return null;
  const week = weekStart || getCurrentWeekStart();
  try {
    const res = await fetch(
      `${apiBase.replace(/\/$/, '')}/api/weekly_constellation?user_id=${encodeURIComponent(userId)}&week_start=${encodeURIComponent(week)}`
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/me/invite_code?user_id=xxx
 * @param {string} apiBase
 * @param {string} userId
 * @returns {Promise<string | null>}
 */
export async function fetchInviteCode(apiBase, userId) {
  if (!apiBase || !userId) return null;
  try {
    const res = await fetch(
      `${apiBase.replace(/\/$/, '')}/api/me/invite_code?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.invite_code ?? null;
  } catch {
    return null;
  }
}
