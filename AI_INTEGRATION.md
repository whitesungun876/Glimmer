# AI 集成指南 🤖

## 概述

本应用预留了完整的 AI 接口，可以轻松集成真实的 AI 服务来实现：
- 语音转文字（STT）
- 文本美化和提取
- 智能提示生成
- 情感分析

## 🎙️ 语音识别服务

### 选项 1：OpenAI Whisper API

**推荐指数**：⭐⭐⭐⭐⭐

**优势**：
- 支持 99 种语言
- 高准确率
- 自动标点符号
- 处理噪音能力强

**集成步骤**：

1. 安装依赖：
```bash
npm install openai
```

2. 修改 `src/utils/aiHelpers.js`：
```javascript
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

export const speechToText = async (audioBlob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-1');
  formData.append('language', 'zh');

  const response = await openai.audio.transcriptions.create({
    file: formData.get('file'),
    model: 'whisper-1',
    language: 'zh'
  });

  return response.text;
};
```

3. 添加环境变量（`.env`）：
```
REACT_APP_OPENAI_API_KEY=sk-your-api-key-here
```

**价格**：$0.006 / 分钟

---

### 选项 2：阿里云语音识别

**推荐指数**：⭐⭐⭐⭐

**优势**：
- 中文识别优秀
- 支持方言
- 国内服务器速度快
- 性价比高

**集成步骤**：

1. 安装 SDK：
```bash
npm install @alicloud/pop-core
```

2. 修改代码：
```javascript
import Client from '@alicloud/pop-core';

const client = new Client({
  accessKeyId: process.env.REACT_APP_ALI_ACCESS_KEY_ID,
  accessKeySecret: process.env.REACT_APP_ALI_ACCESS_KEY_SECRET,
  endpoint: 'https://nls-meta.cn-shanghai.aliyuncs.com',
  apiVersion: '2019-02-28'
});

export const speechToText = async (audioBlob) => {
  const params = {
    "RegionId": "cn-shanghai",
    "AppKey": process.env.REACT_APP_ALI_APP_KEY,
    "FileLink": await uploadToOSS(audioBlob) // 需要先上传到OSS
  };

  const response = await client.request('CreateTask', params);
  return response.Result;
};
```

**价格**：¥0.0025 / 分钟

---

### 选项 3：继续使用浏览器 Web Speech API

**推荐指数**：⭐⭐⭐

**优势**：
- 完全免费
- 无需后端
- 即时响应
- 已实现

**限制**：
- 需要 HTTPS
- 部分浏览器不支持
- 准确率一般
- 无法处理复杂噪音

**当前实现**（无需修改）：
```javascript
// 已在 src/utils/aiHelpers.js 中实现
export const speechToText = async () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'zh-CN';
  // ... 已完整实现
};
```

## 📝 文本美化服务

### 选项 1：OpenAI GPT-4

**推荐指数**：⭐⭐⭐⭐⭐

**集成步骤**：

修改 `src/utils/aiHelpers.js`：

```javascript
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY
});

export const beautifyWithAI = async (text, context = 'general') => {
  const systemPrompts = {
    'grateful': '你是一个温柔的心理日记助手。请将用户的感激内容提炼为简洁优美的文字，保留情感，移除语气词。',
    'good_things': '请从用户的口语化叙述中提取3件具体的好事，用"1. 2. 3."格式列出，每条保持在15字以内。',
    'general': '请美化以下文字，使其更加流畅优美，同时保持原意。'
  };

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { 
        role: 'system', 
        content: systemPrompts[context] || systemPrompts.general
      },
      { 
        role: 'user', 
        content: text 
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  });

  return response.choices[0].message.content;
};
```

**使用示例**：

```javascript
// 在 EveningRoutine.jsx 中
const processedText = await beautifyWithAI(text, 'good_things');

// 输入："今天游泳真爽嗯虽然水凉但游完喝了杯奶茶心情特别好"
// 输出："1. 享受了清凉的游泳\n2. 喝到了满意的奶茶\n3. 感受到愉悦的心情"
```

**价格**：
- GPT-4: $0.03 / 1K tokens（输入）
- GPT-3.5-turbo: $0.0015 / 1K tokens（更便宜）

---

### 选项 2：通义千问（阿里云）

**推荐指数**：⭐⭐⭐⭐

**优势**：
- 中文理解更好
- 价格便宜
- 国内访问快

```javascript
import Dashscope from '@dashscope/api';

const client = new Dashscope({
  apiKey: process.env.REACT_APP_DASHSCOPE_API_KEY
});

export const beautifyWithAI = async (text, context) => {
  const response = await client.chat.completions.create({
    model: 'qwen-turbo',
    messages: [
      { role: 'system', content: '你是心理日记助手' },
      { role: 'user', content: text }
    ]
  });
  
  return response.choices[0].message.content;
};
```

