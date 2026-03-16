/**
 * 将 Phase 3 viz_json 转为 SVG 字符串，供分享卡片等使用
 * viz_json 结构: { canvas, stars, path, summary }
 * 若传入 luminosityByDate（日期 -> 点亮次数），星点大小与亮度与之成正比
 */

/**
 * @param {object} viz - weekly_report.viz_json (Phase 3)
 * @param {object} [opts] - { week_start?: string 'YYYY-MM-DD', luminosity_by_date?: Record<string, number> }
 * @returns {string} SVG 字符串
 */
export function vizJsonToSvgString(viz, opts = {}) {
  if (!viz || !viz.canvas || !viz.stars || !viz.path) return '';

  const { width, height } = viz.canvas;
  const stroke = 'rgba(186, 148, 255, 0.6)';
  const { week_start: weekStart, luminosity_by_date: luminosityByDate } = opts;

  const polyline = `<polyline fill="none" stroke="${stroke}" stroke-width="${viz.path.stroke_width || 2}" points="${viz.path.points}"/>`;

  const dates = weekStart ? getWeekDates(weekStart, viz.stars.length) : [];
  const circles = viz.stars
    .map((s, i) => {
      const count = dates[i] && luminosityByDate && luminosityByDate[dates[i]] != null
        ? luminosityByDate[dates[i]]
        : 0;
      const r = 4 + Math.min(count, 6);
      const opacity = 0.5 + 0.5 * Math.min(1, (count + 1) / 4);
      const fill = `rgba(186, 148, 255, ${opacity})`;
      return `<circle cx="${s.x}" cy="${s.y}" r="${r}" fill="${fill}"/>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${polyline}${circles}</svg>`;
}

function getWeekDates(weekStart, count) {
  const dates = [];
  const d = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < count; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    dates.push(x.toISOString().slice(0, 10));
  }
  return dates;
}
