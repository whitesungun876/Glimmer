/**
 * 通义千问 AI 处理
 * 文本美化、结构化提炼、情感分析
 */

import axios from 'axios';

const DASHSCOPE_API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY;
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

/**
 * 系统提示词模板
 */
const SYSTEM_PROMPTS = {
  grateful: `你是一个温柔的心理日记助手。
任务：将用户的感激内容提炼为简洁优美的文字。
要求：
1. 保留情感温度
2. 移除口语化表达（嗯、啊、呃、那个、就是）
3. 控制在30字以内
4. 保持第一人称视角
5. 用"感激..."或"感恩..."开头`,

  good_things: `你是一个心理日记助手。
任务：从用户的口语化叙述中提取具体的好事。
要求：
1. 用"1. 2. 3."格式列出，必须提取3件事
2. 每条不超过15字
3. 提取核心事件，忽略冗余描述
4. 保持积极情绪
5. 只输出列表，不要其他内容

示例：
输入："今天游泳真爽嗯虽然水凉但游完喝了杯奶茶心情特别好"
输出：
1. 享受了清凉的游泳
2. 喝到了满意的奶茶
3. 感受到愉悦的心情`,

  intention: `你是一个心理日记助手。
任务：将用户的意向美化为温和、可实现的表达。
要求：
1. 强调"想"而非"应该"
2. 控制在20字以内
3. 保持轻松感，避免压力感
4. 用"今天想..."开头`,

  improvement: `你是一个心理日记助手。
任务：将用户的观察美化为不带评判的发现。
要求：
1. 用"发现..."、"原来..."、"注意到..."等观察式表达
2. 完全避免评判、批评或改进类词汇
3. 保持客观、好奇的观察者视角
4. 控制在30字以内`,

  tomorrow: `你是一个心理日记助手。
任务：将用户的计划美化为温和、可实现的小目标。
要求：
1. 强调"小"和"可行"
2. 控制在20字以内
3. 充满期待感
4. 不使用"一定要"、"必须"等强制词汇`,

  general: `你是一个温柔的心理日记助手。
任务：美化以下文字，使其更加流畅优美，同时保持原意。
要求：
1. 移除口语化表达
2. 保持情感温度
3. 简洁明了`
};

/**
 * 使用通义千问美化文本
 * @param {string} text - 原始文本
 * @param {string} context - 上下文类型（grateful, good_things, intention, improvement, tomorrow）
 * @returns {Promise<string>} 美化后的文本
 */
export const beautifyWithQwen = async (text, context = 'general') => {
  // 如果文本为空或太短，直接返回
  if (!text || text.trim().length < 2) {
    return text;
  }

  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo', // 使用 qwen-turbo（更便宜）或 qwen-plus（更强大）
        input: {
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        parameters: {
          temperature: 0.7, // 创造性（0-1）
          top_p: 0.8,       // 多样性
          max_tokens: 200,  // 最大输出长度
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-SSE': 'disable' // 禁用流式输出
        },
        timeout: 10000 // 10秒超时
      }
    );

    if (response.data.output && response.data.output.choices) {
      const result = response.data.output.choices[0].message.content.trim();
      
      // 记录使用量
      if (response.data.usage) {
        console.log('通义千问 Token 使用:', response.data.usage);
      }
      
      return result;
    } else {
      throw new Error('AI 响应格式错误');
    }

  } catch (error) {
    console.error('通义千问 AI 处理错误:', error);
    
    // 降级处理：返回简单清理后的文本
    return fallbackBeautify(text);
  }
};

/**
 * 从文本中提取好事（专用于晚间复盘）
 * @param {string} text - 用户输入的长文本
 * @returns {Promise<string>} 提取的3件好事（格式化）
 */
export const extractGoodThingsWithQwen = async (text) => {
  try {
    const result = await beautifyWithQwen(text, 'good_things');
    
    // 确保格式正确（1. 2. 3.）
    if (!result.includes('1.')) {
      // 如果 AI 没有按格式输出，手动格式化
      const sentences = result.split(/[。！]/).filter(s => s.trim());
      return sentences.slice(0, 3).map((s, i) => `${i + 1}. ${s.trim()}`).join('\n');
    }
    
    return result;
    
  } catch (error) {
    console.error('提取好事失败:', error);
    return fallbackExtractGoodThings(text);
  }
};

