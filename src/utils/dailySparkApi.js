/**
 * Daily Spark API: 生成、获取、点亮
 */

const API_BASE = process.env.REACT_APP_API_URL || '';

function base() {
  return API_BASE.replace(/\/$/, '');
}

/**
 * POST /api/daily_spark/generate
 * @param {object} payload - { user_id, entry_type, source_text, user_name? }
 * @returns {Promise<{ id, daily_spark_image_url, core_trait, mood_color_hex, summary_sentence, daily_spark_luminosity_count } | null>}
 */
export async function generateDailySpark(payload) {
  if (!base() || !payload?.user_id || !payload?.entry_type || !payload?.source_text) return null;
  try {
    const res = await fetch(`${base()}/api/daily_spark/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: payload.user_id,
        entry_type: payload.entry_type,
        source_text: payload.source_text,
        user_name: payload.user_name ?? undefined,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/daily_spark/:id
 */
export async function fetchDailySparkById(sparkId) {
  if (!base() || !sparkId) return null;
  try {
    const res = await fetch(`${base()}/api/daily_spark/${sparkId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * GET /api/daily_spark?user_id=&entry_date=&entry_type=
 */
export async function fetchDailySparkByUserAndDate(userId, entryDate, entryType) {
  if (!base() || !userId || !entryDate || !entryType) return null;
  try {
    const params = new URLSearchParams({ user_id: userId, entry_date: entryDate, entry_type: entryType });
    const res = await fetch(`${base()}/api/daily_spark?${params}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * POST /api/daily_spark/light_up
 */
export async function lightUpSpark(sparkId) {
  if (!base() || !sparkId) return false;
  try {
    const res = await fetch(`${base()}/api/daily_spark/light_up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spark_id: sparkId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
