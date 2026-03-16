import React from 'react';
import { getHappinessJarData } from '../../utils/achievementHelpers';

/**
 * 幸福罐子进度组件
 */
function HappinessJar({ onOpenJar }) {
  const jarData = getHappinessJarData();
  const canOpen = jarData.nextJarProgress === 0 && jarData.totalRecords > 0;

  return (
    <div className="happiness-jar-widget">
      <div className="jar-header">
        <span className="jar-icon">🏺</span>
        <span className="jar-title">幸福罐子</span>
      </div>
      
      <div className="jar-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${jarData.progressPercent}%` }}
          >
            <div className="progress-sparkle"></div>
          </div>
        </div>
        <div className="progress-text">
          {jarData.nextJarProgress === 0 && jarData.totalRecords > 0 ? (
            <span className="ready">可以开启啦！✨</span>
          ) : (
            <span>
              {jarData.nextJarProgress} / 7 天
              {jarData.nextJarProgress > 0 && (
                <span className="remaining"> · 还需 {7 - jarData.nextJarProgress} 天</span>
              )}
            </span>
          )}
        </div>
      </div>

      {canOpen && (
        <button className="btn-open-jar" onClick={onOpenJar}>
          <span className="jar-emoji">🎁</span>
          <span>开启罐子</span>
        </button>
      )}

      {jarData.jarsOpened > 0 && (
        <div className="jar-stats">
          <span className="stats-text">
            已开启 {jarData.jarsOpened} 个罐子
          </span>
        </div>
      )}
    </div>
  );
}

export default HappinessJar;
