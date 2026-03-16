import React, { useState, useRef, useEffect, useCallback } from 'react';
import './GrowthCurveScreen.css';

const DAYS = 30;
const MILESTONES = [7, 21, 30];
const MILESTONE_TOOLTIPS = {
  7: '7 天：神经可塑性开始响应，注意力开始转向积极线索。',
  21: '21 天：习惯回路巩固，情绪调节改善明显。',
  30: '30 天：长期改变可测量，压力激素下降、主观幸福感提升。',
};

const PATH_DURATION_MS = 2500;
const TICKER_DURATION_MS = 1200;

function getPathPoints(width, height) {
  const points = [];
  for (let d = 1; d <= DAYS; d++) {
    const t = (d - 1) / (DAYS - 1);
    const x = (d - 0.5) / DAYS * width;
    const eased = t * t * (3 - 2 * t);
    const y = height - 24 - (height - 48) * eased;
    points.push({ day: d, x, y });
  }
  return points;
}

function pathToSmoothD(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const prev = points[i - 1];
    const next = points[i + 1];
    const cpx = prev.x + (p.x - prev.x) * 0.4;
    const cpy = prev.y + (p.y - prev.y) * 0.2;
    const cpx2 = p.x - (next ? (next.x - p.x) * 0.2 : 0);
    const cpy2 = p.y - (next ? (p.y - next.y) * 0.2 : 0);
    d += ` C ${cpx} ${cpy}, ${cpx2} ${cpy2}, ${p.x} ${p.y}`;
  }
  return d;
}

function triggerHaptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

function GrowthCurveScreen({ onNext }) {
  const chartRef = useRef(null);
  const pathRef = useRef(null);
  const [pathLength, setPathLength] = useState(0);
  const [pathOffset, setPathOffset] = useState(9999);
  const [pathDone, setPathDone] = useState(false);
  const [scrubDay, setScrubDay] = useState(null);
  const [scrubX, setScrubX] = useState(null);
  const [tickerStress, setTickerStress] = useState(0);
  const [tickerWellbeing, setTickerWellbeing] = useState(0);
  const lastMilestoneRef = useRef(null);
  const width = 280;
  const height = 160;
  const points = getPathPoints(width, height);
  const pathD = pathToSmoothD(points);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setPathLength(len);
    setPathOffset(len);
  }, [pathD]);

  useEffect(() => {
    if (pathLength <= 0) return;
    const start = performance.now();
    let rafId;
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / PATH_DURATION_MS);
      const eased = 1 - (1 - t) * (1 - t);
      setPathOffset(pathLength * (1 - eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setPathDone(true);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [pathLength]);

  useEffect(() => {
    if (!pathDone) return;
    const start = performance.now();
    let rafId;
    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / TICKER_DURATION_MS);
      const eased = t * t * (3 - 2 * t);
      setTickerStress(Math.round(-71 * eased));
      setTickerWellbeing(Math.round(120 * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [pathDone]);

  const getDayFromClientX = useCallback((clientX) => {
    const el = chartRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const day = Math.round((x / rect.width) * DAYS);
    return Math.max(1, Math.min(DAYS, day));
  }, []);

  const handlePointerDown = useCallback((e) => {
    const day = getDayFromClientX(e.clientX);
    if (day != null) {
      setScrubDay(day);
      setScrubX(e.clientX);
      if (MILESTONES.includes(day) && lastMilestoneRef.current !== day) {
        lastMilestoneRef.current = day;
        triggerHaptic();
      }
    }
  }, [getDayFromClientX]);

  const handlePointerMove = useCallback((e) => {
    const day = getDayFromClientX(e.clientX);
    if (day != null) {
      setScrubDay(day);
      setScrubX(e.clientX);
      if (MILESTONES.includes(day) && lastMilestoneRef.current !== day) {
        lastMilestoneRef.current = day;
        triggerHaptic();
      }
    }
  }, [getDayFromClientX]);

  const handlePointerUp = useCallback(() => {
    setScrubDay(null);
    setScrubX(null);
    lastMilestoneRef.current = null;
  }, []);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const onUp = () => {
      setScrubDay(null);
      setScrubX(null);
      lastMilestoneRef.current = null;
    };
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointerleave', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointerleave', onUp);
    };
  }, []);

  const nearestPoint = scrubDay != null ? points.find((p) => p.day === scrubDay) || points[scrubDay - 1] : null;
  const scrubXLocal = chartRef.current && scrubX != null ? scrubX - chartRef.current.getBoundingClientRect().left : null;

  return (
    <div className="screen growth-curve-screen">
      <div className="growth-curve-card">
        <h2 className="growth-curve-title">成长是一条温柔的曲线</h2>
        <p className="growth-curve-desc">不要求每天都进步，只要持续在练习，变化会自然发生。</p>

        <div
          className="growth-chart-wrap"
          ref={chartRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="img"
          aria-label="30 天成长曲线图"
        >
          <svg className="growth-chart-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="glimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff9a56" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              ref={pathRef}
              className="growth-path"
              d={pathD}
              fill="none"
              stroke="url(#glimmer-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={pathOffset}
              filter="url(#glow)"
            />
            {nearestPoint && scrubDay != null && (
              <>
                <circle
                  className="growth-highlight-dot"
                  cx={nearestPoint.x}
                  cy={nearestPoint.y}
                  r="6"
                  fill="#ffd700"
                  opacity="0.9"
                />
              </>
            )}
          </svg>

          {scrubXLocal != null && chartRef.current && (
            <div
              className="growth-vertical-line"
              style={{ left: scrubXLocal }}
              aria-hidden
            />
          )}

          {scrubDay != null && MILESTONE_TOOLTIPS[scrubDay] && (
            <div
              className="growth-tooltip"
              style={{
                left: scrubXLocal != null ? Math.min(Math.max(scrubXLocal - 120, 8), chartRef.current ? chartRef.current.offsetWidth - 248 : 0) : 0,
              }}
            >
              <span className="growth-tooltip-day">第 {scrubDay} 天</span>
              <p className="growth-tooltip-text">{MILESTONE_TOOLTIPS[scrubDay]}</p>
            </div>
          )}
        </div>

        <div className="growth-stats">
          <div className="growth-stat">
            <span className="growth-stat-label">压力感</span>
            <span className="growth-stat-value growth-stat-stress">{tickerStress}%</span>
          </div>
          <div className="growth-stat">
            <span className="growth-stat-label">幸福感</span>
            <span className="growth-stat-value growth-stat-wellbeing">+{tickerWellbeing}%</span>
          </div>
        </div>

        <button type="button" className="btn-primary growth-next" onClick={onNext}>
          下一步
        </button>
      </div>
    </div>
  );
}

export default GrowthCurveScreen;
