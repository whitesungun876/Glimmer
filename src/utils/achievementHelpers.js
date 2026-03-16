/**
 * 成就系统工具函数
 * 管理坚持天数、幸福罐子等
 */

/**
 * 获取连续记录天数
 * @returns {Object} { streak: 连续天数, lastDate: 最后记录日期, canMakeup: 是否可以补签 }
 */
export const getStreakData = () => {
  const streakData = localStorage.getItem('streakData');
  
  if (!streakData) {
    return {
      streak: 0,
      lastDate: null,
      canMakeup: true,
      isDimmed: false,
      brokenAt: null
    };
  }
  
  return JSON.parse(streakData);
};

/**
 * 更新连续记录天数
 * @param {string} date - 记录日期
 */
export const updateStreak = (date) => {
  const today = new Date(date).toDateString();
  const streakData = getStreakData();
  
  // 如果是今天已经记录过，不重复计算
  if (streakData.lastDate === today) {
    return streakData;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  
  let newStreakData = { ...streakData };
  
  if (!streakData.lastDate) {
    // 第一次记录
    newStreakData = {
      streak: 1,
      lastDate: today,
      canMakeup: true,
      isDimmed: false,
      brokenAt: null
    };
  } else if (streakData.lastDate === yesterdayStr) {
    // 连续记录
    newStreakData = {
      streak: streakData.streak + 1,
      lastDate: today,
      canMakeup: true,
      isDimmed: false,
      brokenAt: null
    };
  } else if (streakData.lastDate === today) {
    // 今天已经记录过
    return streakData;
  } else {
    // 中断了
    const daysDiff = Math.floor((new Date(today) - new Date(streakData.lastDate)) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 2 && streakData.canMakeup) {
      // 漏了一天，且有补签机会
      newStreakData = {
        streak: streakData.streak + 1,
        lastDate: today,
        canMakeup: false, // 使用了补签机会
        isDimmed: true,   // 变暗提示
        brokenAt: null
      };
    } else {
      // 中断了，从1开始
      newStreakData = {
        streak: 1,
        lastDate: today,
        canMakeup: true,
        isDimmed: false,
        brokenAt: new Date().toISOString()
      };
    }
  }
  
  localStorage.setItem('streakData', JSON.stringify(newStreakData));
  
  // 触发成就检查
  checkAchievements(newStreakData.streak);
  
  return newStreakData;
};

/**
 * 手动补签
 * @returns {Object} 更新后的 streakData
 */
export const makeupStreak = () => {
  const streakData = getStreakData();
  
  if (!streakData.canMakeup) {
    return {
      success: false,
      message: '本周期已使用过补签机会'
    };
  }
  
  const newStreakData = {
    ...streakData,
    canMakeup: false,
    isDimmed: false
  };
  
  localStorage.setItem('streakData', JSON.stringify(newStreakData));
  
  return {
    success: true,
    message: '补签成功！',
    data: newStreakData
  };
};

/**
 * 获取幸福罐子数据
 * @returns {Object} { totalRecords: 完整瞬间数, jarsOpened: 已开启罐子数, nextJarProgress: 下次罐子进度 }
 */
export const getHappinessJarData = () => {
  // 统计所有完整瞬间（早+晚）
  const totalRecords = getTotalRecordsCount();
  const jarsOpened = Math.floor(totalRecords / 7);
  const nextJarProgress = totalRecords % 7;
  
  return {
    totalRecords,           // 完整瞬间数（早+晚都完成的天数）
    jarsOpened,             // 已开启的罐子数
    nextJarProgress,        // 当前进度（0-7）
    progressPercent: (nextJarProgress / 7) * 100
  };
};

/**
 * 获取今日完成情况
 * @returns {Object} 今日早间和晚间的完成状态
 */
export const getTodayProgress = () => {
  const today = new Date().toDateString();
  const morningKey = `morning_${today}`;
  const eveningKey = `evening_${today}`;
  
  const hasMorning = !!localStorage.getItem(morningKey);
  const hasEvening = !!localStorage.getItem(eveningKey);
  
  return {
    hasMorning,
    hasEvening,
    isComplete: hasMorning && hasEvening,
    needsMorning: !hasMorning,
    needsEvening: !hasEvening
  };
};

/**
 * 获取总记录数（完整天数）
 * 只有早间+晚间都完成的那一天才算1个瞬间
 */
export const getTotalRecordsCount = () => {
  let count = 0;
  const keys = Object.keys(localStorage);
  
  // 提取所有日期
  const dates = new Set();
  keys.forEach(key => {
    if (key.startsWith('morning_') || key.startsWith('evening_')) {
      const date = key.replace('morning_', '').replace('evening_', '');
      dates.add(date);
    }
  });
  
  // 检查每个日期是否同时有早间和晚间记录
  dates.forEach(date => {
    const hasMorning = localStorage.getItem(`morning_${date}`);
    const hasEvening = localStorage.getItem(`evening_${date}`);
    
    // 早+晚都有才算1个完整瞬间
    if (hasMorning && hasEvening) {
      count++;
    }
  });
  
  return count;
};

/**
 * 检查是否可以开启新罐子
 * @returns {boolean} 是否可以开启
 */
export const canOpenNewJar = () => {
  const jarData = getHappinessJarData();
  const lastOpenedJar = localStorage.getItem('lastOpenedJar');
  
  if (!lastOpenedJar) {
    return jarData.totalRecords >= 7;
  }
  
  const lastCount = parseInt(lastOpenedJar);
  return jarData.totalRecords >= lastCount + 7;
};

/**
 * 随机选取3条好事记录
 * @returns {Array} 3条记录
 */
export const getRandomGoodThings = () => {
  const allRecords = [];
  const keys = Object.keys(localStorage);
  
  // 收集所有晚间记录的好事
  keys.forEach(key => {
    if (key.startsWith('evening_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data.good_things) {
          allRecords.push({
            date: key.replace('evening_', ''),
            content: data.good_things,
            extracted: data.good_things_extracted || data.good_things
          });
        }
      } catch (error) {
        console.error('解析记录失败:', error);
      }
    }
  });
  
  // 随机选择3条
  const shuffled = allRecords.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
};

