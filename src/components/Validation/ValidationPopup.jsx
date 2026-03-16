import React from 'react';
import { strengthToDisplay } from '../../utils/strengthDisplay';
import './ValidationPopup.css';

/**
 * 天赋互证浮窗：“AI 发现 A 本周展现了极强的[共情力]，你认同吗？”
 * 请求对象: { id, requester_id, requester_display_name, target_strength, week_start, ... }
 */
function ValidationPopup({ request, onConfirm, onSkip, onClose }) {
  if (!request) return null;

  const displayName = request.requester_display_name || '你的好友';
  const strengthName = strengthToDisplay(request.target_strength);

  return (
    <div className="validation-popup-backdrop" onClick={onClose}>
      <div className="validation-popup-card" onClick={(e) => e.stopPropagation()}>
        <p className="validation-popup-text">
          AI 发现 <strong>{displayName}</strong> 本周展现了极强的 <strong>{strengthName}</strong>，你认同吗？
        </p>
        <div className="validation-popup-actions">
          <button
            type="button"
            className="validation-popup-btn confirm"
            onClick={() => onConfirm?.(request.id)}
          >
            确实如此 ✨
          </button>
          <button
            type="button"
            className="validation-popup-btn skip"
            onClick={() => onSkip?.(request.id)}
          >
            暂时跳过
          </button>
        </div>
      </div>
    </div>
  );
}

export default ValidationPopup;
