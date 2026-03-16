import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { buildInviteLink, getOrCreateInviteCode } from '../../utils/inviteHelpers';
import './ShareCard.css';

/**
 * 拾光分享卡片：星座图缩略图 + 星等天赋标签 + 带邀请码的下载二维码
 * 使用 html2canvas 导出为图片供保存/分享
 */
function ShareCard({ userData, constellationSvg, inviteCode: inviteCodeProp, onCaptured }) {
  const cardRef = useRef(null);
  const inviteCode = inviteCodeProp != null ? inviteCodeProp : getOrCreateInviteCode();
  const inviteLink = buildInviteLink(inviteCode);

  // 星等天赋：来自 userData 的 intention + goal，或占位
  const starTags = [
    userData?.intention && { label: '意向', value: userData.intention },
    userData?.goal && { label: '目标', value: userData.goal },
  ].filter(Boolean);

  const handleCapture = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#1a1a2e',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      onCaptured?.(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('ShareCard capture failed:', err);
      return null;
    }
  };

  return (
    <div className="share-card-wrapper">
      <div ref={cardRef} className="share-card share-card-inner">
        <div className="share-card-bg" />
        <header className="share-card-header">
          <span className="share-card-logo">✨ 拾光</span>
          <span className="share-card-subtitle">邀请你一起记录微光</span>
        </header>

        <div className="share-card-constellation">
          {constellationSvg ? (
            <div
              className="share-card-constellation-svg"
              dangerouslySetInnerHTML={{ __html: constellationSvg }}
            />
          ) : (
            <ConstellationPlaceholder />
          )}
        </div>

        <div className="share-card-tags">
          <div className="share-card-tags-title">星等天赋</div>
          <div className="share-card-tags-list">
            {starTags.length > 0 ? (
              starTags.map((t, i) => (
                <span key={i} className="share-card-tag">
                  {t.label}: {t.value}
                </span>
              ))
            ) : (
              <span className="share-card-tag">发现美好 · 记录微光</span>
            )}
          </div>
        </div>

        <div className="share-card-qr">
          <QRCodeSVG value={inviteLink} size={88} level="M" includeMargin={false} />
          <p className="share-card-qr-hint">扫码下载拾光，一起记录</p>
        </div>

        <footer className="share-card-footer">
          {userData?.name && <span>{userData.name} 邀请</span>}
        </footer>
      </div>

      <button type="button" className="share-card-capture-btn" onClick={handleCapture}>
        保存为图片
      </button>
    </div>
  );
}

/** 占位：简易星座图 SVG（无后端 viz 时使用） */
function ConstellationPlaceholder() {
  const w = 160;
  const h = 160;
  const pad = 20;
  const points = [
    [pad + 20, pad + 30],
    [pad + 60, pad + 80],
    [pad + 100, pad + 50],
    [pad + 120, pad + 100],
    [pad + 80, pad + 120],
    [pad + 40, pad + 100],
    [pad + 70, pad + 60],
  ];
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ');
  return (
    <svg width={w} height={h} className="share-card-constellation-placeholder">
      <polyline points={pts} fill="none" stroke="rgba(186,148,255,0.6)" strokeWidth="1.5" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill="rgba(186,148,255,0.9)" />
      ))}
    </svg>
  );
}

export default ShareCard;
export { ShareCard };
