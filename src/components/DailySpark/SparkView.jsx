import React, { useState, useEffect } from 'react';
import { fetchDailySparkById, lightUpSpark } from '../../utils/dailySparkApi';
import './SparkView.css';

/**
 * 通过分享链接打开：展示某条 Daily Spark 卡片，支持「点亮」
 * 用于 URL 带 ?spark_id=xxx 或 从好友分享进入
 */
function SparkView({ sparkId, onClose }) {
  const [spark, setSpark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightingUp, setLightingUp] = useState(false);
  const [lit, setLit] = useState(false);

  useEffect(() => {
    if (!sparkId) {
      setLoading(false);
      return;
    }
    fetchDailySparkById(sparkId).then((data) => {
      setSpark(data);
      setLoading(false);
    });
  }, [sparkId]);

  const handleLightUp = async () => {
    if (!sparkId || lit) return;
    setLightingUp(true);
    const ok = await lightUpSpark(sparkId);
    setLightingUp(false);
    if (ok) {
      setLit(true);
      setSpark((prev) => prev ? { ...prev, daily_spark_luminosity_count: (prev.daily_spark_luminosity_count || 0) + 1 } : null);
    }
  };

  if (loading) {
    return (
      <div className="spark-view-backdrop">
        <div className="spark-view-card spark-view-loading">
          <p>加载中…</p>
        </div>
      </div>
    );
  }
  if (!spark) {
    return (
      <div className="spark-view-backdrop">
        <div className="spark-view-card spark-view-empty">
          <p>萤火不存在或已失效</p>
          {onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>返回</button>}
        </div>
      </div>
    );
  }

  const { daily_spark_image_url, summary_sentence, core_trait, daily_spark_luminosity_count } = spark;
  const count = daily_spark_luminosity_count || 0;

  return (
    <div className="spark-view-backdrop" onClick={onClose}>
      <div className="spark-view-card" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button type="button" className="spark-view-close" onClick={onClose} aria-label="关闭">×</button>
        )}
        <h3 className="spark-view-title">好友的今日萤火 ✨</h3>
        {daily_spark_image_url && (
          <div className="spark-view-image-wrap">
            <img src={daily_spark_image_url} alt="" className="spark-view-image" />
          </div>
        )}
        {summary_sentence && <p className="spark-view-summary">{summary_sentence}</p>}
        {core_trait && <p className="spark-view-trait">#{core_trait}</p>}
        <p className="spark-view-luminosity">{count} 人为 TA 点亮</p>
        <button
          type="button"
          className="btn btn-primary spark-view-light-btn"
          onClick={handleLightUp}
          disabled={lightingUp || lit}
        >
          {lit ? '已点亮 ✨' : lightingUp ? '点亮中…' : '点亮'}
        </button>
      </div>
    </div>
  );
}

export default SparkView;
