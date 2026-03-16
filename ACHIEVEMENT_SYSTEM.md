# 成就系统说明文档 🏆

## 概述

成就系统通过游戏化设计，激励用户持续记录，提升长期留存率。包含两个核心功能：

1. **坚持计数器** - 连续记录天数追踪
2. **7天幸福罐子** - 每7天解锁一次回顾

## 🔥 坚持计数器 (Persistence Counter)

### 功能特点

#### 1. 连续天数统计
- 每次完成晨间或晚间记录，自动+1
- 显示火焰图标🔥和数字
- 在首页显眼位置展示

#### 2. 智能容错机制

**漏掉一天不归零**：
```javascript
// 如果漏了一天，且有补签机会
if (daysDiff === 2 && streakData.canMakeup) {
  // 连续天数继续，但变暗提示
  streak = streak + 1;
  isDimmed = true;  // 视觉变暗
  canMakeup = false; // 使用了补签机会
}
```

**补签机制**：
- 每个周期有1次补签机会
- 使用后，计数器会变暗提示
- 保护用户的积极性，避免挫败感

#### 3. 视觉反馈

**正常状态**：
```
🔥 7
天连续记录
```

**使用补签后**：
```
🔥 7  (变暗)
天连续记录
⚠️ 使用了补签机会
```

**中断后**：
```
💤 0
开始记录
```

### 数据结构

```javascript
{
  streak: 7,              // 当前连续天数
  lastDate: 'Tue Jan 21', // 最后记录日期
  canMakeup: false,       // 是否还有补签机会
  isDimmed: true,         // 是否变暗显示
  brokenAt: null          // 中断时间（如果有）
}
```

### 里程碑成就

自动解锁以下成就：
- ✨ 坚持 7 天
- 🌟 坚持 14 天
- 🌟 坚持 21 天
- 💎 坚持 30 天
- 💎 坚持 60 天
- 💎 坚持 90 天
- 💎 坚持 100 天
- 🏆 坚持 365 天

## 🏺 7天幸福罐子 (The Happiness Jar)

### 功能流程

#### 1. 进度追踪

```
进度条：████░░░  5/7 天
```

- 每完成一次记录，进度+1
- 实时显示距离下次开启还需几天
- 进度条有流光动画效果

#### 2. 开启条件

```javascript
// 每满7条记录可开启
if (totalRecords % 7 === 0 && totalRecords > 0) {
  canOpenJar = true;
}
```

#### 3. 开启动画序列

**阶段1：罐子晃动**（1.5秒）
```css
@keyframes jarShake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}
```

**阶段2：盖子飞出**（0.8秒）
```css
@keyframes lidFlyAway {
  to {
    transform: translateY(-200px) rotate(720deg);
    opacity: 0;
  }
}
```

**阶段3：星光爆发**（1.5秒）
- 20个星光✨从罐子飞出
- 随机位置，向上飘散

**阶段4：拍立得展示**（0.6秒）
- 3张相片从上方掉落
- 每张随机旋转角度
- 鼠标悬停放大效果

#### 4. 拍立得相片

**内容来源**：
- 随机选取最近的3条"晚间好事"记录
- 使用AI提取后的精炼内容

**视觉设计**：
```
┌─────────────────┐
│   🌸             │
│                  │
│  享受了清凉的游泳  │
│                  │
├─────────────────┤
│   1月 20日       │
└─────────────────┘
```

特点：
- 白色相框，略微旋转
- 顶部emoji装饰
- 底部日期标注
- 悬停时放大，归正

#### 5. 分享功能

**保存到相册**：
```javascript
// 使用 Canvas 生成图片
canvas.width = 1080;
canvas.height = 1920;

// 绘制背景渐变
// 绘制标题
// 绘制3条好事
// 转换为 Blob

// 方案1: Web Share API
navigator.share({
  files: [new File([blob], 'happiness.png')],
  title: '我的幸福瞬间'
});

// 方案2: 降级下载
a.download = 'happiness.png';
a.click();
```

## 📊 数据管理

### 存储结构

```javascript
// localStorage
{
  // 连续天数数据
  'streakData': {
    streak: 7,
    lastDate: 'Tue Jan 21',
    canMakeup: false,
    isDimmed: true
  },
  
  // 罐子数据（计算得出）
  // totalRecords = count('morning_*') + count('evening_*')
  
  // 最后开启的罐子
  'lastOpenedJar': '14', // 第14条记录时开启
  
  // 开罐历史
  'jarHistory': [
    {
      openedAt: '2026-01-15T10:30:00Z',
      totalRecords: 7,
      jarNumber: 1
    },
    {
      openedAt: '2026-01-22T20:15:00Z',
      totalRecords: 14,
      jarNumber: 2
    }
  ],
  
  // 成就列表
  'achievements': {
    'streak_7': {
      title: '坚持 7 天',
      description: '持续记录的力量',
      icon: '✨',
      unlockedAt: '2026-01-15T08:00:00Z'
    },
    'streak_14': { ... }
  },
  
  // 最高连续天数
  'maxStreak': '21'
}
```

### API 接口

