// AI 助手工具函数

/**
 * 从用户的长文本输入中提取核心事件
 * 使用规则引擎模拟智能提取
 */
export const extractCoreEvents = (text) => {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // 第1步：清理文本
  let cleaned = text.trim();
  
  // 移除语气词和填充词
  cleaned = cleaned.replace(/嗯+|啊+|呃+|那个+|就是+|然后+|这个+|那个+|其实+/gi, '');
  
  // 移除多余的标点和空格
  cleaned = cleaned.replace(/[，。、]+/g, '，').replace(/\s+/g, ' ').trim();

  // 第2步：尝试提取关键句子
  // 按句子分割（根据标点）
  const sentences = cleaned.split(/[，。！？；]/).filter(s => s.trim().length > 0);
  
  // 第3步：智能关键词提取和美化
  const keywordPatterns = [
    // 运动类
    { pattern: /(游泳|跑步|健身|瑜伽|散步|爬山|骑车)/, template: '完成了{activity}' },
    // 食物类
    { pattern: /(吃|喝|品尝|尝试).{0,5}(美食|好吃|美味|咖啡|茶|甜品|餐|饭|菜)/, template: '享受了美食' },
    // 社交类
    { pattern: /(聊天|交流|见面|相聚|分享).{0,5}(朋友|家人|同事)/, template: '和重要的人愉快交流' },
    // 学习类
    { pattern: /(看书|阅读|学习|学会|理解|掌握)/, template: '收获了新知识' },
    // 娱乐类
    { pattern: /(看|听|欣赏).{0,5}(电影|音乐|歌|演出|表演)/, template: '享受了艺术时光' },
    // 休息类
    { pattern: /(睡|休息|放松|安静|平静)/, template: '好好休息了' },
    // 自然类
    { pattern: /(阳光|晚霞|星空|月光|天气|风景|花|树)/, template: '感受到了自然之美' },
    // 成就类
    { pattern: /(完成|做完|搞定|解决|成功)/, template: '完成了重要的事' },
    // 情感类
    { pattern: /(开心|快乐|愉快|高兴|满足|幸福)/, template: '感到很开心' },
  ];

  // 尝试匹配关键词模式
  for (const { pattern, template } of keywordPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      if (template.includes('{activity}')) {
        return template.replace('{activity}', match[1]);
      }
      return template;
    }
  }

  // 第4步：如果没有匹配到模式，智能截取
  // 选择最长且最有意义的句子
  if (sentences.length > 0) {
    const meaningfulSentence = sentences
      .filter(s => s.length >= 4 && s.length <= 50) // 长度合理
      .sort((a, b) => b.length - a.length)[0]; // 选最长的
    
    if (meaningfulSentence) {
      // 简化冗长的句子
      if (meaningfulSentence.length > 30) {
        return meaningfulSentence.substring(0, 30) + '...';
      }
      return meaningfulSentence;
    }
  }

  // 第5步：兜底处理
  if (cleaned.length > 40) {
    return cleaned.substring(0, 40) + '...';
  }
  
  return cleaned;
};

/**
 * 生成个性化的 AI 提示
 * 基于用户历史记录和当前时间
 */
export const generateHints = (questionType, userData) => {
  const commonHints = {
    grateful: [
      '被窝里的温暖包裹着我',
      '窗外的阳光/雨声',
      '呼吸很顺畅，身体没有不舒服',
      '房间里很安静，属于我的小空间',
      '冰箱里有喜欢的食物等着我',
      '小猫/小狗还在身边'
    ],
    intention: [
      '中午喝一杯喜欢的咖啡',
      '午休时真的休息15分钟',
      '下班时慢慢走，看看路上的风景',
      '给很久没联系的朋友发个消息',
      '晚上留10分钟听一首完整的歌',
      '整理一下桌面，让空间清爽起来'
    ],
    good_things: [
      '中午吃到了很喜欢的菜',
      '和同事聊天很开心',
      '完成了一件事',
      '看到了美丽的晚霞',
      '睡了个午觉',
      '收到了朋友的消息'
    ],
    improvement: [
      '原来中午休息一会儿，下午会更有精神',
      '和朋友聊天会让心情变好',
      '发现自己在安静的时候更能集中注意力',
      '慢一点做事反而更有效率',
      '给自己留点空白时间很重要',
      '运动之后整个人状态都不一样'
    ],
    tomorrow: [
      '早起 10 分钟做个伸展',
      '带一份自己喜欢的午餐',
      '出门前整理一下桌面',
      '睡前不看手机',
      '给自己买一杯好咖啡',
      '路过公园时停留一会儿'
    ]
  };

  // 随机打乱数组
  const hints = [...(commonHints[questionType] || [])];
  for (let i = hints.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hints[i], hints[j]] = [hints[j], hints[i]];
  }

  return hints;
};

/**
 * 语音转文字
 * 使用浏览器 Web Speech API
 * 实际生产环境建议使用 OpenAI Whisper 或阿里云语音识别
 */
