import React, { useState, useEffect } from 'react';
import { speechToText, extractCoreEvents, saveUserData } from '../../utils/aiHelpers';
import { updateStreak } from '../../utils/achievementHelpers';
import { getOrCreateUserId } from '../../utils/inviteHelpers';
import { fetchFriends } from '../../utils/resonanceApi';
import { projectEnergy } from '../../utils/energyApi';
import { generateDailySpark } from '../../utils/dailySparkApi';
import { buildFallbackSpark } from '../../utils/dailySparkFallback';
import DailySparkCard from '../DailySpark/DailySparkCard';

const EVENING_QUESTIONS = [
  {
    id: 'good_things',
    title: '在结束这一天前，记下三件让你觉得还不错的事。',
    subtitle: '可以很小，可以很平常...',
    hints: [
      '中午吃到了很喜欢的菜',
      '和同事聊天很开心',
      '完成了一件事',
      '看到了美丽的晚霞',
      '睡了个午觉',
      '收到了朋友的消息'
    ],
    placeholders: [
      '第一件好事...',
      '第二件好事...',
      '第三件好事...'
    ],
    multipleInputs: 3  // 3个独立输入框
  },
  {
    id: 'improvement',
    title: '今天，有没有什么小小的发现？',
    subtitle: '任何想法都可以，不需要评判...',
    hints: [
      '原来中午休息一会儿，下午会更有精神',
      '和朋友聊天会让心情变好',
      '发现自己在安静的时候更能集中注意力',
      '慢一点做事反而更有效率',
      '给自己留点空白时间很重要',
      '运动之后整个人状态都不一样'
    ],
    placeholder: '比如：发现自己早上的工作效率特别高...'
  },
  {
    id: 'tomorrow',
    title: '明天，你想为自己做一件小事吗？',
    subtitle: '可以很小，也可以不做...',
    hints: [
      '早起 10 分钟做个伸展',
      '带一份自己喜欢的午餐',
      '出门前整理一下桌面',
      '睡前不看手机',
      '给自己买一杯好咖啡',
      '路过公园时停留一会儿'
    ],
    placeholder: '比如：明天早上给自己做一份喜欢的早餐...'
  }
];