**价格**：¥0.0008 / 1K tokens

---

### 选项 3：本地 NLP 处理

**推荐指数**：⭐⭐

**适用场景**：隐私优先、离线使用

```bash
npm install compromise
```

```javascript
import nlp from 'compromise';

export const beautifyWithAI = async (text) => {
  let doc = nlp(text);
  
  // 移除语气词
  doc.match('#Interjection').remove();
  
  // 提取主要句子
  const sentences = doc.sentences().out('array');
  
  return sentences.join('，');
};
```

## 🎯 智能提示生成

### 基于用户历史的个性化提示

```javascript
export const generatePersonalizedHints = async (userId, questionType) => {
  // 获取用户历史记录
  const history = getUserHistory('morning', 30);
  
  // 提取常用词
  const keywords = extractKeywords(history);
  
  // 调用 GPT 生成个性化提示
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '根据用户的历史记录，生成6个个性化的日记提示词。'
      },
      {
        role: 'user',
        content: `用户常提到：${keywords.join('、')}。请生成符合这个用户风格的提示。`
      }
    ]
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

## 📊 情感分析

### 分析用户情绪趋势

```javascript
export const analyzeMoodFromText = async (text) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: '分析以下文字的情绪倾向，返回JSON格式：{"mood": "positive/neutral/negative", "score": 0-100, "keywords": []}'
      },
      {
        role: 'user',
        content: text
      }
    ]
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

### 在应用中使用

```javascript
// 在用户完成日记后
const moodData = await analyzeMoodFromText(answers.good_things);

// 保存情绪数据
saveUserData('evening', date, {
  ...answers,
  mood: moodData
});

// 在欢迎页显示情绪趋势
const weekMood = await calculateWeeklyMoodTrend();
// 显示图表或文字总结
```

## 🔒 安全和隐私

### 1. API 密钥管理

**永远不要**把 API 密钥提交到代码仓库！

使用环境变量：
```javascript
// .env
REACT_APP_OPENAI_API_KEY=sk-xxx
REACT_APP_ALI_ACCESS_KEY_ID=xxx

// .gitignore
.env
.env.local
```

### 2. 后端代理

**推荐**：不要在前端直接调用 AI API

创建后端服务：
```javascript
// backend/api/ai.js
app.post('/api/beautify', async (req, res) => {
  const { text, context } = req.body;
  
  // 在后端调用 OpenAI
  const result = await openai.chat.completions.create({
    // ...
  });
  
  res.json({ beautified: result.choices[0].message.content });
});
```

前端调用：
```javascript
export const beautifyWithAI = async (text, context) => {
  const response = await fetch('/api/beautify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, context })
  });
  
  return (await response.json()).beautified;
};
```

### 3. 用户隐私

- ✅ 提供"本地处理"选项
- ✅ 明确告知数据将发送到 AI 服务
- ✅ 允许用户选择退出 AI 功能
- ✅ 不保存原始语音文件

## 💰 成本估算

### 典型用户使用量

- 每天 2 次使用（早晚各 1 次）
- 每次 3 个问题
- 平均每个回答 50 字

### OpenAI GPT-4
- 每次美化约 100 tokens
- 每天 6 次美化 = 600 tokens
- 月费用：600 × 30 × $0.03 / 1000 = **$0.54/月/用户**

### OpenAI GPT-3.5-turbo（更便宜）
- 月费用：600 × 30 × $0.0015 / 1000 = **$0.027/月/用户**

### 阿里云通义千问
- 月费用：600 × 30 × ¥0.0008 / 1000 = **¥0.014/月/用户**

### 语音识别（OpenAI Whisper）
- 每天 2 次语音，每次 1 分钟
- 月费用：2 × 30 × $0.006 = **$0.36/月/用户**

### 总计（使用 GPT-3.5 + Whisper）
约 **$0.39/月/用户** 或 **¥2.8/月/用户**

## 🚀 推荐配置

### 小型项目（< 100 用户）
- 语音：浏览器 Web Speech API（免费）
- 美化：GPT-3.5-turbo
- 总成本：~$3/月

### 中型项目（100-1000 用户）
- 语音：OpenAI Whisper
- 美化：GPT-3.5-turbo
- 后端：Node.js + Express
- 总成本：~$400/月

### 大型项目（> 1000 用户）
- 语音：阿里云语音识别
- 美化：通义千问
- 后端：云函数
- CDN 加速
- 总成本：~¥300-500/月

## 📚 参考资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [阿里云语音识别](https://help.aliyun.com/product/30413.html)
- [通义千问 API](https://dashscope.console.aliyun.com/)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

---

需要帮助集成 AI 服务？查看示例代码或提交 Issue 💬
