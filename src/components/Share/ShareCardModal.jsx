import React, { useState } from 'react';
import ShareCard from './ShareCard';
import './ShareCardModal.css';

/**
 * 分享卡片弹层：展示 ShareCard，支持保存为图片并下载
 */
function ShareCardModal({ userData, constellationSvg, inviteCode, onClose }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleCaptured = async (dataUrl) => {
    if (!dataUrl) return;
    setSaving(true);
    setMessage('');
    try {
      const link = document.createElement('a');
      link.download = `拾光邀请-${userData?.name || 'Glimmer'}.png`;
      link.href = dataUrl;
      link.click();
      setMessage('已保存到相册/下载');
    } catch {
      setMessage('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal-content" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="share-modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <ShareCard
          userData={userData}
          constellationSvg={constellationSvg}
          inviteCode={inviteCode}
          onCaptured={handleCaptured}
        />
        {message && <p className="share-modal-message">{message}</p>}
        {saving && <p className="share-modal-message">正在生成图片…</p>}
      </div>
    </div>
  );
}

export default ShareCardModal;
