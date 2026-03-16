/**
 * Daily Spark: call LLM for 4 fields (core_trait, mood_color_hex, summary_sentence, abstract_symbol_prompt).
 * 基于积极心理学 VIA 人格力量、马斯洛需求层次，输出专业洞察。
 * Uses OpenAI-compatible API (OPENAI_API_KEY, optional OPENAI_BASE_URL).
 */

// 升级版词库：VIA 24 种人格力量（塞利格曼），按六维度精选拾光语境
const GLIMMER_LEXICON = [
  '好奇心', '洞察力', '开明', '远见',           // 智慧 Wisdom
  '坚毅', '真实', '勇敢', '活力',               // 勇气 Courage
  '共情力', '友善', '爱与被爱',                  // 仁爱 Humanity
  '团队协作', '公正', '领导力',                 // 公正 Justice
  '宽恕', '谦逊', '自我调节',                   // 节制 Temperance
  '审美', '感恩', '希望', '幽默',               // 超越 Transcendence
];

const SYSTEM_PROMPT = `你是一位资深积极心理学导师，擅长从平凡的日记中发现个体的「人格力量」(Character Strengths)。
你的任务是根据用户的记录，完成一次「微光发现」。

分析逻辑：
1. 底层理论：参考 VIA 人格力量量表和马斯洛需求层次，识别用户行为背后的积极动机。
2. 视角：不要只看负面情绪，要寻找用户在叙述中展现出的韧性、审美或自我觉察。

输出要求（严格 JSON，不要 markdown 包裹）：
- core_trait: 从词库选择最匹配的一个。若都不匹配，请基于积极心理学自拟一个四字以内的词。
- mood_color_hex: 根据情绪心理学匹配色彩（如：感恩-淡粉色，宁静-湖水绿，勇气-落日橘），六位十六进制 #RRGGBB。
- summary_sentence: 采用「肯定式提问」或「赋能式回应」。避免空洞，要关联用户文本中的具体行为。最多 20 个中文字符。
- abstract_symbol_prompt: 描述一个能体现该心理学特质的意象，要求：minimalist, artistic, high-end photography style，英文短句。

词库：${GLIMMER_LEXICON.join('、')}。`;

function buildUserPrompt(sourceText) {
  return `用户的日记文本：\n${sourceText}\n\n请输出一个 JSON 对象，包含 core_trait、mood_color_hex、summary_sentence、abstract_symbol_prompt。`;
}

const FALLBACK = {
  core_trait: '感恩',
  mood_color_hex: '#BA94FF',
  summary_sentence: '今天的你，值得被看见。',
  abstract_symbol_prompt: 'minimalist soft glow symbol, purple gradient background',
};

/** 当 API 未返回 json_object 时的兜底解析（正则提取 JSON） */
function parseJsonFromResponse(text) {
  const stripped = text.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

export async function getDailySparkFromLLM(sourceText) {
  const openAiKey = process.env.OPENAI_API_KEY;
  const dashScopeKey = process.env.DASHSCOPE_API_KEY;
  const apiKey = openAiKey || dashScopeKey;
  // DashScope 兼容模式的 baseUrl 默认应包含 /compatible-mode/v1
  const defaultDashScopeBase = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const baseUrl = (
    process.env.OPENAI_BASE_URL
    || process.env.DASHSCOPE_BASE_URL
    || (dashScopeKey && !openAiKey ? defaultDashScopeBase : 'https://api.openai.com/v1')
  ).replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || process.env.DASHSCOPE_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return { ...FALLBACK };
  }

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(sourceText) },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('daily_spark LLM error', res.status, err);
      return { ...FALLBACK };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '';
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = parseJsonFromResponse(content);
    }
    if (!parsed) return { ...FALLBACK };
    return {
      core_trait: parsed.core_trait || FALLBACK.core_trait,
      mood_color_hex: parsed.mood_color_hex || FALLBACK.mood_color_hex,
      summary_sentence: (parsed.summary_sentence || FALLBACK.summary_sentence).slice(0, 20),
      abstract_symbol_prompt: parsed.abstract_symbol_prompt || FALLBACK.abstract_symbol_prompt,
    };
  } catch (err) {
    console.error('daily_spark LLM', err);
    return { ...FALLBACK };
  }
}
