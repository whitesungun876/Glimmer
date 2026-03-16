/**
 * 文生图：用 LLM 产出的 abstract_symbol_prompt 调用图像 API，得到今日萤火配图。
 * 优先使用阿里通义万相（DASHSCOPE_API_KEY，与千问同款）；可选 OpenAI DALL-E 3（OPENAI_API_KEY）。
 * 无配置或失败时返回 null，由调用方回退到 SVG 卡片。
 */

/**
 * 构建文生图用的 prompt（万相支持中英文，DALL-E 用英文）
 * @param {string} abstractSymbolPrompt - LLM 输出的意象描述
 * @param {string} [summarySentence] - 中文摘要，可选
 */
function buildImagePrompt(abstractSymbolPrompt, summarySentence) {
  const base = (abstractSymbolPrompt || 'minimalist soft glow, purple gradient, peaceful').trim();
  if (!summarySentence || summarySentence.length > 30) return base;
  return base;
}

/** 通义万相 API 基地址（与千问一致，按地域配置） */
function getDashScopeBase() {
  const raw = (process.env.DASHSCOPE_IMAGE_BASE_URL || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com').replace(/\/$/, '');
  // 若用户把 DASHSCOPE_BASE_URL 配成 OpenAI 兼容模式（.../compatible-mode/v1），这里需要回退到根域名
  return raw.replace(/\/compatible-mode\/v1$/, '');
}

/**
 * 阿里通义万相 2.6 文生图（异步创建任务 + 轮询，得到图片 URL 后下载为 data URL 持久化）
 * @param {string} prompt - 图像描述（中英文均可）
 * @returns {Promise<string|null>} data:image/png;base64,... 或 null
 */
async function generateWithDashScopeWan(prompt) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;
  const base = getDashScopeBase();
  const createUrl = `${base}/api/v1/services/aigc/image-generation/generation`;

  try {
    // 1. 创建异步任务（文生图：仅文本，enable_interleave=true）
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wan2.6-image',
        input: {
          messages: [
            {
              role: 'user',
              content: [{ text: prompt.slice(0, 2000) }],
            },
          ],
        },
        parameters: {
          enable_interleave: true,
          size: '1280*1280',
          watermark: false,
        },
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      console.error('dashscope wan create error', createRes.status, err);
      return null;
    }
    const createData = await createRes.json();
    const taskId = createData?.output?.task_id;
    if (!taskId) {
      console.error('dashscope wan no task_id', createData);
      return null;
    }

    // 2. 轮询任务结果（最多约 2 分钟）
    const taskUrl = `${base}/api/v1/tasks/${taskId}`;
    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const taskRes = await fetch(taskUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!taskRes.ok) continue;
      const taskData = await taskRes.json();
      const status = taskData?.output?.task_status;
      if (status === 'FAILED' || status === 'CANCELED') {
        console.error('dashscope wan task failed', status, taskData?.message);
        return null;
      }
      if (status === 'SUCCEEDED') {
        const choices = taskData?.output?.choices;
        const content = Array.isArray(choices)?.[0]?.message?.content;
        const imageItem = content?.find((c) => c?.type === 'image' && c?.image);
        const imageUrl = imageItem?.image;
        if (!imageUrl) return null;
        // 3. 下载图片并转为 data URL（避免 24h 过期）
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) return null;
        const buf = await imgRes.arrayBuffer();
        const b64 = Buffer.from(buf).toString('base64');
        return `data:image/png;base64,${b64}`;
      }
    }
    console.error('dashscope wan task timeout', taskId);
    return null;
  } catch (err) {
    console.error('dashscope wan', err);
    return null;
  }
}

/**
 * 调用 OpenAI DALL-E 3 生成图片，返回 data URL（base64）便于持久化
 * @param {string} prompt - 英文图像描述
 * @returns {Promise<string|null>} data:image/png;base64,... 或 null
 */
async function generateWithDallE3(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  if (!apiKey) return null;

  try {
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000),
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
        style: 'natural',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('dall-e-3 error', res.status, err);
      return null;
    }
    const data = await res.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) return null;
    return `data:image/png;base64,${b64}`;
  } catch (err) {
    console.error('dall-e-3', err);
    return null;
  }
}

/**
 * 根据 LLM 输出生成今日萤火配图（文生图）
 * 优先使用 DASHSCOPE_API_KEY（通义万相，与千问同一 Key）；否则使用 OPENAI_API_KEY（DALL-E 3）。
 * @param {object} llm - getDailySparkFromLLM 的返回值，含 abstract_symbol_prompt, summary_sentence
 * @returns {Promise<string|null>} 图片 data URL 或 null（失败时用 SVG 兜底）
 */
export async function generateDailySparkImageFromLLM(llm) {
  const prompt = buildImagePrompt(
    llm?.abstract_symbol_prompt,
    llm?.summary_sentence
  );

  // 优先阿里通义万相（与千问同用 DASHSCOPE_API_KEY）
  if (process.env.DASHSCOPE_API_KEY) {
    const dataUrl = await generateWithDashScopeWan(prompt);
    if (dataUrl) return dataUrl;
  }
  // 可选：OpenAI DALL-E 3
  if (process.env.OPENAI_API_KEY) {
    const dataUrl = await generateWithDallE3(prompt);
    if (dataUrl) return dataUrl;
  }

  return null;
}