function EveningRoutine({ userData, theme, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    good_things: ['', '', ''],  // 3个独立的好事
    improvement: '',
    tomorrow: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [idleTimer, setIdleTimer] = useState(null);
  const [showDynamicHint, setShowDynamicHint] = useState(false);
  const [dynamicHint, setDynamicHint] = useState('');
  const [showHints, setShowHints] = useState(false); // 控制提示词显示/隐藏
  // 晚间捕光完成页：Glimmer_Core + 投射能量给好友
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [projected, setProjected] = useState(false);
  const [projecting, setProjecting] = useState(false);
  const [showSparkCard, setShowSparkCard] = useState(false);
  const [sparkData, setSparkData] = useState(null);
  const [sparkLoading, setSparkLoading] = useState(false);

  const currentQuestion = EVENING_QUESTIONS[step];

  const handleInputChange = (value, index = null) => {
    // 如果有 index，说明是多输入框模式（如3件好事）
    if (index !== null && Array.isArray(answers[currentQuestion.id])) {
      const newArray = [...answers[currentQuestion.id]];
      newArray[index] = value;
      setAnswers({
        ...answers,
        [currentQuestion.id]: newArray
      });
    } else {
      // 普通单输入框模式
      setAnswers({
        ...answers,
        [currentQuestion.id]: value
      });
    }
    
    // 重置空闲计时器
    resetIdleTimer();
    setShowDynamicHint(false);
  };

  // 空闲检测：10秒未输入时显示动态引导
  const resetIdleTimer = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }
    
    const timer = setTimeout(() => {
      const answer = answers[currentQuestion.id];
      let isEmpty = false;
      
      // 检查答案是否为空
      if (Array.isArray(answer)) {
        // 如果是数组，检查是否所有项都为空
        isEmpty = answer.every(item => !item || item.trim().length === 0);
      } else {
        // 如果是字符串，检查是否为空
        isEmpty = !answer || answer.trim().length === 0;
      }
      
      if (isEmpty) {
        showDynamicGuidance();
      }
    }, 10000); // 10秒
    
    setIdleTimer(timer);
  };

  const showDynamicGuidance = () => {
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
    resetIdleTimer();
    
    return () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleHintClick = (hint) => {
    // 如果是多输入框模式（如3件好事），找到第一个空框填充
    if (currentQuestion.multipleInputs && Array.isArray(answers[currentQuestion.id])) {
      const emptyIndex = answers[currentQuestion.id].findIndex(item => !item || item.trim().length === 0);
      
      if (emptyIndex !== -1) {
        // 找到空框，填充
        handleInputChange(hint, emptyIndex);
      } else {
        // 所有框都满了，提示用户
        alert('3个框都已填写，如需修改请直接编辑输入框');
      }
    } else {
      // 单输入框模式：追加或替换
      const currentValue = answers[currentQuestion.id];
      const newValue = currentValue ? `${currentValue}\n${hint}` : hint;
      handleInputChange(newValue);
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    
    try {
      const text = await speechToText();
      
      // AI 处理语音文本（美化和提取）
      const processedText = await processVoiceText(text);
      
      // 如果是多输入框模式（如3件好事），找到第一个空框填充
      if (currentQuestion.multipleInputs && Array.isArray(answers[currentQuestion.id])) {
        const emptyIndex = answers[currentQuestion.id].findIndex(item => !item || item.trim().length === 0);
        
        if (emptyIndex !== -1) {
          // 找到空框，填充
          handleInputChange(processedText, emptyIndex);
        } else {
          // 所有框都满了，提示用户
          alert('3个框都已填写，如需修改请直接编辑输入框');
        }
      } else {
        // 单输入框模式
        handleInputChange(processedText);
      }
      
      setIsRecording(false);
    } catch (error) {
      console.error('语音识别错误:', error);
      alert('语音识别失败，请检查麦克风权限或使用文字输入');
      setIsRecording(false);
    }
  };

  // AI 处理语音文本 - 提取好事并美化
  const processVoiceText = async (text) => {
    try {
      // 调用增强的AI处理函数
      const { beautifyWithAI, extractCoreEvents } = await import('../../utils/aiHelpers');
      
      // 根据当前问题类型选择处理方式
      if (currentQuestion.id === 'good_things') {
        // 好事记录：使用专门的提取逻辑
        const processed = await beautifyWithAI(text, 'good_things');
        
        // 如果返回的是多行，格式化为编号列表
        const lines = processed.split('\n').filter(line => line.trim());
        if (lines.length > 1) {
          return lines.map((line, i) => `${i + 1}. ${line.trim()}`).join('\n');
        }
        return processed;
      } else {
        // 其他问题：使用核心事件提取
        return extractCoreEvents(text);
      }
    } catch (error) {
      console.error('AI处理失败:', error);
      // 降级处理：简单清理
      return text.replace(/嗯+|啊+|呃+|那个+|就是+/gi, '').trim();
    }
  };

  const handleNext = async () => {
    if (step < EVENING_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const goodThingsText = Array.isArray(answers.good_things)
        ? answers.good_things.filter(item => item.trim()).join('\n')
        : answers.good_things;
      const processedAnswers = {
        ...answers,
        good_things: goodThingsText,
        good_things_extracted: extractCoreEvents(goodThingsText),
      };
      console.log('晚间复盘完成', processedAnswers);
      const today = new Date().toDateString();
      saveUserData('evening', today, processedAnswers);
      const streakData = updateStreak(today);
      console.log('连续记录天数:', streakData.streak);

      const eveningText = [goodThingsText, answers.improvement, answers.tomorrow].filter(Boolean).join('\n');
      const userId = getOrCreateUserId();
      const apiBase = process.env.REACT_APP_API_URL || '';
      // 尝试合并当日早间内容，生成「一天一张」的今日萤火
      let sourceText = eveningText;
      try {
        const morningKey = `morning_${today}`;
        const morningRaw = localStorage.getItem(morningKey);
        if (morningRaw) {
          const morningData = JSON.parse(morningRaw);
          const morningPart = [morningData.grateful, morningData.intention, morningData.affirmation].filter(Boolean).join('\n');
          if (morningPart) sourceText = `【晨间】\n${morningPart}\n\n【晚间】\n${eveningText}`;
        }
      } catch (_) {}
      if (sourceText && userId && apiBase) {
        setSparkLoading(true);
        try {
          const spark = await generateDailySpark({
            user_id: userId,
            entry_type: 'evening',
            source_text: sourceText,
            user_name: userData?.name,
          });
          setSparkLoading(false);
          if (spark && (spark.daily_spark_image_url || spark.summary_sentence)) {
            setSparkData(spark);
            setShowSparkCard(true);
            return;
          }
        } catch (e) {
          setSparkLoading(false);
          console.warn('今日萤火后端请求失败，使用本地兜底', e);
        }
      } else if (!apiBase) {
        console.warn('今日萤火：未配置 REACT_APP_API_URL，使用本地兜底。请在 .env 中设置并重新 build。');
      }
      // 后端未配置或失败时，用本地生成的今日萤火卡片
      if (sourceText) {
        setSparkData(buildFallbackSpark(sourceText, userData?.name));
        setShowSparkCard(true);
        return;
      }
      setShowCompletionScreen(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const isAnswerValid = () => {
    const answer = answers[currentQuestion.id];
    
    // 如果是数组（如3件好事），检查是否至少有一项有内容
    if (Array.isArray(answer)) {
      return answer.some(item => item && item.trim().length > 0);
    }
    
    // 如果是字符串，检查是否有内容
    return answer && answer.trim().length > 0;
  };

  if (showSparkCard && sparkData) {
    return (
      <DailySparkCard
        spark={sparkData}
        userName={userData?.name}
        onClose={() => {
          setShowSparkCard(false);
          setShowCompletionScreen(true);
        }}
      />
    );
  }

  // 完成页：今日捕光已完成，获得 1 枚萤火，可投射给好友
  if (showCompletionScreen) {
    const openFriendPicker = () => {
      setShowFriendPicker(true);
      setFriends([]);
      setFriendsLoading(true);
      const myId = getOrCreateUserId();
      fetchFriends(myId).then((list) => {
        setFriends(list);
        setFriendsLoading(false);
      });
    };
    const handleProjectToFriend = async (friendId) => {
      const myId = getOrCreateUserId();
      if (!myId || !friendId) return;
      setProjecting(true);
      const ok = await projectEnergy(myId, friendId);
      setProjecting(false);
      if (ok) {
        setProjected(true);
        setShowFriendPicker(false);
      } else {
        alert('今日已投射过或网络异常，明日再来试试');
      }
    };
    return (
      <div className="glass-card evening-completion-card" style={{ position: 'relative' }}>
        <h2 className="question-title">今日捕光已完成 ✨</h2>
        <p className="evening-completion-desc">你获得 1 枚萤火，可以投射给好友。</p>
        <div className="evening-completion-actions">
          {!projected ? (
            <>
              <button type="button" className="btn btn-primary" onClick={openFriendPicker} disabled={projecting}>
                {projecting ? '投射中…' : '投射能量给好友'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => onComplete()}>
                返回首页
              </button>
            </>
          ) : (
            <>
              <p className="evening-completion-done">已投射！愿你与好友的星空都更亮一点。</p>
              <button type="button" className="btn btn-primary" onClick={() => onComplete()}>
                返回首页
              </button>
            </>
          )}
        </div>
        {showFriendPicker && (
          <div className="evening-friend-picker-backdrop" onClick={() => setShowFriendPicker(false)}>
            <div className="evening-friend-picker-card" onClick={(e) => e.stopPropagation()}>
              <h3 className="evening-friend-picker-title">选择好友，投掷一枚萤火</h3>
              {friendsLoading ? (
                <p className="evening-friend-picker-loading">加载中…</p>
              ) : friends.length === 0 ? (
                <p className="evening-friend-picker-empty">暂无好友，邀请好友一起记录拾光即可投射</p>
              ) : (
                <ul className="evening-friend-picker-list">
                  {friends.map((friendId) => (
                    <li key={friendId}>
                      <button
                        type="button"
                        className="evening-friend-picker-item"
                        onClick={() => handleProjectToFriend(friendId)}
                        disabled={projecting}
                      >
                        <span className="evening-friend-avatar">{friendId.slice(0, 1).toUpperCase()}</span>
                        <span className="evening-friend-name">{friendId.slice(0, 12)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn btn-secondary evening-friend-picker-close" onClick={() => setShowFriendPicker(false)}>
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ position: 'relative' }}>
      {sparkLoading && (
        <div className="daily-spark-loading-overlay">
          <p>生成今日萤火中…</p>
        </div>
      )}
      {/* 语音录音时的呼吸灯效果 */}
      {isRecording && <div className="breathing-light"></div>}

      {/* 进度指示器 */}
      <div className="progress-dots">
        {EVENING_QUESTIONS.map((_, index) => (
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

      {/* 输入区域 */}
      <div className="input-container">
        {/* 多输入框模式（如3件好事） */}
        {currentQuestion.multipleInputs ? (
          <div className="multiple-inputs-wrapper">
            {Array.from({ length: currentQuestion.multipleInputs }).map((_, index) => (
              <div key={index} className="single-input-group">
                <label className="input-label">第 {index + 1} 件</label>
                <textarea
                  className="input-area multiple-input"
                  placeholder={currentQuestion.placeholders ? currentQuestion.placeholders[index] : `第 ${index + 1} 件好事...`}
                  value={answers[currentQuestion.id][index]}
                  onChange={(e) => handleInputChange(e.target.value, index)}
                  onFocus={resetIdleTimer}
                  rows={1}
                />
              </div>
            ))}
          </div>
        ) : (
          /* 单输入框模式 */
          <textarea
            className="input-area"
            placeholder={currentQuestion.placeholder}
            value={answers[currentQuestion.id]}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={resetIdleTimer}
            style={{ minHeight: currentQuestion.multiline ? '180px' : '120px' }}
          />
        )}
        
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
            {currentQuestion.hints.slice(0, 6).map((hint, index) => (
              <div
                key={index}
                className="ai-hint"
                onClick={() => handleHintClick(hint)}
              >
                {hint}
              </div>
            ))}
          </div>
        )}

        {/* 语音输入按钮 */}
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
              {isRecording ? '录音中...' : (currentQuestion.multipleInputs ? '点击录音（依次填充）' : '点击录音')}
            </span>
          </button>
          {currentQuestion.multipleInputs && (
            <div className="voice-hint-text">
              语音会自动填充到下一个空框
            </div>
          )}
        </div>
      </div>

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
          {step === EVENING_QUESTIONS.length - 1 ? '完成今日复盘' : '下一步'}
        </button>
      </div>
    </div>
  );
}

export default EveningRoutine;
