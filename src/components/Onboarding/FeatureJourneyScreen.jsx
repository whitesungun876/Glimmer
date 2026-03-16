import React, { useState, useRef, useCallback, useEffect } from 'react';
import './FeatureJourneyScreen.css';

const CARDS = [
  {
    id: 'journey',
    title: '早晚旅程',
    icon: 'sun-moon',
    copy: '唤醒与复盘：晨间定向你的今日目标，夜晚捕获你的心动微光。阻断消极思维，增强自我慈悲感。',
  },
  {
    id: 'ai',
    title: 'AI 洞察',
    icon: 'mirror',
    copy: '智能解析：深度分析你的情绪、价值观与潜在天赋，带你找回那些被忽略的「擅长」与「热爱」。',
  },
  {
    id: 'value',
    title: '核心收益',
    icon: 'hourglass',
    copy: '化繁为简：5 分钟的微型承诺，有效降低行动门槛，将「心理训练」融入生活，成为你的全新生活方式。',
  },
];

function FeatureJourneyScreen({ onNext }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isTouchRef = useRef(false);

  const goTo = useCallback((index) => {
    setActiveIndex(Math.max(0, Math.min(CARDS.length - 1, index)));
  }, []);

  const handleSwipe = useCallback(
    (startX, startY, endX, endY) => {
      const dx = endX - startX;
      const dy = endY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx > 0) goTo(activeIndex - 1);
        else goTo(activeIndex + 1);
      }
    },
    [activeIndex, goTo]
  );

  const handleTouchStart = useCallback((e) => {
    isTouchRef.current = true;
    touchStartX.current = e.touches?.[0]?.clientX ?? 0;
    touchStartY.current = e.touches?.[0]?.clientY ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (!isTouchRef.current) return;
      const endX = e.changedTouches?.[0]?.clientX ?? 0;
      const endY = e.changedTouches?.[0]?.clientY ?? 0;
      const startX = touchStartX.current;
      const startY = touchStartY.current;
      if (startX != null && startY != null) {
        handleSwipe(startX, startY, endX, endY);
        const dx = endX - startX;
        if (Math.abs(dx) > 40) e.preventDefault();
      }
      touchStartX.current = null;
      touchStartY.current = null;
      isTouchRef.current = false;
    },
    [handleSwipe]
  );

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
  }, []);

  const handlePointerUp = useCallback(
    (e) => {
      if (e.pointerType === 'touch') return;
      const endX = e.clientX;
      const endY = e.clientY;
      const startX = touchStartX.current;
      const startY = touchStartY.current;
      if (startX != null && startY != null) handleSwipe(startX, startY, endX, endY);
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [handleSwipe]
  );

  const carouselRef = useRef(null);
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (!isTouchRef.current) return;
      const x = e.touches?.[0]?.clientX ?? 0;
      const dx = x - (touchStartX.current ?? 0);
      if (Math.abs(dx) > 10) e.preventDefault();
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, []);

  return (
    <div className="screen feature-journey-screen">
      <div className="feature-journey-inner">
        <h2 className="feature-journey-title">「拾光」旅程，从何开始？</h2>
        <p className="feature-journey-subtitle">每天 5 分钟，简单三步，深度探索自我。</p>

        <div
          ref={carouselRef}
          className="feature-carousel-wrap"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <div
            className="feature-carousel-track"
            style={{ transform: `translateX(calc(-140px - ${activeIndex * 296}px))` }}
          >
            {CARDS.map((card, index) => (
              <div
                key={card.id}
                className={`feature-card ${index === activeIndex ? 'feature-card-active' : ''}`}
                onClick={() => goTo(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
                  if (e.key === 'ArrowRight') goTo(activeIndex + 1);
                }}
                aria-label={`${card.title}，${index + 1} / ${CARDS.length}`}
              >
                <div className="feature-card-glow" />
                <div className="feature-card-icon-wrap">
                  {card.icon === 'sun-moon' && (
                    <svg className="feature-icon feature-icon-sun-moon" viewBox="0 0 64 64" aria-hidden>
                      <defs>
                        <linearGradient id={`sun-half-${card.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ffd54f" />
                          <stop offset="100%" stopColor="#ffb74d" />
                        </linearGradient>
                        <linearGradient id={`moon-half-${card.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e0e7ff" />
                          <stop offset="100%" stopColor="#c7d2fe" />
                        </linearGradient>
                      </defs>
                      <path d="M 32 8 A 24 24 0 0 1 32 56 A 24 24 0 0 1 32 8" fill={`url(#sun-half-${card.id})`} />
                      <path d="M 32 8 A 24 24 0 0 0 32 56 A 24 24 0 0 0 32 8" fill={`url(#moon-half-${card.id})`} />
                      <circle cx="32" cy="32" r="4" fill="rgba(255,255,255,0.9)" className="feature-icon-center-glow" />
                    </svg>
                  )}
                  {card.icon === 'mirror' && (
                    <svg className="feature-icon feature-icon-mirror" viewBox="0 0 64 64" aria-hidden>
                      <defs>
                        <linearGradient id={`mirror-gold-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffd700" />
                          <stop offset="100%" stopColor="#ffb300" />
                        </linearGradient>
                      </defs>
                      <path d="M 20 18 Q 32 12 44 18 Q 52 28 52 38 Q 52 50 44 54 L 20 54 Q 12 50 12 38 Q 12 28 20 18" fill="none" stroke={`url(#mirror-gold-${card.id})`} strokeWidth="2.5" />
                      <path d="M 18 24 Q 32 20 46 24 M 16 32 Q 32 28 48 32 M 18 40 Q 32 36 46 40" fill="none" stroke={`url(#mirror-gold-${card.id})`} strokeWidth="1.2" opacity="0.8" />
                    </svg>
                  )}
                  {card.icon === 'hourglass' && (
                    <svg className="feature-icon feature-icon-hourglass" viewBox="0 0 64 64" aria-hidden>
                      <defs>
                        <linearGradient id={`sand-grad-${card.id}`} x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#ffd54f" />
                          <stop offset="100%" stopColor="#ffb74d" />
                        </linearGradient>
                        <marker id={`arrow-hourglass-${card.id}`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                          <path d="M 0 0 L 8 4 L 0 8 Z" fill="rgba(255,215,0,0.9)" />
                        </marker>
                      </defs>
                      <path d="M 16 8 L 48 8 L 36 28 L 28 28 L 16 8" fill="none" stroke="rgba(255,215,0,0.7)" strokeWidth="2" />
                      <path d="M 16 56 L 48 56 L 36 36 L 28 36 L 16 56" fill="none" stroke="rgba(255,215,0,0.7)" strokeWidth="2" />
                      <path d="M 28 28 L 36 28 L 36 36 L 28 36 Z" fill={`url(#sand-grad-${card.id})`} opacity="0.9" />
                      <path d="M 32 36 L 32 56" stroke="rgba(255,215,0,0.9)" strokeWidth="2" markerEnd={`url(#arrow-hourglass-${card.id})`} />
                    </svg>
                  )}
                </div>
                <h3 className="feature-card-title">{card.title}</h3>
                <p className="feature-card-copy">{card.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="feature-journey-hint">
          <span className="feature-journey-hint-text">滑动查看更多功能。</span>
          <span className="feature-journey-hint-arrow">→</span>
        </p>
        <div className="feature-journey-dots">
          {CARDS.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`feature-dot ${index === activeIndex ? 'feature-dot-active' : ''}`}
              onClick={() => goTo(index)}
              aria-label={`第 ${index + 1} 张卡片`}
            />
          ))}
        </div>

        <button type="button" className="feature-journey-next" onClick={onNext}>
          继续
        </button>
      </div>
    </div>
  );
}

export default FeatureJourneyScreen;
