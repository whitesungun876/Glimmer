import React from 'react';

function RitualScreen({ name, onComplete }) {
  return (
    <div className="screen">
      <div className="ritual-content">
        <div className="ritual-light" />
        <p className="ritual-text">
          <span className="ritual-highlight">{name}</span>，<br/><br/>
          从今天起<br/>
          每天 5 分钟<br/>
          为自己创造一点光亮<br/><br/>
          不求完美，只求真实<br/>
          我们陪你一起走 ✨
        </p>
        <button 
          className="btn-primary" 
          onClick={onComplete} 
          style={{ marginTop: '40px' }}
        >
          开始我的第一天
        </button>
      </div>
    </div>
  );
}

export default RitualScreen;
