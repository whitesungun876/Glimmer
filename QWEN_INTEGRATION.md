# 通义千问集成指南 🇨🇳

## 概述

使用阿里云通义千问（Qwen）实现完整的语音识别和智能处理功能：

1. **实时语音识别 API** - 将语音转成文字（ASR）
2. **Qwen-Audio / Qwen-Omni** - 理解语音文本并做结构化提炼

## 🎯 推荐架构

```
用户语音输入
    ↓
通义千问实时语音识别 API (ASR)
    ↓
实时转写为文字
    ↓
Qwen-Audio / Qwen-Omni 模型
    ↓
结构化提炼 + 美化
    ↓
展示在输入框
```

## 📦 准备工作

### 1. 注册阿里云账号并开通服务

访问：https://dashscope.aliyun.com/

开通以下服务：
- ✅ 实时语音识别
- ✅ 通义千问大模型

### 2. 获取 API Key

在控制台获取 API Key：
```
https://dashscope.console.aliyun.com/apiKey
```

### 3. 安装依赖

```bash
npm install @alicloud/alimt20181012 \
            @alicloud/nls-realtime-asr-sdk \
            axios
```

## 🎙️ 实时语音识别集成

### 方案 1：阿里云实时语音识别 SDK

创建文件：`src/utils/qwenSpeech.js`

```javascript
import NlsRealTimeTranscription from '@alicloud/nls-realtime-asr-sdk';

/**
 * 通义千问实时语音识别
 * 支持连续识别、实时返回结果
 */
export class QwenSpeechRecognition {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.transcription = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
  }

  /**
   * 开始识别
   * @param {Function} onResult - 结果回调 (text) => void
   * @param {Function} onError - 错误回调 (error) => void
   */
  async start(onResult, onError) {
    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    try {
      // 创建实时转写实例
      this.transcription = new NlsRealTimeTranscription({
        appkey: this.apiKey,
        // 使用 WebSocket 协议
        protocol: 'wss',
        // 中文识别
        format: 'pcm',
        sampleRate: 16000,
        // 启用中间结果
        enableIntermediateResult: true,
        // 启用标点符号
        enablePunctuationPrediction: true,
        // 启用逆文本正则化（数字、日期等）
        enableInverseTextNormalization: true
      });

      // 监听识别结果
      this.transcription.on('started', () => {
        console.log('语音识别开始');
      });

      // 实时结果（未完成的句子）
      this.transcription.on('result_changed', (message) => {
        const text = message.result;
        if (this.onResultCallback) {
          this.onResultCallback(text, false); // false 表示未完成
        }
      });

      // 句子完成结果
      this.transcription.on('sentence_end', (message) => {
        const text = message.result;
        if (this.onResultCallback) {
          this.onResultCallback(text, true); // true 表示句子完成
        }
      });

      // 识别完成
      this.transcription.on('completed', () => {
        console.log('语音识别完成');
      });

      // 错误处理
      this.transcription.on('error', (error) => {
        console.error('语音识别错误:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      });

      // 开始识别
      await this.transcription.start();

      // 开始录音并发送音频流
      this.startAudioCapture();

    } catch (error) {
      console.error('启动语音识别失败:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  /**
   * 停止识别
   */
  stop() {
    if (this.transcription) {
      this.transcription.stop();
      this.stopAudioCapture();
    }
  }

  /**
   * 开始音频捕获
   */
  async startAudioCapture() {
    try {
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // 创建音频上下文
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = audioContext.createMediaStreamSource(stream);
      
      // 创建音频处理器
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // 转换为 PCM 格式
        const pcmData = this.convertToPCM(inputData);
        // 发送音频数据
        if (this.transcription) {
          this.transcription.sendAudio(pcmData);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      this.audioContext = audioContext;
      this.mediaStream = stream;
      this.processor = processor;

    } catch (error) {
      console.error('音频捕获失败:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    }
  }

  /**
   * 停止音频捕获
   */
  stopAudioCapture() {
    if (this.processor) {
      this.processor.disconnect();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  /**
   * 将 Float32Array 转换为 PCM Int16Array
   */
  convertToPCM(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }
}
```

### 方案 2：HTTP API 调用（更简单）

创建文件：`src/utils/qwenSpeechSimple.js`

