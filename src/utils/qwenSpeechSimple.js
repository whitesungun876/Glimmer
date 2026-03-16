/**
 * 通义千问语音识别 - 简化版
 * 使用 HTTP API 进行一次性语音识别
 * 适合短音频场景（< 1分钟）
 */

import axios from 'axios';

const DASHSCOPE_API_KEY = process.env.REACT_APP_DASHSCOPE_API_KEY;
const ASR_URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/asr';

/**
 * 语音转文字（通义千问 ASR）
 * @param {Blob} audioBlob - 音频文件（支持 wav, mp3, pcm）
 * @returns {Promise<string>} 识别后的文字
 */
export const speechToTextSimple = async (audioBlob) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');
    formData.append('model', 'paraformer-realtime-v1'); // 实时识别模型
    formData.append('format', 'wav');
    formData.append('sample_rate', '16000');
    formData.append('enable_inverse_text_normalization', 'true'); // 启用数字转换
    formData.append('enable_punctuation', 'true'); // 启用标点符号

    const response = await axios.post(ASR_URL, formData, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'multipart/form-data',
        'X-DashScope-Async': 'false' // 同步模式
      },
      timeout: 30000 // 30秒超时
    });

    if (response.data.output && response.data.output.text) {
      return response.data.output.text;
    } else {
      throw new Error('识别失败：' + JSON.stringify(response.data));
    }

  } catch (error) {
    console.error('通义千问语音识别错误:', error);
    
    if (error.response) {
      // API 返回错误
      const errorMsg = error.response.data?.message || '未知错误';
      throw new Error(`语音识别失败: ${errorMsg}`);
    } else if (error.request) {
      // 网络错误
      throw new Error('网络连接失败，请检查网络');
    } else {
      throw error;
    }
  }
};

/**
 * 录制音频
 * 返回一个包含 stop 方法的 Promise
 */
export const recordAudio = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true, // 回声消除
          noiseSuppression: true, // 降噪
          autoGainControl: true   // 自动增益
        }
      });

      // 创建录音器
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm' // 或 audio/wav
      });

      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // 停止所有音轨
        stream.getTracks().forEach(track => track.stop());

        // 合并音频片段
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        // 调用回调（如果有）
        if (mediaRecorder.onRecordComplete) {
          mediaRecorder.onRecordComplete(audioBlob);
        }
      };

      mediaRecorder.onerror = (error) => {
        console.error('录音错误:', error);
        stream.getTracks().forEach(track => track.stop());
        reject(error);
      };

      // 开始录音
      mediaRecorder.start(100); // 每100ms收集一次数据

      // 返回控制器
      resolve({
        stop: () => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        },
        pause: () => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
          }
        },
        resume: () => {
          if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
          }
        },
        mediaRecorder,
        stream
      });

    } catch (error) {
      console.error('无法访问麦克风:', error);
      
      if (error.name === 'NotAllowedError') {
        reject(new Error('请允许麦克风权限'));
      } else if (error.name === 'NotFoundError') {
        reject(new Error('未检测到麦克风设备'));
      } else {
        reject(error);
      }
    }
  });
};

/**
 * 检查浏览器支持
 */
export const checkBrowserSupport = () => {
  const issues = [];

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    issues.push('浏览器不支持录音功能');
  }

  if (!window.MediaRecorder) {
    issues.push('浏览器不支持 MediaRecorder');
  }

  if (!window.FormData) {
    issues.push('浏览器不支持 FormData');
  }

  if (issues.length > 0) {
    return {
      supported: false,
      issues
    };
  }

  return {
    supported: true,
    issues: []
  };
};

/**
 * 获取麦克风权限状态
 */
export const getMicrophonePermission = async () => {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result.state; // 'granted', 'denied', 'prompt'
  } catch (error) {
    console.warn('无法查询麦克风权限:', error);
    return 'unknown';
  }
};

/**
 * 测试麦克风
 */
export const testMicrophone = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // 创建音频分析器
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    microphone.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // 检测音量
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b) / bufferLength;
    
    // 清理
    stream.getTracks().forEach(track => track.stop());
    audioContext.close();
    
    return {
      available: true,
      volume: Math.round(volume),
      message: volume > 0 ? '麦克风正常工作' : '未检测到声音'
    };
    
  } catch (error) {
    return {
      available: false,
      volume: 0,
      message: error.message
    };
  }
};