/**
 * 标记罐子已开启
 */
export const markJarAsOpened = () => {
  const jarData = getHappinessJarData();
  localStorage.setItem('lastOpenedJar', jarData.totalRecords.toString());
  
  // 记录开罐历史
  const history = getJarHistory();
  history.push({
    openedAt: new Date().toISOString(),
    totalRecords: jarData.totalRecords,
    jarNumber: jarData.jarsOpened
  });
  localStorage.setItem('jarHistory', JSON.stringify(history));
};

/**
 * 获取开罐历史
 */
export const getJarHistory = () => {
  const history = localStorage.getItem('jarHistory');
  return history ? JSON.parse(history) : [];
};

/**
 * 检查成就
 * @param {number} streak - 当前连续天数
 */
export const checkAchievements = (streak) => {
  const milestones = [7, 14, 21, 30, 60, 90, 100, 365];
  const achievements = getAchievements();
  
  milestones.forEach(milestone => {
    if (streak === milestone && !achievements[`streak_${milestone}`]) {
      unlockAchievement(`streak_${milestone}`, {
        title: `坚持 ${milestone} 天`,
        description: '持续记录的力量',
        icon: getMilestoneIcon(milestone),
        unlockedAt: new Date().toISOString()
      });
    }
  });
};

/**
 * 获取里程碑图标
 */
const getMilestoneIcon = (days) => {
  if (days >= 365) return '🏆';
  if (days >= 100) return '💎';
  if (days >= 30) return '🌟';
  if (days >= 7) return '✨';
  return '⭐';
};

/**
 * 获取所有成就
 */
export const getAchievements = () => {
  const achievements = localStorage.getItem('achievements');
  return achievements ? JSON.parse(achievements) : {};
};

/**
 * 解锁成就
 */
export const unlockAchievement = (id, data) => {
  const achievements = getAchievements();
  achievements[id] = data;
  localStorage.setItem('achievements', JSON.stringify(achievements));
  
  // 触发成就通知
  showAchievementNotification(data);
};

/**
 * 显示成就通知
 */
const showAchievementNotification = (achievement) => {
  // 这里可以触发一个全局通知
  console.log('🎉 解锁成就:', achievement.title);
  
  // 保存到待显示队列
  const queue = getAchievementQueue();
  queue.push(achievement);
  localStorage.setItem('achievementQueue', JSON.stringify(queue));
};

/**
 * 获取待显示的成就队列
 */
export const getAchievementQueue = () => {
  const queue = localStorage.getItem('achievementQueue');
  return queue ? JSON.parse(queue) : [];
};

/**
 * 清空成就队列
 */
export const clearAchievementQueue = () => {
  localStorage.removeItem('achievementQueue');
};

/**
 * 获取统计数据
 */
export const getStatistics = () => {
  const streakData = getStreakData();
  const jarData = getHappinessJarData();
  const achievements = getAchievements();
  
  return {
    currentStreak: streakData.streak,
    maxStreak: getMaxStreak(),
    totalRecords: jarData.totalRecords,
    jarsOpened: jarData.jarsOpened,
    achievementsUnlocked: Object.keys(achievements).length,
    firstRecordDate: getFirstRecordDate(),
    lastRecordDate: streakData.lastDate
  };
};

/**
 * 获取最高连续天数
 */
const getMaxStreak = () => {
  const maxStreak = localStorage.getItem('maxStreak');
  const current = getStreakData().streak;
  
  if (!maxStreak || current > parseInt(maxStreak)) {
    localStorage.setItem('maxStreak', current.toString());
    return current;
  }
  
  return parseInt(maxStreak);
};

/**
 * 获取第一条记录日期
 */
const getFirstRecordDate = () => {
  const keys = Object.keys(localStorage);
  const recordKeys = keys.filter(k => k.startsWith('morning_') || k.startsWith('evening_'));
  
  if (recordKeys.length === 0) return null;
  
  const dates = recordKeys.map(k => {
    const dateStr = k.replace('morning_', '').replace('evening_', '');
    return new Date(dateStr);
  });
  
  dates.sort((a, b) => a - b);
  return dates[0].toDateString();
};

/**
 * 检查今天是否已记录
 */
export const hasRecordedToday = () => {
  const today = new Date().toDateString();
  const morningKey = 'morning_' + today;
  const eveningKey = 'evening_' + today;
  
  return {
    morning: !!localStorage.getItem(morningKey),
    evening: !!localStorage.getItem(eveningKey),
    any: !!localStorage.getItem(morningKey) || !!localStorage.getItem(eveningKey)
  };
};

const achievementHelpers = {
  getStreakData,
  updateStreak,
  makeupStreak,
  getHappinessJarData,
  getTodayProgress,
  canOpenNewJar,
  getRandomGoodThings,
  markJarAsOpened,
  getStatistics,
  hasRecordedToday
};

export default achievementHelpers;
