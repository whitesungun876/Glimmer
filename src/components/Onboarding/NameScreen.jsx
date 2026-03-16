import React, { useState } from 'react';

function NameScreen({ onNext }) {
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (name.trim()) {
      // 触发光圈扩散动画
      const overlay = document.createElement('div');
      overlay.className = 'light-expansion-overlay';
      document.body.appendChild(overlay);

      setTimeout(() => {
        onNext(name.trim());
        document.body.removeChild(overlay);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="screen name-screen">
      {/* 萤火虫光圈 */}
      <div className={`firefly-circle ${isFocused ? 'focused' : ''}`}>
        <div className="circle-firefly"></div>
        <div className="circle-firefly"></div>
        <div className="circle-firefly"></div>
      </div>

      {/* 内容 */}
      <div className="name-content">
        <h2 className="contract-title">
          我们一起走一段温柔的练习之旅
        </h2>

        <p className="contract-body">
          每天 5 分钟，为自己创造一点光亮。不要求完美，只要真实。
        </p>

        <p className="name-prompt">
          现在告诉我们你的名字吧：
        </p>

        {/* 昵称输入框 */}
        <div className="name-input-wrapper">
          <input
            type="text"
            className="name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyPress={handleKeyPress}
            placeholder="✨ 小光、晴天、尝试的人…"
            maxLength={20}
          />
        </div>

        {/* 开启按钮 */}
        <button
          className="btn-start-journey"
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          开启练习 ✨
        </button>
      </div>
    </div>
  );
}

export default NameScreen;
