import React, { useState, useEffect } from 'react';
import { saveUserData } from '../../utils/aiHelpers';
import { updateStreak } from '../../utils/achievementHelpers';

const MORNING_QUESTIONS = [
  {
    id: 'grateful',
    title: '早安。醒来时，有没有什么小事让你觉得还不错？',
    subtitle: '可以是温暖的被窝、窗外的阳光、身体的放松、或者安静的空间...',
    hints: [
      // 此刻的身体感受
      '被窝里的温暖，包裹着我',
      '呼吸很顺畅，身体没有不舒服',
      '昨晚睡得很好，醒来感觉轻松',
      '伸了个懒腰，肌肉舒展的感觉很舒服',
      
      // 眼前的小美好
      '窗外有阳光/雨声/风声',
      '房间里很安静，属于我的小空间',
      '床单/衣服闻起来很舒服',
      '看到了窗外的树/云/天空',
      
      // 准备好的温柔
      '冰箱里有喜欢的食物等着我',
      '咖啡/茶已经准备好了',
      '今天可以穿喜欢的衣服',
      '手机里有朋友的消息',
      
      // 陪伴与连接
      '小猫/小狗还在身边',
      '家人在隔壁房间',
      '有人在等我起床',
      '知道今天会见到喜欢的人'
    ],
    placeholder: '试着写下你此刻注意到的...'
  },
  {
    id: 'intention',
    title: '今天，有什么小小的期待吗？',
    subtitle: '可以是喝杯喜欢的咖啡、听首完整的歌、或者慢慢走一段路...',
    hints: [
      // 给自己的小奖励
      '中午喝一杯喜欢的咖啡/奶茶',
      '下班时慢慢走，看看路上的风景',
      '晚上泡个热水澡，好好放松',
      '吃一块一直想吃的甜点',
      '穿上最喜欢最舒服的衣服',
      
      // 留给自己的时间
      '午休时真的休息15分钟，不看手机',
      '晚上留10分钟听一首完整的歌',
      '在公园的长椅上坐一会儿',
      '发呆5分钟，什么都不想',
      '早点睡，好好对待自己',
      
      // 和世界的温柔连接
      '给很久没联系的朋友发个消息',
      '对遇到的人真诚地微笑',
      '给在意的人发句"想你了"',
      '和家人/宠物多待一会儿',
      '主动说一句"谢谢"',
      
      // 小小的成就感
      '整理一下桌面，让空间清爽起来',
      '读几页一直想看的书',
      '完成一件拖了很久的小事',
      '学一个新东西，哪怕很小',
      '把想法写下来'
    ],
    placeholder: '今天你想为自己做点什么...'
  },
  {
    id: 'affirmation',
    title: '今天，你希望自己处在怎样的状态？',
    subtitle: '选一句话，轻轻对自己说...',
    type: 'cards',
    options: [
      '我能看见生活中的美好',
      '我的情绪可以平稳流动',
      '我可以温柔地对待自己和他人',
      '我有面对今天的力量',
      '我值得被爱，也值得爱自己',
      '我懂得照顾好自己的需要',
      '我对世界保持好奇和开放',
      '我可以勇敢地尝试'
    ]
  }
];