```javascript
import axios from 'axios';

const DASHSCOPE_API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY;
const ASR_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr';

/**
 * 简化版语音识别（一次性识别）
 * 适合短音频场景
 */
export const speechToTextSimple = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('model', 'paraformer-realtime-v1');
    formData.append('format', 'wav');
    formData.append('sample_rate', '16000');
    formData.append('enable_inverse_text_normalization', 'true');
    formData.append('enable_punctuation', 'true');

    const response = await axios.post(ASR_URL, formData, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'multipart/form-data',
        'X-DashScope-Async': 'false'
      }
    });

    if (response.data.output && response.data.output.text) {
      return response.data.output.text;
    } else {
      throw new Error('识别失败：' + JSON.stringify(response.data));
    }

  } catch (error) {
    console.error('语音识别错误:', error);
    throw error;
  }
};

/**
 * 录制音频（用于一次性识别）
 */
export const recordAudio = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        resolve(blob);
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      // 开始录音
      mediaRecorder.start();

      // 返回控制器
      resolve({
        stop: () => mediaRecorder.stop(),
        mediaRecorder
      });

    } catch (error) {
      reject(error);
    }
  });
};
```

## 🤖 Qwen-Audio 智能处理

创建文件：`src/utils/qwenAI.js`

```javascript
import axios from 'axios';

const DASHSCOPE_API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY;
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

/**
 * 使用 Qwen-Audio 进行文本美化和结构化提炼
 */
export const beautifyWithQwen = async (text, context = 'general') => {
  const systemPrompts = {
    'grateful': `你是一个温柔的心理日记助手。
任务：将用户的感激内容提炼为简洁优美的文字。
要求：
1. 保留情感温度
2. 移除口语化表达（嗯、啊、呃、那个、就是）
3. 不超过30字
4. 保持第一人称视角`,

    'good_things': `你是一个心理日记助手。
任务：从用户的口语化叙述中提取具体的好事。
要求：
1. 用"1. 2. 3."格式列出
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

    'intention': `你是一个心理日记助手。
任务：将用户的意向美化为温和、可实现的表达。
要求：
1. 强调"想"而非"应该"
2. 不超过20字
3. 保持轻松感，避免压力感`,

    'improvement': `你是一个心理日记助手。
任务：将用户的反思美化为温和的复盘。
要求：
1. 用"如果...会更好"的句式
2. 避免批评性词汇
3. 保持建设性
4. 不超过30字`,

    'tomorrow': `你是一个心理日记助手。
任务：将用户的计划美化为温和、可实现的小目标。
要求：
1. 强调"小"和"可行"
2. 不超过20字
3. 充满期待感`
  };

  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-plus', // 或 qwen-turbo（更便宜）
        input: {
          messages: [
            {
              role: 'system',
              content: systemPrompts[context] || systemPrompts.general
            },
            {
              role: 'user',
              content: text
            }
          ]
        },
        parameters: {
          temperature: 0.7,
          top_p: 0.8,
          max_tokens: 200,
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.output && response.data.output.choices) {
      return response.data.output.choices[0].message.content;
    } else {
      throw new Error('AI 处理失败: ' + JSON.stringify(response.data));
    }

  } catch (error) {
    console.error('Qwen AI 处理错误:', error);
    // 降级处理：返回简单清理后的文本
    return text.replace(/嗯+|啊+|呃+|那个+|就是+/g, '').trim();
  }
};

/**
 * 批量处理（用于"3件好事"）
 */
export const extractGoodThingsWithQwen = async (text) => {
  return await beautifyWithQwen(text, 'good_things');
};

