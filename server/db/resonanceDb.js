import { getPool } from './inviteDb.js';
import { getFriendIds } from './validationDb.js';

/**
 * 获取用户某周的 weekly_report（aggregated_json + viz_json）
 */
export async function getWeeklyReport(connectionString, userId, weekStart) {
  const db = getPool(connectionString);
  const res = await db.query(
    'SELECT aggregated_json, viz_json FROM weekly_report WHERE user_id = $1 AND week_start = $2::date',
    [userId, weekStart]
  );
  return res.rows[0] ?? null;
}

/**
 * 从 top_tags 中提取某类别的 tag 名集合（排除 Other）
 */
function tagNames(topTags, category) {
  const arr = topTags?.[category] ?? [];
  return [...new Set(arr.map((t) => t.tag).filter((t) => t && t !== 'Other'))];
}

/**
 * 共鸣文案模板：本周你们在[维度]的「标签」上产生了共鸣。
 * 维度：价值 / 兴趣 / 优势
 */
const DIMENSION_NAMES = { values: '价值', interests: '兴趣', strengths: '优势' };
const VALUE_DISPLAY = { Growth: '成长', Connection: '连接', Freedom: '自由', Stability: '稳定', Health: '健康', Contribution: '贡献', Achievement: '成就', Beauty: '美', Honesty: '诚实' };
const INTEREST_DISPLAY = { Nature: '自然', Art: '艺术', Tech: '科技', Cooking: '烹饪', Sports: '运动', Reading: '阅读', Social: '社交', Work: '工作', Mind: '心智' };
const STRENGTH_DISPLAY = { Empathy: '共情力', Logic: '逻辑力', Observation: '观察力', Discipline: '自律', Creativity: '创造力', Communication: '沟通力', Resilience: '韧性', Focus: '专注力', Kindness: '善意' };

function tagToDisplay(category, tag) {
  if (category === 'values') return VALUE_DISPLAY[tag] ?? tag;
  if (category === 'interests') return INTEREST_DISPLAY[tag] ?? tag;
  if (category === 'strengths') return STRENGTH_DISPLAY[tag] ?? tag;
  return tag;
}

function buildResonanceMessage(resonance) {
  const order = ['values', 'interests', 'strengths'];
  for (const cat of order) {
    const tags = resonance[cat];
    if (tags && tags.length > 0) {
      const dim = DIMENSION_NAMES[cat];
      const tag = tags[0];
      const name = tagToDisplay(cat, tag);
      return `本周你们在「${dim}」维度的「${name}」上产生了共鸣。`;
    }
  }
  return '本周你们各自记录了微光，下次也许会有更多共鸣。';
}

/**
 * 双人共鸣：获取两人同周的 weekly_report，对比 value_tags / passion_points（top_tags.values / top_tags.interests）
 * 返回共鸣标签 + 共鸣文案 + 两人 viz_json
 */
export async function getSharedResonance(connectionString, userIdA, userIdB, weekStart) {
  const [reportA, reportB] = await Promise.all([
    getWeeklyReport(connectionString, userIdA, weekStart),
    getWeeklyReport(connectionString, userIdB, weekStart),
  ]);

  const topA = reportA?.aggregated_json?.top_tags ?? {};
  const topB = reportB?.aggregated_json?.top_tags ?? {};
  const setA = { values: new Set(tagNames(topA, 'values')), interests: new Set(tagNames(topA, 'interests')), strengths: new Set(tagNames(topA, 'strengths')) };
  const setB = { values: new Set(tagNames(topB, 'values')), interests: new Set(tagNames(topB, 'interests')), strengths: new Set(tagNames(topB, 'strengths')) };

  const resonance = {
    values: [...setA.values].filter((t) => setB.values.has(t)),
    interests: [...setA.interests].filter((t) => setB.interests.has(t)),
    strengths: [...setA.strengths].filter((t) => setB.strengths.has(t)),
  };

  const resonance_message = buildResonanceMessage(resonance);

  const weekEnd = reportA?.aggregated_json?.week_end ?? reportB?.aggregated_json?.week_end ?? weekStart;

  return {
    week_start: weekStart,
    week_end: weekEnd,
    user_a: {
      top_tags: topA,
      viz_json: reportA?.viz_json ?? null,
    },
    user_b: {
      top_tags: topB,
      viz_json: reportB?.viz_json ?? null,
    },
    resonance,
    resonance_message,
  };
}

/**
 * 好友列表：与当前用户互为 user_id/friend_id 的用户 ID
 */
export async function getFriends(connectionString, userId) {
  return getFriendIds(connectionString, userId);
}
