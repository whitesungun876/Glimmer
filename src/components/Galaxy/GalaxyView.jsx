import React, { useMemo } from 'react';
import './GalaxyView.css';

const CANVAS = { width: 320, height: 320 };
const INTERSECTION_THRESHOLD = 18;

/**
 * 双人叠加星轨图：两人 SVG 路径同画布，交点处加亮
 * data: { user_a: { viz_json }, user_b: { viz_json }, resonance_message }
 */
function GalaxyView({ data, friendDisplayName, onClose, loading, useBlendMode }) {
  const { user_a: userA, user_b: userB, resonance_message: resonanceMessage } = data || {};
  const vizA = userA?.viz_json;
  const vizB = userB?.viz_json;

  // Hooks 必须在所有条件判断和 early return 之前调用
  const { pathA, pathB, starsA, starsB, intersections } = useMemo(() => {
    const starsA = vizA?.stars ?? [];
    const starsB = vizB?.stars ?? [];
    const pathA = vizA?.path?.points ?? '';
    const pathB = vizB?.path?.points ?? '';
    const pts = [];
    starsA.forEach((sa, i) => {
      starsB.forEach((sb, j) => {
        const dx = sa.x - sb.x;
        const dy = sa.y - sb.y;
        if (dx * dx + dy * dy <= INTERSECTION_THRESHOLD * INTERSECTION_THRESHOLD) {
          pts.push({ x: (sa.x + sb.x) / 2, y: (sa.y + sb.y) / 2 });
        }
      });
    });
    return { pathA, pathB, starsA, starsB, intersections: pts };
  }, [vizA, vizB]);

  const hasViz = (vizA?.stars?.length > 0) || (vizB?.stars?.length > 0);

  if (loading || data === null) {
    return (
      <div className="galaxy-view-backdrop" onClick={onClose}>
        <div className="galaxy-view-card" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="galaxy-view-close" onClick={onClose} aria-label="关闭">×</button>
          <p className="galaxy-view-resonance">加载星轨中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="galaxy-view-backdrop" onClick={onClose}>
      <div className="galaxy-view-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="galaxy-view-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <h3 className="galaxy-view-title">双人星轨</h3>
        {friendDisplayName && (
          <p className="galaxy-view-subtitle">与 {friendDisplayName} 的本周共鸣</p>
        )}
        {resonanceMessage && (
          <p className="galaxy-view-resonance">{resonanceMessage}</p>
        )}
        <div className="galaxy-view-svg-wrap">
          <svg
            className="galaxy-view-svg"
            width={CANVAS.width}
            height={CANVAS.height}
            viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {hasViz ? (
              <g style={{ mixBlendMode: useBlendMode ? 'lighten' : 'normal' }}>
                {pathA && (
                  <polyline
                    fill="none"
                    stroke="rgba(186, 148, 255, 0.5)"
                    strokeWidth="2"
                    points={pathA}
                  />
                )}
                {pathB && (
                  <polyline
                    fill="none"
                    stroke="rgba(124, 255, 161, 0.5)"
                    strokeWidth="2"
                    points={pathB}
                  />
                )}
                {starsA.map((s, i) => (
                  <circle key={`a-${i}`} cx={s.x} cy={s.y} r="4" fill="rgba(186, 148, 255, 0.9)" />
                ))}
                {starsB.map((s, i) => (
                  <circle key={`b-${i}`} cx={s.x} cy={s.y} r="4" fill="rgba(124, 255, 161, 0.9)" />
                ))}
                {intersections.map((p, i) => (
                  <circle
                    key={`x-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill="rgba(255, 215, 0, 0.6)"
                    filter="url(#glow)"
                  />
                ))}
              </g>
            ) : (
              <text x="50%" y="50%" textAnchor="middle" dy="0.3em" fill="rgba(255,255,255,0.5)" fontSize="14">
                暂无本周星轨数据
              </text>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default GalaxyView;