/**
 * 情感分析
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
              content: `分析文本的情绪倾向，返回 JSON 格式：
{
  "mood": "positive/neutral/negative",
  "score": 0-100,
  "keywords": ["关键词1", "关键词2"],
  "summary": "一句话总结"
}`
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
        }
      }
    );

    const result = response.data.output.choices[0].message.content;
    return JSON.parse(result);

  } catch (error) {
    console.error('情感分析错误:', error);
    return {
      mood: 'neutral',
      score: 50,
      keywords: [],
      summary: '心情平静'
    };
  }
};
```

## 🔧 在组件中使用

### 更新 `MorningRoutine.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { saveUserData } from '../../utils/aiHelpers';
import { speechToTextSimple, recordAudio } from '../../utils/qwenSpeechSimple';
import { beautifyWithQwen } from '../../utils/qwenAI';

function MorningRoutine({ userData, theme, onComplete }) {
  // ... 其他状态

  const [audioRecorder, setAudioRecorder] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // 语音输入处理（长按）
  const handleVoiceStart = async () => {
    setIsRecording(true);
    
    try {
      const recorder = await recordAudio();
      setAudioRecorder(recorder);
    } catch (error) {
      console.error('开始录音失败:', error);
      alert('无法访问麦克风，请检查权限');
      setIsRecording(false);
    }
  };

  const handleVoiceStop = async () => {
    if (!audioRecorder) return;
    
    try {
      // 停止录音
      audioRecorder.stop();
      
      // 等待录音数据
      audioRecorder.mediaRecorder.onstop = async () => {
        try {
          // 获取音频 Blob
          const audioBlob = await new Promise((resolve) => {
            const chunks = [];
            audioRecorder.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            setTimeout(() => {
              resolve(new Blob(chunks, { type: 'audio/wav' }));
            }, 100);
          });

          // 通义千问语音识别
          const text = await speechToTextSimple(audioBlob);
          
          // 通义千问 AI 美化
          const contextMap = {
            'grateful': 'grateful',
            'intention': 'intention',
            'affirmation': 'general'
          };
          const beautified = await beautifyWithQwen(
            text, 
            contextMap[currentQuestion.id]
          );
          
          // 填充到输入框
          handleInputChange(beautified);
          
        } catch (error) {
          console.error('语音处理失败:', error);
          alert('语音识别失败，请重试或使用文字输入');
        } finally {
          setIsRecording(false);
          setAudioRecorder(null);
        }
      };

    } catch (error) {
      console.error('停止录音失败:', error);
      setIsRecording(false);
    }
  };

  return (
    <div className="glass-card">
      {/* 呼吸灯效果 */}
      {isRecording && <div className="breathing-light"></div>}

      {/* ... 其他内容 */}

      {/* 长按语音按钮 */}
      <button
        className={`voice-long-press ${isRecording ? 'recording' : ''}`}
        onMouseDown={handleVoiceStart}
        onMouseUp={handleVoiceStop}
        onTouchStart={handleVoiceStart}
        onTouchEnd={handleVoiceStop}
      >
        <span className="voice-icon">🎤</span>
        <span className="voice-text">
          {isRecording ? '松开结束' : '长按说话'}
        </span>
      </button>
    </div>
  );
}
```

### 更新 `EveningRoutine.jsx`

```javascript
import { extractGoodThingsWithQwen } from '../../utils/qwenAI';

// 在 handleNext 中使用
const handleNext = async () => {
  if (step < EVENING_QUESTIONS.length - 1) {
    setStep(step + 1);
  } else {
    // AI 提取好事
    let processedAnswers = { ...answers };
    
    if (answers.good_things) {
      try {
        const extracted = await extractGoodThingsWithQwen(answers.good_things);
        processedAnswers.good_things_extracted = extracted;
      } catch (error) {
        console.error('AI 提取失败:', error);
      }
    }
    
    saveUserData('evening', new Date().toDateString(), processedAnswers);
    onComplete();
  }
};
```

## 🔐 环境配置

创建 `.env` 文件：

```bash
# 通义千问 API Key
REACT_APP_DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here

# 可选：阿里云 AccessKey（如果使用 SDK）
REACT_APP_ALI_ACCESS_KEY_ID=your-access-key-id
REACT_APP_ALI_ACCESS_KEY_SECRET=your-access-key-secret
```

更新 `.gitignore`：

```gitignore
# 环境变量
.env
.env.local
.env.production
```

## 💰 价格参考

### 语音识别（ASR）
- **Paraformer 实时识别**：¥0.0025/分钟
- 月度使用 1000 分钟：¥2.5

### 文本生成
- **Qwen-Turbo**：¥0.0008/1K tokens（输入）
- **Qwen-Plus**：¥0.004/1K tokens（输入）
- 每天 6 次美化，每次 100 tokens
- 月费用（Qwen-Turbo）：600 × 30 × ¥0.0008 / 1000 = **¥0.014**

### 总计（每用户每月）
- 语音识别：¥0.05（假设每天 1 分钟）
- 文本美化：¥0.014
- **总计：约 ¥0.06/月/用户** 💰

比 OpenAI 便宜约 **50 倍**！

## 🎯 推荐配置

### 开发环境
```javascript
// 使用简单的 HTTP API
import { speechToTextSimple } from './qwenSpeechSimple';
import { beautifyWithQwen } from './qwenAI';
```

### 生产环境
```javascript
// 使用实时 WebSocket SDK（更流畅）
import { QwenSpeechRecognition } from './qwenSpeech';
import { beautifyWithQwen } from './qwenAI';