function MorningRoutine({ userData, theme, onComplete }) {
  const [step, setStep] = useState(-1); // 从-1开始，用于显示昨日约定提醒
  const [answers, setAnswers] = useState({
    grateful: '',
    intention: '',
    affirmation: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [idleTimer, setIdleTimer] = useState(null);
  const [showDynamicHint, setShowDynamicHint] = useState(false);
  const [dynamicHint, setDynamicHint] = useState('');
  const [showHints, setShowHints] = useState(false); // 控制提示词显示/隐藏
  // 检查是否有昨晚的"明天小一步"
  const [yesterdayPromise, setYesterdayPromise] = useState('');
  const [showPromiseReminder, setShowPromiseReminder] = useState(false);

  // 只有当 step >= 0 时才获取 currentQuestion
  const currentQuestion = step >= 0 ? MORNING_QUESTIONS[step] : null;

  useEffect(() => {
    // 在组件加载时检查昨天的约定
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = 'evening_' + yesterday.toDateString();
    const yesterdayData = localStorage.getItem(yesterdayKey);
    
    if (yesterdayData) {
      const data = JSON.parse(yesterdayData);
      if (data.tomorrow && data.tomorrow.trim()) {
        setYesterdayPromise(data.tomorrow);
        setShowPromiseReminder(true);
        // 保持 step 为 -1，显示提醒页面
      } else {
        // 没有昨日约定，直接进入第一个问题
        setStep(0);
      }
    } else {
      // 没有昨天的记录，直接进入第一个问题
      setStep(0);
    }
  }, []);

  const handleInputChange = (value) => {
    if (!currentQuestion) return;
    
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
    
    // 重置空闲计时器
    resetIdleTimer();
    setShowDynamicHint(false);
  };

  // 空闲检测：10秒未输入时显示动态引导
  const resetIdleTimer = () => {
    if (!currentQuestion) return;
    
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    const timer = setTimeout(() => {
      if (!currentQuestion) return;
      if (!answers[currentQuestion.id] || answers[currentQuestion.id].trim().length === 0) {
        showDynamicGuidance();
      }
    }, 10000); // 10秒
    
    setIdleTimer(timer);
  };

  const showDynamicGuidance = () => {
    if (!currentQuestion) return;
    
    const hints = currentQuestion.hints || [];
    if (hints.length > 0) {
      const randomHint = hints[Math.floor(Math.random() * hints.length)];
      setDynamicHint(randomHint);
      setShowDynamicHint(true);
      
      // 5秒后自动隐藏
      setTimeout(() => {
        setShowDynamicHint(false);
      }, 5000);
    }
  };

  useEffect(() => {
    // 当问题切换时，启动空闲检测
    if (currentQuestion && currentQuestion.type !== 'cards') {
      resetIdleTimer();
    }
    
    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // 语音输入处理
  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    
    try {
      const { speechToText } = await import('../../utils/aiHelpers');
      const text = await speechToText();
      
      // AI 处理语音文本（美化和提取）
      const processedText = await processVoiceText(text);
      handleInputChange(processedText);
      
      setIsRecording(false);
    } catch (error) {
      console.error('语音识别错误:', error);
      alert('语音识别失败，请检查麦克风权限或使用文字输入');
      setIsRecording(false);
    }
  };

  // AI 处理语音文本
  const processVoiceText = async (text) => {
    try {
      if (!currentQuestion) return text;
      
      // 调用增强的AI处理函数
      const { beautifyWithAI } = await import('../../utils/aiHelpers');
      
      // 根据当前问题类型选择处理方式
      let context = 'general';
      if (currentQuestion.id === 'grateful') {
        context = 'grateful';
      } else if (currentQuestion.id === 'intention') {
        context = 'intention';
      }
      
      const processed = await beautifyWithAI(text, context);
      return processed;
    } catch (error) {
      console.error('AI处理失败:', error);
      // 降级处理：简单清理
      return text.replace(/嗯+|啊+|呃+|那个+|就是+/gi, '').trim();
    }
  };

  const handleHintClick = (hint) => {
    if (!currentQuestion) return;
    
    const currentValue = answers[currentQuestion.id];
    const newValue = currentValue ? `${currentValue}\n${hint}` : hint;
    handleInputChange(newValue);
  };

  const handleNext = async () => {
    if (step < MORNING_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      console.log('晨间唤醒完成', answers);
      const today = new Date().toDateString();
      saveUserData('morning', today, answers);
      const streakData = updateStreak(today);
      console.log('连续记录天数:', streakData.streak);

      // 早间不展示今日萤火卡片，留到晚间完成后统一展示
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const isAnswerValid = () => {
    if (!currentQuestion) return false;
    return answers[currentQuestion.id] && answers[currentQuestion.id].trim().length > 0;
  };

  // 昨日约定提醒页面
  if (step === -1 && showPromiseReminder) {
    return (
      <div className="glass-card yesterday-promise-card">
        <button
          type="button"
          className="btn-back-top"
          onClick={() => onComplete()}
          aria-label="返回"
        >
          ← 返回
        </button>
        <div className="promise-reminder-content">
          <div className="promise-icon-large">💫</div>
          <h2 className="promise-reminder-title">早安，还记得吗？</h2>
          <p className="promise-reminder-subtitle">昨晚你轻轻对自己说...</p>
          
          <div className="promise-text-box">
            <span className="promise-quote">"</span>
            <p className="promise-text">{yesterdayPromise}</p>
            <span className="promise-quote">"</span>
          </div>

          <p className="promise-question">现在感觉怎么样？</p>

          <div className="promise-choices">
            <button 
              className="promise-choice-btn achieved"
              onClick={() => {
                setShowPromiseReminder(false);
                setStep(0);
              }}
            >
              <span className="choice-icon">✨</span>
              <span className="choice-text">嗯，我做到了</span>
            </button>

            <button 
              className="promise-choice-btn adjust"
              onClick={() => {
                setShowPromiseReminder(false);
                setStep(0);
              }}
            >
              <span className="choice-icon">🔄</span>
              <span className="choice-text">今天想换个方式</span>
            </button>

            <button 
              className="promise-choice-btn skip"
              onClick={() => {
                setShowPromiseReminder(false);
                setStep(0);
              }}
            >
              <span className="choice-icon">🍃</span>
              <span className="choice-text">轻轻跳过，没关系</span>
            </button>
          </div>

          <p className="promise-footer-note">
            不管选哪个，你都做得很好 💜
          </p>
        </div>
      </div>
    );
  }

  // 如果 currentQuestion 为 null（不应该发生，但作为安全检查）
  if (!currentQuestion) {
    return (
      <div className="glass-card">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      {/* 语音录音时的呼吸灯效果 */}
      {isRecording && <div className="breathing-light"></div>}

      {/* 进度指示器 */}
      <div className="progress-dots">
        {MORNING_QUESTIONS.map((_, index) => (
          <div 
            key={index} 
            className={`progress-dot ${index === step ? 'active' : ''}`}
          />
        ))}
      </div>

      {/* 问题标题 */}
      <h2 className="question-title">{currentQuestion.title}</h2>
      <p className="question-subtitle">{currentQuestion.subtitle}</p>

      {/* 动态引导提示 */}
      {showDynamicHint && (
        <div className="dynamic-hint-popup">
          <span className="hint-icon">💡</span>
          <span className="hint-text">{dynamicHint}</span>
        </div>
      )}

      {/* 根据问题类型显示不同的输入方式 */}
      {currentQuestion.type === 'cards' ? (
        <>
          {/* 输入框（卡片问题也改为输入） */}
          <div className="input-container">
            <textarea
              className="input-area"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id]}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={resetIdleTimer}
            />
            
            {/* 提示词按钮 */}
            {currentQuestion.options && (
              <button 
                className="btn-toggle-hints"
                onClick={() => setShowHints(!showHints)}
              >
                <span className="hint-icon">💡</span>
                <span>{showHints ? '收起提示' : '查看提示'}</span>
              </button>
            )}

            {/* 提示词卡片（折叠显示） */}
            {showHints && currentQuestion.options && (
              <div className="affirmation-cards">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className="affirmation-card"
                    onClick={() => {
                      handleInputChange(option);
                      setShowHints(false); // 选择后自动收起
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}

            {/* 长按说话按钮 */}
            <div className="voice-input-area">
              <div className="input-mode-divider">
                <span>或</span>
              </div>
              <button
                className={`voice-long-press ${isRecording ? 'recording' : ''}`}
                onClick={handleVoiceInput}
              >
                <span className="voice-icon">{isRecording ? '🎙️' : '🎤'}</span>
                <span className="voice-text">
                  {isRecording ? '录音中...' : '点击录音'}
                </span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 输入区域 */}
          <div className="input-container">
            <textarea
              className="input-area"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id]}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={resetIdleTimer}
            />
            
            {/* 提示词按钮 */}
            {currentQuestion.hints && (
              <button 
                className="btn-toggle-hints"
                onClick={() => setShowHints(!showHints)}
              >
                <span className="hint-icon">💡</span>
                <span>{showHints ? '收起提示' : '需要灵感？'}</span>
              </button>
            )}

            {/* AI 提示气泡（折叠显示） */}
            {showHints && currentQuestion.hints && (
              <div className="hints-container collapsible">
                {/* 从提示列表中随机选择6个显示 */}
                {currentQuestion.hints
                  .sort(() => Math.random() - 0.5)
                  .slice(0, 6)
                  .map((hint, index) => (
                    <div
                      key={index}
                      className="ai-hint"
                      onClick={() => {
                        handleHintClick(hint);
                        // 选择后不自动收起，方便多选
                      }}
                    >
                      {hint}
                    </div>
                  ))}
              </div>
            )}

            {/* 长按说话按钮 */}
            <div className="voice-input-area">
              <div className="input-mode-divider">
                <span>或</span>
              </div>
              <button
                className={`voice-long-press ${isRecording ? 'recording' : ''}`}
                onClick={handleVoiceInput}
              >
                <span className="voice-icon">{isRecording ? '🎙️' : '🎤'}</span>
                <span className="voice-text">
                  {isRecording ? '录音中...' : '点击录音'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 按钮区域：每一页都有回退 */}
      <div className="btn-container">
        {step > 0 ? (
          <button className="btn btn-secondary" onClick={handleBack}>
            上一步
          </button>
        ) : (
          <button className="btn btn-secondary" onClick={() => onComplete()}>
            返回
          </button>
        )}
        <button 
          className="btn btn-primary" 
          onClick={handleNext}
          disabled={!isAnswerValid()}
        >
          {step === MORNING_QUESTIONS.length - 1 ? '完成' : '下一步'}
        </button>
      </div>
    </div>
  );
}

export default MorningRoutine;
