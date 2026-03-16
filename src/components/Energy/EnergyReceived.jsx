import React, { useEffect, useState } from 'react';
import './EnergyReceived.css';

/**
 * 被投射者打开 App 时的全屏特效：流星划过 + “[好友名] 为你的星空投掷了一枚萤火，愿你今夜好梦。”
 * projections: [{ id, sender_id }, ...]
 */
function EnergyReceived({ projections, onClose }) {
  const [phase, setPhase] = useState('stars'); // stars -> message -> done

  useEffect(() => {
    const t = setTimeout(() => setPhase('message'), 2200);
    return () => clearTimeout(t);
  }, []);

  const senderLabel =
    projections.length === 0
      ? '好友'
      : projections.length === 1
        ? (projections[0].sender_display_name || '好友')
        : null;
  const message =
    projections.length === 1
      ? `${senderLabel} 为你的星空投掷了一枚萤火，愿你今夜好梦。`
      : `${projections.length} 位好友为你的星空投掷了萤火，愿你今夜好梦。`;

  return (
    <div className="energy-received-backdrop">
      {/* 流星划过 */}
      <div className="energy-received-stars">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="energy-received-meteor"
            style={{
              '--delay': `${i * 0.4}s`,
              '--left': `${15 + i * 18}%`,
              '--duration': '1.8s',
            }}
          />
        ))}
      </div>

      {/* 提示文案 */}
      {phase === 'message' && (
        <div className="energy-received-card">
          <p className="energy-received-message">{message}</p>
          <button type="button" className="energy-received-btn" onClick={onClose}>
            收下 ✨
          </button>
        </div>
      )}
    </div>
  );
}

export default EnergyReceived;
