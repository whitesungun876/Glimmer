import React, { useState } from 'react';

const GOALS = [
  { id: 'stop_rumination', icon: '🧩', title: '减少内耗', subtitle: '停止过度思考，活在当下' },
  { id: 'find_light', icon: '💛', title: '看见美好', subtitle: '训练自己发现快乐的能力' },
  { id: 'affirm_self', icon: '🌱', title: '认可自己', subtitle: '减少自我怀疑，肯定自己的价值' },
  { id: 'ease_anxiety', icon: '🧘', title: '获得平静', subtitle: '少一些焦虑，多一些安稳' },
  { id: 'deep_awareness', icon: '🤝', title: '感受连接', subtitle: '更理解自己，也更理解他人' },
];

function GoalContractScreen({ onComplete }) {
  const [name, setName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');

  const handleSubmit = () => {
    if (name.trim() && selectedGoal) {
      onComplete({ name: name.trim(), goal: selectedGoal });
    }
  };

  return (
    <div className="screen">
      <div className="card">
        <h2 className="card-title">目标与心理契约</h2>
        <p className="card-description">
          给自己一个小小承诺：每天 5 分钟，把注意力带回生活里。
        </p>

        <div className="glass-card" style={{ padding: '16px 18px', width: '100%', maxWidth: 560, margin: '14px auto 18px' }}>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, lineHeight: 1.7, margin: 0, textAlign: 'left' }}>
            我愿意在接下来的 30 天里，温柔地练习：
            <br />
            - 早上用一句话定向今日
            <br />
            - 晚上用三件小事收集微光
            <br />
            <span style={{ color: 'rgba(255,255,255,0.65)' }}>
              不是为了变得更完美，而是为了更看见自己。
            </span>
          </p>
        </div>

        <label className="goal-contract-label" htmlFor="goal-contract-name">你希望我们怎么称呼你？</label>
        <div className="name-input-wrapper">
          <input
            id="goal-contract-name"
            type="text"
            className="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：Lola"
            maxLength={20}
          />
        </div>

        <p className="goal-contract-label" style={{ marginTop: 16 }}>此刻最想改变的一点</p>
        <div className="goals-container">
          {GOALS.map((goal) => (
            <button
              type="button"
              key={goal.id}
              className={`goal-option ${selectedGoal === goal.id ? 'selected' : ''}`}
              onClick={() => setSelectedGoal(goal.id)}
              aria-pressed={selectedGoal === goal.id}
            >
              <div className="goal-icon">{goal.icon}</div>
              <div className="goal-content">
                <div className="goal-title">{goal.title}</div>
                <div className="goal-subtitle">{goal.subtitle}</div>
              </div>
            </button>
          ))}
        </div>
        <button
          className="btn-primary"
          disabled={!name.trim() || !selectedGoal}
          onClick={handleSubmit}
          style={{ marginTop: '1.5rem' }}
        >
          开始旅程
        </button>
      </div>
    </div>
  );
}

export default GoalContractScreen;