```javascript
import {
  getStreakData,      // 获取连续天数
  updateStreak,       // 更新连续天数
  makeupStreak,       // 补签
  getHappinessJarData,// 获取罐子数据
  canOpenNewJar,      // 是否可开启新罐子
  getRandomGoodThings,// 随机获取3条好事
  markJarAsOpened,    // 标记罐子已开启
  getStatistics       // 获取统计数据
} from './utils/achievementHelpers';
```

## 🎨 UI 组件

### 1. StreakCounter 组件

```jsx
<StreakCounter />
```

显示：
- 火焰图标和天数
- 补签状态提示
- 自动响应数据变化

### 2. HappinessJar 组件

```jsx
<HappinessJar onOpenJar={handleOpenJar} />
```

显示：
- 进度条
- 开启按钮（条件显示）
- 已开启罐子统计

### 3. JarOpeningAnimation 组件

```jsx
{showAnimation && (
  <JarOpeningAnimation onClose={handleClose} />
)}
```

全屏动画：
- 罐子开启动画
- 拍立得相片展示
- 分享功能

## 📈 使用流程

### 用户第一次使用

1. 完成 Onboarding
2. 进入首页，看到：
   ```
   🔥 0
   开始记录
   
   🏺 幸福罐子
   ░░░░░░░ 0/7 天
   ```

3. 完成第一次记录：
   ```
   🔥 1
   天连续记录
   
   🏺 幸福罐子
   █░░░░░░ 1/7 天 · 还需 6 天
   ```

### 连续记录7天

1. 第7天完成记录后：
   ```
   🔥 7
   天连续记录
   
   🏺 幸福罐子
   ███████ 可以开启啦！✨
   [开启罐子] 按钮
   ```

2. 点击"开启罐子"：
   - 全屏动画展示
   - 罐子摇晃、盖子飞出
   - 星光爆发
   - 3张拍立得相片掉落

3. 查看回顾，保存相册

### 漏掉一天

1. 昨天：有记录
2. 今天：没记录
3. 明天：继续记录

```javascript
// 自动使用补签机会
🔥 8 (变暗)
天连续记录
⚠️ 使用了补签机会
```

### 连续漏掉2天以上

```javascript
// 重置为1
🔥 1
天连续记录
💡 本周期补签已用
```

## 🎯 心理学设计原则

### 1. 损失厌恶
- 用户不想失去已有的连续天数
- 补签机制保护用户投入

### 2. 即时反馈
- 每次记录立即看到数字增长
- 进度条实时更新

### 3. 变量奖励
- 不知道罐子里会抽到哪3条回忆
- 增加期待感和惊喜

### 4. 社交证明
- 可分享到朋友圈
- 展示自己的坚持成果

### 5. 里程碑激励
- 7天、14天、21天等关键节点
- 解锁成就徽章

## 🔧 技术实现

### 性能优化

```javascript
// 缓存计算结果
const jarData = useMemo(() => {
  return getHappinessJarData();
}, [totalRecords]);

// 懒加载动画组件
const JarAnimation = lazy(() => 
  import('./JarOpeningAnimation')
);
```

### 动画优化

```css
/* 使用 transform 而非 position */
.polaroid {
  transform: translateY(0);
  will-change: transform;
}

/* GPU 加速 */
.jar-sparkles {
  transform: translateZ(0);
}
```

### 数据持久化

```javascript
// 自动备份到云端（可选）
const backupData = () => {
  const data = {
    streak: getStreakData(),
    jar: getHappinessJarData(),
    achievements: getAchievements()
  };
  
  // 上传到服务器
  await uploadBackup(data);
};
```

## 📊 数据分析

### 关键指标

1. **连续天数分布**
   - 1-3天：多少用户
   - 4-7天：多少用户
   - 7+天：多少用户

2. **罐子开启率**
   - 达到7天的用户中，多少开启了罐子
   - 平均开启时长

3. **补签使用率**
   - 多少用户使用了补签
   - 使用后的留存率

4. **分享率**
   - 多少用户分享了相册
   - 分享带来的新用户

## 🚀 未来优化方向

### 1. 个性化罐子
- [ ] 不同主题的罐子（陶罐、玻璃瓶、宝箱）
- [ ] 用户可自定义罐子外观

### 2. 社交功能
- [ ] 好友连续天数排行榜
- [ ] 互相送礼物
- [ ] 群组挑战

### 3. 更多成就
- [ ] 特殊日期成就（生日、纪念日）
- [ ] 隐藏成就（连续30天晨间记录）
- [ ] 成就徽章墙

### 4. 数据洞察
- [ ] 情绪趋势分析
- [ ] 高频词云
- [ ] 月度/年度总结

## 💡 运营建议

### 促活策略

**第7天前夕**：
```
通知："明天就能开启第一个幸福罐子啦！🎁"
```

**中断后第1天**：
```
通知："昨天忘记记录了吗？今天继续，还可以使用补签机会！"
```

**达到21天**：
```
通知："坚持21天了！你已经养成习惯了 🎉"
```

### 留存策略

1. **新手引导**：前3天每天推送鼓励消息
2. **关键节点**：7、14、21天发送成就通知
3. **流失召回**：3天未登录，推送罐子进度

---

**设计理念**：让坚持变得有趣，让回顾充满惊喜 ✨