const recognition = new QwenSpeechRecognition(API_KEY);
recognition.start(
  (text, isFinal) => {
    // 实时显示识别结果
    setTranscript(text);
  },
  (error) => {
    console.error(error);
  }
);
```

## 🧪 测试代码

创建 `src/test/qwenTest.js`：

```javascript
import { speechToTextSimple } from '../utils/qwenSpeechSimple';
import { beautifyWithQwen, extractGoodThingsWithQwen } from '../utils/qwenAI';

// 测试语音识别（需要录音）
export const testSpeechRecognition = async (audioBlob) => {
  console.log('开始测试语音识别...');
  const text = await speechToTextSimple(audioBlob);
  console.log('识别结果:', text);
  return text;
};

// 测试文本美化
export const testBeautify = async () => {
  const testCases = [
    {
      input: '今天嗯早上起来嘛看到窗外的树就是很开心',
      context: 'grateful',
      expected: '简洁优美的感激表达'
    },
    {
      input: '今天游泳真爽嗯虽然水凉但游完喝了杯奶茶心情特别好',
      context: 'good_things',
      expected: '1. ... 2. ... 3. ...'
    }
  ];

  for (const testCase of testCases) {
    console.log('\n测试输入:', testCase.input);
    const result = await beautifyWithQwen(testCase.input, testCase.context);
    console.log('AI 输出:', result);
    console.log('期望格式:', testCase.expected);
  }
};

// 运行所有测试
export const runAllTests = async () => {
  console.log('=== 通义千问集成测试 ===\n');
  await testBeautify();
  console.log('\n=== 测试完成 ===');
};
```

## 📊 性能优化

### 1. 缓存常用提示
```javascript
const hintCache = new Map();

export const getCachedHints = (questionType) => {
  if (hintCache.has(questionType)) {
    return hintCache.get(questionType);
  }
  // 生成并缓存
  const hints = generateHints(questionType);
  hintCache.set(questionType, hints);
  return hints;
};
```

### 2. 请求去重
```javascript
let lastRequest = null;
let lastResult = null;

export const beautifyWithQwenDebounced = async (text, context) => {
  const requestKey = `${text}_${context}`;
  
  if (lastRequest === requestKey) {
    return lastResult;
  }
  
  lastRequest = requestKey;
  lastResult = await beautifyWithQwen(text, context);
  return lastResult;
};
```

### 3. 超时处理
```javascript
const timeout = (ms) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('请求超时')), ms)
);

export const beautifyWithQwenSafe = async (text, context) => {
  try {
    return await Promise.race([
      beautifyWithQwen(text, context),
      timeout(5000) // 5秒超时
    ]);
  } catch (error) {
    // 降级处理
    return text.replace(/嗯+|啊+|呃+|那个+/g, '').trim();
  }
};
```

## 🔍 调试技巧

### 1. 启用详细日志
```javascript
const DEBUG = process.env.NODE_ENV === 'development';

export const log = (...args) => {
  if (DEBUG) {
    console.log('[Qwen]', ...args);
  }
};
```

### 2. 监控 API 调用
```javascript
let apiCallCount = 0;
let totalTokens = 0;

export const trackApiCall = (tokens) => {
  apiCallCount++;
  totalTokens += tokens;
  console.log(`API 调用次数: ${apiCallCount}, 总 tokens: ${totalTokens}`);
};
```

## 📚 官方文档

- [通义千问 API 文档](https://help.aliyun.com/zh/dashscope/)
- [语音识别 API](https://help.aliyun.com/zh/dashscope/developer-reference/api-paraformer-v1)
- [文本生成 API](https://help.aliyun.com/zh/dashscope/developer-reference/api-qwen)
- [SDK 下载](https://github.com/aliyun/alibabacloud-nls-python-sdk)

## 🆘 常见问题

### Q: 提示 "Authorization failed"
A: 检查 API Key 是否正确，是否已开通服务

### Q: 语音识别很慢
A: 使用实时 WebSocket 接口而非 HTTP 接口

### Q: 识别准确率低
A: 确保录音质量，启用降噪和回声消除

### Q: 成本太高
A: 使用 Qwen-Turbo 而非 Qwen-Plus，启用缓存

---

🎉 **完成集成后，你的应用将拥有业界领先的中文语音识别和 AI 处理能力！**
