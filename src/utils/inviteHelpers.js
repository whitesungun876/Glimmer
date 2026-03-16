/**
 * 邀请系统：动态链接解析、待绑定邀请码、用户 ID
 * - 从 URL 解析 invite_code，注册成功后创建 PENDING 关系
 */

const PENDING_INVITE_KEY = 'glimmer_pending_invite_code';
const USER_ID_KEY = 'glimmer_user_id';
const INVITE_CODE_KEY = 'glimmer_invite_code';

/**
 * 从当前 URL 解析 invite_code（支持 query 与 hash）
 * 例如: ?invite_code=abc123 或 #invite_code=abc123
 */
export function getInviteCodeFromUrl() {
  const href = typeof window !== 'undefined' ? window.location.href : '';
  const url = new URL(href, href.startsWith('http') ? undefined : 'https://example.com');
  const fromQuery = url.searchParams.get('invite_code');
  if (fromQuery) return fromQuery.trim() || null;
  const hash = url.hash.slice(1);
  const fromHash = new URLSearchParams(hash).get('invite_code');
  return (fromHash && fromHash.trim()) || null;
}

export function setPendingInviteCode(code) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PENDING_INVITE_KEY, String(code));
}

export function getPendingInviteCode() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(PENDING_INVITE_KEY);
}

export function clearPendingInviteCode() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PENDING_INVITE_KEY);
}

/**
 * 获取或生成当前设备用户 ID（用于关系表中的 friend_id / user_id）
 * 后端接入后可由服务端分配并覆盖
 */
export function getOrCreateUserId() {
  if (typeof localStorage === 'undefined') return null;
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = 'local_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

/**
 * 获取或生成当前用户的邀请码（用于分享卡片二维码）
 * 后端接入后可由 GET /api/me/invite_code 覆盖
 */
export function getOrCreateInviteCode() {
  if (typeof localStorage === 'undefined') return null;
  let code = localStorage.getItem(INVITE_CODE_KEY);
  if (!code) {
    code = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(INVITE_CODE_KEY, code);
  }
  return code;
}

/**
 * 构建带邀请码的下载/分享链接（App 下载页或 Universal Link）
 */
export function buildInviteLink(inviteCode, baseUrl) {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const path = '/invite';
  return `${base}${path}?invite_code=${encodeURIComponent(inviteCode)}`;
}

/**
 * 注册完成后：若存在待绑定邀请码，调用后端创建 PENDING 关系
 * 返回是否已提交绑定（成功或失败由后端响应决定）
 */
export async function acceptInviteAfterRegister(userId, apiBaseUrl) {
  const code = getPendingInviteCode();
  if (!code || !userId) return false;
  const base = apiBaseUrl || '';
  try {
    const res = await fetch(`${base}/api/invite/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: code, new_user_id: userId }),
    });
    if (res.ok) clearPendingInviteCode();
    return res.ok;
  } catch {
    return false;
  }
}
