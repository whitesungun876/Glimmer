import React from 'react';
import './DailySparkCard.css';

/**
 * 每日萤火卡片：提交晨间/晚间后展示，含图片、摘要、特质、分享
 * spark: { id, daily_spark_image_url, summary_sentence, core_trait, daily_spark_luminosity_count }
 */
function DailySparkCard({ spark, userName, onClose, onShare }) {
  if (!spark) return null;
  const { id, daily_spark_image_url, summary_sentence, core_trait, daily_spark_luminosity_count } = spark;

  const handleShare = () => {
    if (daily_spark_image_url) {
      const link = document.createElement('a');
      link.download = `拾光-${userName || '今日'}-${core_trait || '萤火'}.png`;
      link.href = daily_spark_image_url;
      link.click();
    }
    onShare?.();
  };

  return (
    <div className="daily-spark-backdrop" onClick={onClose}>
      <div className="daily-spark-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="daily-spark-close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <h3 className="daily-spark-title">今日萤火 ✨</h3>
        {daily_spark_image_url && (
          <div className="daily-spark-image-wrap">
            <img src={daily_spark_image_url} alt="" className="daily-spark-image" />
          </div>
        )}
        {summary_sentence && (
          <p className="daily-spark-summary">{summary_sentence}</p>
        )}
        {core_trait && (
          <p className="daily-spark-trait">#{core_trait}</p>
        )}
        {daily_spark_luminosity_count > 0 && (
          <p className="daily-spark-luminosity">{daily_spark_luminosity_count} 人为你点亮</p>
        )}
        <div className="daily-spark-actions">
          <button type="button" className="btn btn-primary daily-spark-btn" onClick={handleShare}>
            分享
          </button>
          {id && (
            <button
              type="button"
              className="btn btn-secondary daily-spark-btn"
              onClick={() => {
                const link = `${window.location.origin}${window.location.pathname || ''}?spark_id=${id}`;
                navigator.clipboard?.writeText(link).then(() => alert('链接已复制，发给好友即可为你点亮')).catch(() => {});
              }}
            >
              复制链接
            </button>
          )}
          <button type="button" className="btn btn-secondary daily-spark-btn" onClick={onClose}>
            收下
          </button>
        </div>
        {id && (
          <p className="daily-spark-hint">分享链接后，好友可为你「点亮」这枚萤火</p>
        )}
      </div>
    </div>
  );
}

export default DailySparkCard;
