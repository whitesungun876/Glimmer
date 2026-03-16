import React from 'react';
import { getStreakData } from '../../utils/achievementHelpers';

/**
 * 坚持计数器组件
 */
function StreakCounter() {
  const streakData = getStreakData();

  return (
    <div className={`streak-counter ${streakData.isDimmed ? 'dimmed' : ''}`}>
      <div className="streak-flame">
        {streakData.streak > 0 ? '🔥' : '💤'}
      </div>
      <div className="streak-content">
        <div className="streak-number">{streakData.streak}</div>
        <div className="streak-label">
          {streakData.streak === 0 ? '开始记录' : '天连续记录'}
        </div>
        {streakData.isDimmed && (
          <div className="streak-hint">
            <span className="hint-icon">⚠️</span>
            <span className="hint-text">使用了补签机会</span>
          </div>
        )}
        {!streakData.canMakeup && streakData.streak > 0 && (
          <div className="streak-hint">
            <span className="hint-icon">💡</span>
            <span className="hint-text">本周期补签已用</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StreakCounter;
