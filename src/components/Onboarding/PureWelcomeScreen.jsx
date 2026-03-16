import React, { useState, useCallback } from 'react';

function PureWelcomeScreen({ onNext }) {
  const [ripples, setRipples] = useState([]);

  const handleTouch = useCallback((e) => {
    if (e.target.closest('button')) return;
    const id = Date.now();
    setRipples((prev) => [...prev, { id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1200);
  }, []);

  return (
    <div
      className="screen pure-welcome-screen"
      onClick={handleTouch}
      onTouchStart={handleTouch}
      role="button"
      tabIndex={0}
      aria-label="触摸屏幕产生涟漪"
    >
      {/* 触屏涟漪：从中心粒子散开 */}
      {ripples.map(({ id }) => (
        <div key={id} className="welcome-ripple" />
      ))}

      {/* 中心：微弱但有节奏呼吸的微光粒子 */}
      <div className="welcome-breathing-particle" />

      {/* 欢迎内容 */}
      <div className="pure-welcome-content">
        <h1 className="glimmer-main-title">
          拾光 · Glimmer
        </h1>
        <p className="glimmer-description">
          每天 5 分钟，开启重塑大脑的积极练习。
        </p>
        <button
          type="button"
          className="btn-start-journey-onboarding"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          开始旅程 ✨
        </button>
      </div>
    </div>
  );
}

export default PureWelcomeScreen;
