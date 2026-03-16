import React, { useState, useEffect } from 'react';
import JarOpeningAnimation from '../Achievement/JarOpeningAnimation';
import ReminderBottomSheet from './ReminderBottomSheet';
import { getHappinessJarData, getTodayProgress, canOpenNewJar } from '../../utils/achievementHelpers';
import { getReminderSettings, requestNotificationPermission } from '../../utils/reminderHelpers';

function Welcome({ userData, theme, onModeSelect, onOpenShare, onSwitchToGalaxy }) {
  const [showJarAnimation, setShowJarAnimation] = useState(false);
  const [shouldPromptJar, setShouldPromptJar] = useState(false);
  const [jarProgress, setJarProgress] = useState(0);
  const [showFireflyDrop, setShowFireflyDrop] = useState(false);
  const [todayProgress, setTodayProgress] = useState({ hasMorning: false, hasEvening: false });
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const [reminderToast, setReminderToast] = useState(null);
  const [reminderSummary, setReminderSummary] = useState({ hasAny: false, label: '' });

  useEffect(() => {
    // 获取罐子进度
    const jarData = getHappinessJarData();
    setJarProgress(jarData.nextJarProgress);

    // 获取今日完成情况
    const today = getTodayProgress();
    setTodayProgress(today);

    // 检查是否可以开启新罐子
    if (canOpenNewJar()) {
      setShouldPromptJar(true);
    }

    // 提醒摘要（用于铃铛显示）
    const rem = getReminderSettings();
    const parts = [];
    if (rem.morningEnabled) parts.push(`晨 ${rem.morningTime}`);
    if (rem.eveningEnabled) parts.push(`夜 ${rem.eveningTime}`);
    setReminderSummary({
      hasAny: parts.length > 0,
      label: parts.length ? parts.join(' · ') : '',
    });

    // 检查是否是第一次访问（可以用localStorage判断）
    const hasVisited = localStorage.getItem('hasVisitedGlimmer');
    if (!hasVisited) {
      localStorage.setItem('hasVisitedGlimmer', 'true');
      // 延迟1秒后播放萤火虫坠落动画
      setTimeout(() => {
        setShowFireflyDrop(true);
      }, 1000);
    }
  }, []);

  const handleOpenJar = () => {
    setShowJarAnimation(true);
    setShouldPromptJar(false);
  };

  const handleCloseJar = () => {
    setShowJarAnimation(false);
  };

  const handleResetOnboarding = () => {
    if (window.confirm('确定要重置引导吗？这将清除所有数据并回到欢迎页面。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const safeRemoveOverlay = (overlay) => {
    try {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch (_) {}
  };

  const handleMorningClick = () => {
    const overlay = document.createElement('div');
    overlay.className = 'morning-mist-overlay';
    document.body.appendChild(overlay);

    setTimeout(() => {
      safeRemoveOverlay(overlay);
      onModeSelect('morning');
    }, 1000);
  };

  const handleEveningClick = () => {
    // 萤火虫涌出动画
    const overlay = document.createElement('div');
    overlay.className = 'evening-fireflies-overlay';
    document.body.appendChild(overlay);

    // 创建多个萤火虫
    for (let i = 0; i < 15; i++) {
      const firefly = document.createElement('div');
      firefly.className = 'swarm-firefly';
      firefly.style.left = `${Math.random() * 100}%`;
      firefly.style.animationDelay = `${Math.random() * 0.5}s`;
      overlay.appendChild(firefly);
    }

    setTimeout(() => {
      safeRemoveOverlay(overlay);
      onModeSelect('evening');
    }, 1200);
  };

  const handleReminderSaved = ({ morningEnabled, morningTime, eveningEnabled, eveningTime }) => {
    const parts = [];
    if (morningEnabled) parts.push(`晨 ${morningTime}`);
    if (eveningEnabled) parts.push(`夜 ${eveningTime}`);
    setReminderSummary({
      hasAny: parts.length > 0,
      label: parts.length ? parts.join(' · ') : '',
    });
    const msg = parts.length
      ? `已为你定好 ${parts.join('、')} 的微光邀约`
      : '已更新提醒设置';
    setReminderToast(msg);
    setTimeout(() => setReminderToast(null), 2500);
    if (morningEnabled || eveningEnabled) {
      requestNotificationPermission();
    }
  };

  return (
    <>
      <div className="glimmer-welcome-container">
        <button className="btn-reset-onboarding" onClick={handleResetOnboarding} title="重置引导">
          🔄
        </button>

        {/* 背景萤火虫 */}
        <div className="ambient-firefly"></div>
        <div className="ambient-firefly"></div>
        <div className="ambient-firefly"></div>
        <div className="ambient-firefly"></div>

        {/* 顶部：昵称与契约 */}
        <div className="welcome-header">
          <h2 className="welcome-contract">
            我们一起走一段温柔的练习之旅
          </h2>
          <p className="welcome-promise">
            每天 5 分钟，为自己创造一点光亮。
          </p>
          <button
            type="button"
            className={`reminder-bell-btn ${reminderSummary.hasAny ? 'has-reminder' : ''}`}
            onClick={() => setShowReminderSheet(true)}
            title="提醒设置"
          >
            <span className="bell-icon">🔔</span>
            {reminderSummary.hasAny ? reminderSummary.label : '开启提醒'}
          </button>
        </div>

        {/* 中部：7天拾光沙漏 */}
        <div className="hourglass-section">
          <div className="hourglass-7day">
            {/* 沙漏框架 */}
            <svg className="hourglass-frame" viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg">
              {/* 顶部 */}
              <line x1="30" y1="20" x2="90" y2="20" stroke="rgba(186, 148, 255, 0.4)" strokeWidth="1.5" />
              <line x1="30" y1="20" x2="60" y2="90" stroke="rgba(186, 148, 255, 0.4)" strokeWidth="1.5" />
              <line x1="90" y1="20" x2="60" y2="90" stroke="rgba(186, 148, 255, 0.4)" strokeWidth="1.5" />
              
              {/* 底部 */}
              <line x1="60" y1="90" x2="30" y2="160" stroke="rgba(186, 148, 255, 0.4)" strokeWidth="1.5" />
              <line x1="60" y1="90" x2="90" y2="160" stroke="rgba(186, 148, 255, 0.4)" strokeWidth="1.5" />
              <line x1="30" y1="160" x2="90" y2="160" stroke="rgba(186, 148, 255, 0.4)" strokeWidth="1.5" />

              {/* 7个刻度线 */}
              {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                const y = 160 - (index * 10);
                const xLeft = 30 + (30 - index * 4.3);
                const xRight = 90 - (30 - index * 4.3);
                return (
                  <line
                    key={index}
                    x1={xLeft}
                    y1={y}
                    x2={xRight}
                    y2={y}
                    stroke={index < jarProgress ? "rgba(186, 148, 255, 0.6)" : "rgba(186, 148, 255, 0.2)"}
                    strokeWidth="0.5"
                  />
                );
              })}
            </svg>

            {/* 底部萤火虫 */}
            <div className="hourglass-fireflies">
              <div className="hourglass-firefly" style={{ left: '40%', animationDelay: '0s' }}></div>
              <div className="hourglass-firefly" style={{ left: '50%', animationDelay: '1s' }}></div>
              <div className="hourglass-firefly" style={{ left: '60%', animationDelay: '2s' }}></div>
            </div>

            {/* 第一次访问时的萤火虫坠落 */}
            {showFireflyDrop && (
              <div className="dropping-firefly"></div>
            )}

            {/* 填充的萤火虫（根据进度） */}
            {Array.from({ length: jarProgress }).map((_, index) => (
              <div
                key={index}
                className="filled-firefly"
                style={{
                  bottom: `${30 + index * 14}px`,
                  left: `${45 + Math.random() * 10}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>

          {/* 进度提示 */}
          <p className="hourglass-hint">
            每完成 7 次觉察，沙漏将注满，为你开启拾光罐。
          </p>
          <p className="hourglass-sub-hint">
            （一次觉察 = 早间记录 + 晚间记录）
          </p>
          <p className="hourglass-progress">
            {jarProgress} / 7
          </p>

          {/* 今日完成情况 */}
          <div className="today-progress">
            <span className={`progress-indicator ${todayProgress.hasMorning ? 'completed' : ''}`}>
              ☀️ 早间 {todayProgress.hasMorning ? '✓' : '○'}
            </span>
            <span className="progress-separator">+</span>
            <span className={`progress-indicator ${todayProgress.hasEvening ? 'completed' : ''}`}>
              🌙 晚间 {todayProgress.hasEvening ? '✓' : '○'}
            </span>
            {todayProgress.isComplete && (
              <span className="complete-badge">✨ 今日已完成</span>
            )}
          </div>

          {/* 可以开启罐子的提示 */}
          {shouldPromptJar && (
            <button className="open-jar-prompt" onClick={handleOpenJar}>
              🎉 沙漏已满，点击开启拾光罐
            </button>
          )}
        </div>

        {/* 底部：日夜更替的双入口 */}
        <div className="day-night-selector">
          {/* 左侧：清晨 */}
          <button className="mode-portal morning-portal" onClick={handleMorningClick}>
            <div className="portal-background morning-bg"></div>
            <div className="portal-content">
              <span className="portal-icon">☀️</span>
              <span className="portal-label">开启清晨</span>
              <span className="portal-subtitle">设定今天的色调</span>
            </div>
          </button>

          {/* 右侧：夜晚 */}
          <button className="mode-portal evening-portal" onClick={handleEveningClick}>
            <div className="portal-background evening-bg">
              {/* 星尘闪烁 */}
              <div className="stardust"></div>
              <div className="stardust"></div>
              <div className="stardust"></div>
            </div>
            <div className="portal-content">
              <span className="portal-icon">🌙</span>
              <span className="portal-label">开启夜晚</span>
              <span className="portal-subtitle">捕捉存下的微光</span>
            </div>
          </button>
        </div>
      </div>

      {/* 罐子开启动画 */}
      {showJarAnimation && (
        <JarOpeningAnimation onClose={handleCloseJar} />
      )}

      <ReminderBottomSheet
        open={showReminderSheet}
        onClose={() => setShowReminderSheet(false)}
        onSaved={handleReminderSaved}
      />
      {reminderToast && (
        <div className="reminder-toast" role="status">
          {reminderToast}
        </div>
      )}
    </>
  );
}

export default Welcome;