export const speechToText = async () => {
  return new Promise((resolve, reject) => {
    // 检查浏览器是否支持语音识别
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      reject(new Error('浏览器不支持语音识别，建议使用 Chrome 或 Safari'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; // 中文识别
    recognition.continuous = true; // 连续识别
    recognition.interimResults = true; // 实时结果

    let finalTranscript = '';
    let timeout;

    recognition.onresult = (event) => {
      // 清除超时计时器
      if (timeout) clearTimeout(timeout);

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      // 如果1秒内没有新的语音输入，自动结束
      timeout = setTimeout(() => {
        recognition.stop();
      }, 1000);
    };

    recognition.onend = () => {
      if (finalTranscript) {
        resolve(finalTranscript);
      } else {
        reject(new Error('未识别到语音内容'));
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        reject(new Error('未检测到语音，请重试'));
      } else if (event.error === 'not-allowed') {
        reject(new Error('请允许麦克风权限'));
      } else {
        reject(new Error('语音识别失败: ' + event.error));
      }
    };

    try {
      recognition.start();
    } catch (error) {
      reject(new Error('无法启动语音识别：' + error.message));
    }
  });
};

/**
 * 美化和提取文本内容
 * 使用规则引擎模拟智能美化
 */
export const beautifyWithAI = async (text, context = 'general') => {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // 第1步：清理文本
  let processed = text.trim();
  
  // 移除语气词和填充词
  processed = processed.replace(/嗯+|啊+|呃+|那个+|就是+|然后+|这个+|其实+|可能+|大概+/gi, ' ');
  
  // 移除多余的标点
  processed = processed.replace(/[，。！？；、]+/g, '，');
  
  // 移除多余空格
  processed = processed.replace(/\s+/g, '');
  
  // 第2步：根据上下文进行优化
  if (context === 'grateful') {
    // 感恩内容：提取积极的描述
    processed = extractPositiveContent(processed);
  } else if (context === 'good_things') {
    // 好事记录：结构化提取
    processed = extractGoodThings(processed);
  } else if (context === 'intention') {
    // 意图设定：动词化
    processed = convertToIntention(processed);
  }
  
  // 第3步：格式化
  processed = processed.trim();
  
  // 首字母大写（如果需要）
  if (processed.length > 0 && /[\u4e00-\u9fa5]/.test(processed[0])) {
    // 中文内容，保持原样
  }
  
  return processed;
};

/**
 * 提取积极内容
 */
const extractPositiveContent = (text) => {
  // 查找积极词汇
  const positiveWords = ['开心', '快乐', '美好', '温暖', '舒服', '满足', '感动', '幸福'];
  
  for (const word of positiveWords) {
    if (text.includes(word)) {
      // 提取包含积极词汇的句子
      const sentences = text.split(/，|。/);
      const positiveSentence = sentences.find(s => s.includes(word));
      if (positiveSentence) {
        return positiveSentence.trim();
      }
    }
  }
  
  return text;
};

/**
 * 提取好事（结构化）
 */
const extractGoodThings = (text) => {
  // 按句子分割
  const sentences = text.split(/，|。|；/).filter(s => s.trim().length > 0);
  
  // 每个句子单独处理
  const processed = sentences.map(s => {
    s = s.trim();
    // 如果句子过长，提取关键部分
    if (s.length > 40) {
      return s.substring(0, 40) + '...';
    }
    return s;
  });
  
  // 用换行符连接
  return processed.join('\n');
};

/**
 * 转换为意图表达
 */
const convertToIntention = (text) => {
  // 确保以动词开头
  const actionWords = ['做', '完成', '尝试', '开始', '继续', '保持'];
  
  const hasAction = actionWords.some(word => text.startsWith(word));
  
  if (!hasAction && text.length > 0) {
    // 如果不是以动词开头，尝试添加
    if (text.includes('想') || text.includes('要')) {
      // 已经有意愿表达
      return text;
    }
    // 添加动作词
    return '尝试' + text;
  }
  
  return text;
};

/**
 * 保存用户数据到本地存储
 */
export const saveUserData = (type, date, data) => {
  const key = `${type}_${date}`;
  localStorage.setItem(key, JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  }));
};

/**
 * 获取用户历史数据
 */
export const getUserHistory = (type, days = 7) => {
  const history = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toDateString();
    const key = `${type}_${dateString}`;
    const data = localStorage.getItem(key);

    if (data) {
      history.push({
        date: dateString,
        ...JSON.parse(data)
      });
    }
  }

  return history;
};

/**
 * 分析用户情绪趋势
 * 基于历史记录
 */
export const analyzeMoodTrend = () => {
  const morningHistory = getUserHistory('morning', 7);
  const eveningHistory = getUserHistory('evening', 7);

  return {
    morningCount: morningHistory.length,
    eveningCount: eveningHistory.length,
    totalDays: Math.max(morningHistory.length, eveningHistory.length),
    consistency: ((morningHistory.length + eveningHistory.length) / 14 * 100).toFixed(1) + '%'
  };
};
