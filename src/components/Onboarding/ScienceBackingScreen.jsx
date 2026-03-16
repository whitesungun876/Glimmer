import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ScienceBackingScreen.css';

const PILLARS = [
  {
    id: 'ras',
    title: '开启"寻宝"模式 (RAS)',
    body: '只需 5 分钟，就像为大脑装上了"快乐雷达"。它会帮你过滤掉白天的琐碎干扰，自动捕捉那些让你顺心的小瞬间。',
  },
  {
    id: 'neuro',
    title: '物理级"抗压"增强 (Neuroplasticity)',
    body: '持续的微练习能真实改变大脑结构。它会让你的理智大脑更强壮，让负责焦虑的区域变安静，从底层提升你的情绪弹性。',
  },
  {
    id: 'affirmation',
    title: '自动向目标校准 (Self-Affirmation)',
    body: '通过文字给生活定个调。利用"实施意图"原理，你的潜意识会像导航仪一样，自动引导你的行动向你期待的目标靠近。',
  },
  {
    id: 'rumination',
    title: '一键关停"深夜胡思乱想" (Rumination Block)',
    body: '在睡前给大脑一个"关机仪式"。通过复盘切断焦虑循环，把烦恼留在纸上，换取一个更深沉、更安稳的睡眠。',
  },
];

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

function ScienceBackingScreen({ onNext }) {
  const scrollRef = useRef(null);
  const [stage, setStage] = useState(0);
  const [hasScrolledAll, setHasScrolledAll] = useState(false);
  const lastStageRef = useRef(-1);
  const conclusionRef = useRef(null);

  const updateStageFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const total = scrollHeight - clientHeight;
    if (total <= 0) {
      setStage(0);
      if (conclusionRef.current) {
        const rect = conclusionRef.current.getBoundingClientRect();
        const containerRect = el.getBoundingClientRect();
        if (rect.bottom <= containerRect.bottom + 20) setHasScrolledAll(true);
      }
      return;
    }
    const pct = scrollTop / total;
    let newStage = 0;
    if (pct >= 0.85) newStage = 4;
    else if (pct >= 0.62) newStage = 3;
    else if (pct >= 0.38) newStage = 2;
    else if (pct >= 0.15) newStage = 1;
    setStage(newStage);
    if (newStage === 4) setHasScrolledAll(true);
    if (conclusionRef.current) {
      const rect = conclusionRef.current.getBoundingClientRect();
      const containerRect = el.getBoundingClientRect();
      if (rect.bottom <= containerRect.bottom + 20) setHasScrolledAll(true);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateStageFromScroll();
    el.addEventListener('scroll', updateStageFromScroll, { passive: true });
    return () => el.removeEventListener('scroll', updateStageFromScroll);
  }, [updateStageFromScroll]);

  useEffect(() => {
    if (stage !== lastStageRef.current && stage >= 1 && stage <= 4) {
      lastStageRef.current = stage;
      triggerHaptic();
    }
  }, [stage]);

  return (
    <div className="screen science-backing-screen">
      <div className="science-backing-header">
        <span className="science-backing-badge">2. 科学背书 | 你的"大脑升级"说明书</span>
        <h2 className="science-backing-title">这不是简单的记录，是精准的大脑训练</h2>
      </div>

      <div className="science-backing-layout">
        <div className="science-backing-brain-wrap">
          <svg
            className="science-brain-svg"
            viewBox="0 0 200 220"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            <defs>
              <filter id="brain-glow">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
              </linearGradient>
            </defs>
            {/* Background dots → gold stars in stage 1 */}
            <g className={`science-brain-dots ${stage >= 1 ? 'science-brain-dots-gold' : ''}`}>
              {[12, 28, 45, 62, 78, 95, 112, 128, 145, 162, 178].map((x, i) =>
                [30, 60, 90, 120, 150, 180].map((y, j) => (
                  <circle key={`${i}-${j}`} cx={x} cy={y} r="1.5" fill="currentColor" />
                ))
              )}
            </g>
            {/* Chaotic waves → flat line in stage 4 */}
            <g className="science-brain-waves">
              <path
                className={`science-wave-path ${stage >= 4 ? 'science-wave-calm' : ''}`}
                d={
                  stage >= 4
                    ? 'M 20 160 L 180 160'
                    : 'M 20 140 Q 60 100 100 130 T 180 150'
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                className={`science-wave-path science-wave-2 ${stage >= 4 ? 'science-wave-calm' : ''}`}
                d={
                  stage >= 4
                    ? 'M 20 170 L 180 170'
                    : 'M 20 165 Q 80 120 120 155 T 180 165'
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </g>
            {/* Brain outline - grayscale */}
            <path
              className="science-brain-outline"
              d="M 100 28 C 60 28 30 55 30 95 C 30 125 50 145 70 155 L 70 185 C 70 195 85 205 100 205 C 115 205 130 195 130 185 L 130 155 C 150 145 170 125 170 95 C 170 55 140 28 100 28 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            {/* Brain stem - pulse in stage 1 */}
            <ellipse
              className={`science-brain-stem ${stage >= 1 ? 'science-brain-stem-pulse' : ''}`}
              cx="100"
              cy="195"
              rx="18"
              ry="12"
              fill="currentColor"
            />
            {/* Prefrontal cortex - gold in stage 2 */}
            <path
              className={`science-pfc ${stage >= 2 ? 'science-pfc-gold' : ''}`}
              d="M 75 45 L 125 45 L 120 85 L 80 85 Z"
              fill="currentColor"
            />
            {/* Amygdala - shrink in stage 2 */}
            <ellipse
              className={`science-amygdala ${stage >= 2 ? 'science-amygdala-shrink' : ''}`}
              cx="100"
              cy="115"
              rx="20"
              ry="14"
              fill="currentColor"
            />
            {/* Needle - snap to center in stage 3 */}
            <g className={`science-needle ${stage >= 3 ? 'science-needle-center' : ''}`}>
              <line x1="100" y1="115" x2="100" y2="85" stroke="currentColor" strokeWidth="2" />
              <polygon points="100,78 96,88 104,88" fill="currentColor" />
            </g>
          </svg>
        </div>

        <div className="science-backing-scroll" ref={scrollRef}>
          {PILLARS.map((p, i) => (
            <section
              key={p.id}
              className={`science-pillar ${stage >= i + 1 ? 'science-pillar-visible' : ''}`}
              data-stage={i + 1}
            >
              <h3 className="science-pillar-title">{p.title}</h3>
              <p className="science-pillar-body">{p.body}</p>
            </section>
          ))}
          <div className="science-backing-conclusion" ref={conclusionRef}>
            <p className="science-conclusion-text">
              该模型源自加州大学（UC Davis）关于<strong>「感恩干预」</strong>的十年临床研究。目前，全球已超过 50 万
              核心用户通过这一科学框架，重获了生活的掌控感。
            </p>
          </div>
          {hasScrolledAll && (
            <div className="science-backing-actions">
              <button type="button" className="science-next-btn" onClick={onNext}>
                继续
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScienceBackingScreen;
