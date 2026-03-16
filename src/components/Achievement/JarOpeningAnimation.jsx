import React, { useState, useEffect } from 'react';
import { getRandomGoodThings, markJarAsOpened } from '../../utils/achievementHelpers';

/**
 * 罐子开启全屏动画组件
 */
function JarOpeningAnimation({ onClose }) {
  const [phase, setPhase] = useState('opening'); // opening, showing, closing
  const [goodThings, setGoodThings] = useState([]);
  const [showPolaroids, setShowPolaroids] = useState(false);

  useEffect(() => {
    // 标记罐子已开启
    markJarAsOpened();

    // 获取3条好事
    const things = getRandomGoodThings();
    setGoodThings(things);

    // 动画序列
    setTimeout(() => {
      setPhase('opened');
    }, 1500);

    setTimeout(() => {
      setShowPolaroids(true);
      setPhase('showing');
    }, 2500);
  }, []);

  const handleClose = () => {
    setPhase('closing');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleShare = async () => {
    try {
      // 使用 Canvas 生成图片
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');

      // 绘制背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, '#FFF5E8');
      gradient.addColorStop(1, '#FFE8D6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // 绘制标题
      ctx.fillStyle = '#333';
      ctx.font = 'bold 60px "PingFang SC"';
      ctx.textAlign = 'center';
      ctx.fillText('我的幸福瞬间 ✨', 540, 200);

      // 绘制好事（简化版，实际需要更复杂的布局）
      ctx.font = '36px "PingFang SC"';
      ctx.fillStyle = '#666';
      let yPos = 400;
      goodThings.forEach((thing, index) => {
        ctx.fillText(`${index + 1}. ${thing.content.substring(0, 30)}...`, 540, yPos);
        yPos += 200;
      });

      // 转换为 Blob
      canvas.toBlob(async (blob) => {
        if (navigator.share && navigator.canShare({ files: [new File([blob], 'happiness.png', { type: 'image/png' })] })) {
          // 使用 Web Share API
          await navigator.share({
            files: [new File([blob], 'happiness.png', { type: 'image/png' })],
            title: '我的幸福瞬间',
            text: '这是我最近的幸福时刻 ✨'
          });
        } else {
          // 降级：下载图片
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `happiness-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('分享失败:', error);
      alert('分享功能暂时不可用，请截图保存');
    }
  };

  return (
    <div className={`jar-animation-overlay ${phase}`}>
      {/* 罐子动画 */}
      <div className={`jar-container ${phase === 'opened' ? 'opened' : ''}`}>
        <div className="jar-body">
          <div className="jar-lid"></div>
          <div className="jar-main">🏺</div>
        </div>
        
        {phase === 'opened' && (
          <div className="jar-sparkles">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="sparkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`
                }}
              >
                ✨
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 拍立得相片 */}
      {showPolaroids && (
        <div className="polaroids-container">
          <h2 className="polaroids-title">回顾这些美好瞬间 💫</h2>
          
          <div className="polaroids-grid">
            {goodThings.map((thing, index) => (
              <div 
                key={index} 
                className="polaroid"
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <div className="polaroid-photo">
                  <div className="photo-emoji">
                    {['🌸', '🌈', '⭐', '🌟', '💫', '✨'][index % 6]}
                  </div>
                  <div className="photo-content">
                    {thing.extracted || thing.content}
                  </div>
                </div>
                <div className="polaroid-caption">
                  {new Date(thing.date).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="polaroids-actions">
            <button className="btn-share" onClick={handleShare}>
              <span>📸</span>
              <span>保存到相册</span>
            </button>
            <button className="btn-close-animation" onClick={handleClose}>
              <span>收起</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default JarOpeningAnimation;
