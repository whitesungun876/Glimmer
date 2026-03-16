/**
 * Phase 1 STRENGTHS 枚举 → 展示用中文名（天赋互证等）
 */
export const STRENGTH_DISPLAY = {
  Empathy: '共情力',
  Logic: '逻辑力',
  Observation: '观察力',
  Discipline: '自律',
  Creativity: '创造力',
  Communication: '沟通力',
  Resilience: '韧性',
  Focus: '专注力',
  Kindness: '善意',
  Other: '其他',
};

export function strengthToDisplay(tag) {
  return STRENGTH_DISPLAY[tag] ?? tag ?? '其他';
}
