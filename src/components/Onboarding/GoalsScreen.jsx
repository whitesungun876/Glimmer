import React, { useState } from 'react';

const GOALS = [
  { 
    id: 'calm', 
    icon: '🧘', 
    title: '获得平静', 
    subtitle: '少一些焦虑，多一些安稳' 
  },
  { 
    id: 'joy', 
    icon: '💛', 
    title: '看见美好', 
    subtitle: '训练自己发现快乐的能力' 
  },
  { 
    id: 'confidence', 
    icon: '🌱', 
    title: '认可自己', 
    subtitle: '减少自我怀疑，肯定自己的价值' 
  },
  { 
    id: 'connection', 
    icon: '🤝', 
    title: '感受连接', 
    subtitle: '更理解自己，也更理解他人' 
  },
  { 
    id: 'peace', 
    icon: '🧩', 
    title: '减少内耗', 
    subtitle: '停止过度思考，活在当下' 
  },
];

function GoalsScreen({ name, onNext }) {
  const [selectedGoal, setSelectedGoal] = useState('');

  const handleSubmit = () => {
    if (selectedGoal) {
      const goalData = GOALS.find(g => g.id === selectedGoal);
      onNext(goalData.title);
    }
  };

  return (
    <div className="screen">
      <div className="card">
        <h2 className="card-title">很高兴认识你，{name} 👋</h2>
        <p className="card-description">
          现在，选一个此刻最想改变的感受<br/>
          <span style={{ fontSize: '14px', color: '#999' }}>
            （不用纠结，之后随时可以调整）
          </span>
        </p>
        <div className="goals-container">
          {GOALS.map(goal => (
            <div
              key={goal.id}
              className={`goal-option ${selectedGoal === goal.id ? 'selected' : ''}`}
              onClick={() => setSelectedGoal(goal.id)}
            >
              <div className="goal-icon">{goal.icon}</div>
              <div className="goal-content">
                <div className="goal-title">{goal.title}</div>
                <div className="goal-subtitle">{goal.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="goals-hint">这会帮助我们为你推荐更合适的引导问题</p>
        <button
          className="btn-primary"
          disabled={!selectedGoal}
          onClick={handleSubmit}
          style={{ marginTop: '24px' }}
        >
          继续
        </button>
      </div>
    </div>
  );
}

export default GoalsScreen;
