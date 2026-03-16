import React, { useState } from 'react';

function WelcomeScreen({ onNext }) {
  const [selectedOption, setSelectedOption] = useState(null);

  const intentions = [
    {
      id: 'reduce-anxiety',
      title: '减少内耗',
      icon: '🪢',
      subtitle: '更少焦虑、更少自我怀疑',
      color: 'rgba(186, 148, 255, 0.3)'
    },
    {
      id: 'find-joy',
      title: '发现快乐',
      icon: '🌸',
      subtitle: '更容易看到生活中的美好',
      color: 'rgba(255, 200, 120, 0.3)'
    },
    {
      id: 'find-peace',
      title: '拥有平静',
      icon: '💧',
      subtitle: '内心更安稳、更少浮躁',
      color: 'rgba(120, 200, 255, 0.3)'
    },
    {
      id: 'feel-connection',
      title: '感受连接',
      icon: '🤝',
      subtitle: '更理解自己 & 他人',
      color: 'rgba(255, 150, 180, 0.3)'
    },
    {
      id: 'affirm-self',
      title: '肯定自我',
      icon: '🏆',
      subtitle: '更认可自己的价值',
      color: 'rgba(255, 180, 100, 0.3)'
    }
  ];

  const handleSelect = (intention) => {
    setSelectedOption(intention.id);
    
    // 添加选中动画效果
    const element = document.querySelector(`[data-intention="${intention.id}"]`);
    if (element) {
      element.classList.add('selected-pulse');
    }

    // 延迟后自动进入下一页，给动画时间
    setTimeout(() => {
      onNext(intention.id);
    }, 800);
  };

  return (
    <div className="screen welcome-screen">
      {/* 中央萤火虫 */}
      <div className="central-firefly"></div>

      {/* 主标题 */}
      <h1 className="glimmer-title">
        欢迎来到拾光 · Glimmer 🌟
      </h1>

      {/* 副标题 */}
      <p className="glimmer-subtitle">
        这是一个温柔陪伴你的日记空间，帮助你注意到生活中的微光。
      </p>

      {/* 提问 */}
      <p className="intention-question">
        开始之前，告诉我们你最想改善生活的哪一部分？
      </p>

      {/* 意图选项 */}
      <div className="intentions-container">
        {intentions.map((intention) => (
          <div
            key={intention.id}
            data-intention={intention.id}
            className={`intention-card ${selectedOption === intention.id ? 'selected' : ''}`}
            onClick={() => handleSelect(intention)}
            style={{
              '--glow-color': intention.color
            }}
          >
            <div className="intention-icon">{intention.icon}</div>
            <div className="intention-content">
              <div className="intention-title">{intention.title}</div>
              <div className="intention-subtitle">{intention.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WelcomeScreen;
