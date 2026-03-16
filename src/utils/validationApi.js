/**
 * 天赋互证 API：拉取待验证请求、确认、跳过、拉取 strength_luminosity
 */

const API_BASE = process.env.REACT_APP_API_URL || '';

function base() {
  return API_BASE.replace(/\/$/, '');
}

/**
 * GET /api/validation_requests?user_id=xxx&status=PENDING
 */
export async function fetchPendingValidationRequests(userId) {
  if (!base() || !userId) return [];
  try {
    const res = await fetch(
      `${base()}/api/validation_requests?user_id=${encodeURIComponent(userId)}&status=PENDING`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.requests ?? [];
  } catch {
    return [];
  }
}

/**
 * POST /api/validation/confirm
 */
export async function confirmValidation(requestId) {
  if (!base() || !requestId) return false;
  try {
    const res = await fetch(`${base()}/api/validation/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/validation/skip
 */
export async function skipValidation(requestId) {
  if (!base() || !requestId) return false;
  try {
    const res = await fetch(`${base()}/api/validation/skip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * GET /api/me/strength_luminosity?user_id=xxx
 * 用于 A 进入图谱时展示“扩散光晕”
 */
export async function fetchStrengthLuminosity(userId) {
  if (!base() || !userId) return {};
  try {
    const res = await fetch(
      `${base()}/api/me/strength_luminosity?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return {};
    const data = await res.json();
    return data.strength_luminosity ?? {};
  } catch {
    return {};
  }
}