/**
 * 情感分析
 * @param {string} text - 要分析的文本
 * @returns {Promise<Object>} 情感分析结果
 */
export const analyzeMoodWithQwen = async (text) => {
  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: `你是情感分析专家。分析文本的情绪倾向，返回 JSON 格式：
{
  "mood": "positive/neutral/negative",
  "score": 0-100,
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "一句话总结用户的心情"
}

只返回 JSON，不要其他内容。`
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const result = response.data.output.choices[0].message.content;
    
    // 提取 JSON（可能包含在代码块中）
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(result);

  } catch (error) {
    console.error('情感分析错误:', error);
    
    // 降级处理：简单的关键词匹配
    return fallbackMoodAnalysis(text);
  }
};

/**
 * 生成个性化提示（基于用户历史）
 * @param {Array} historyData - 用户历史数据
 * @param {string} questionType - 问题类型
 * @returns {Promise<Array>} 个性化提示列表
 */
export const generatePersonalizedHints = async (historyData, questionType) => {
  try {
    // 提取用户常用词
    const allText = historyData.map(d => d[questionType] || '').join(' ');
    
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: `基于用户的历史记录，生成6个个性化的日记提示词。
要求：
1. 符合用户的表达风格
2. 每条10-15字
3. 具体、可操作
4. 返回 JSON 数组格式：["提示1", "提示2", ...]`
            },
            {
              role: 'user',
              content: `用户历史记录：${allText.substring(0, 500)}`
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.output.choices[0].message.content;
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(result);

  } catch (error) {
    console.error('生成个性化提示失败:', error);
    return []; // 返回空数组，使用默认提示
  }
};

// ============= 降级处理函数 =============

/**
 * 降级：简单的文本清理
 */
function fallbackBeautify(text) {
  let cleaned = text.trim();
  
  // 移除语气词
  cleaned = cleaned.replace(/嗯+|啊+|呃+|那个+|就是+|然后+/g, '');
  
  // 移除多余空格
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // 移除开头的标点符号
  cleaned = cleaned.replace(/^[，。、！？；：]+/, '');
  
  return cleaned.trim();
}

/**
 * 降级：简单提取好事
 */
function fallbackExtractGoodThings(text) {
  // 按标点符号分句
  const sentences = text.split(/[，。；！？、]/).filter(s => s.trim().length > 3);
  
  // 取前3句
  const top3 = sentences.slice(0, 3);
  
  // 格式化
  return top3.map((s, i) => `${i + 1}. ${fallbackBeautify(s)}`).join('\n');
}

/**
 * 降级：简单情感分析
 */
function fallbackMoodAnalysis(text) {
  const positiveWords = ['开心', '高兴', '快乐', '满意', '舒服', '美好', '喜欢', '爱', '幸福'];
  const negativeWords = ['难过', '伤心', '生气', '焦虑', '担心', '痛苦', '累', '烦'];
  
  let score = 50; // 中性
  const keywords = [];
  
  // 检测积极词
  positiveWords.forEach(word => {
    if (text.includes(word)) {
      score += 10;
      keywords.push(word);
    }
  });
  
  // 检测消极词
  negativeWords.forEach(word => {
    if (text.includes(word)) {
      score -= 10;
      keywords.push(word);
    }
  });
  
  // 限制范围
  score = Math.max(0, Math.min(100, score));
  
  let mood = 'neutral';
  let summary = '心情平静';
  
  if (score >= 60) {
    mood = 'positive';
    summary = '心情不错';
  } else if (score <= 40) {
    mood = 'negative';
    summary = '有些低落';
  }
  
  return { mood, score, keywords, summary };
}

/**
 * 检查 API 配置
 */
export const checkQwenConfig = () => {
  if (!DASHSCOPE_API_KEY) {
    console.warn('未配置通义千问 API Key');
    return {
      configured: false,
      message: '请在 .env 文件中设置 REACT_APP_DASHSCOPE_API_KEY'
    };
  }
  
  return {
    configured: true,
    message: '通义千问 API 已配置'
  };
};

export default {
  beautifyWithQwen,
  extractGoodThingsWithQwen,
  analyzeMoodWithQwen,
  generatePersonalizedHints,
  checkQwenConfig
};
