/**
 * Daily Spark image: generate a data URL SVG from mood_color_hex + summary_sentence + user_name.
 * No external image API required for MVP. Replace with DALL-E/Stable Diffusion later if needed.
 */

function escapeXml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * @param {object} opts - { mood_color_hex, summary_sentence, user_name }
 * @returns {string} data URL (data:image/svg+xml;base64,...)
 */
export function generateDailySparkImageUrl(opts) {
  const hex = opts.mood_color_hex || '#BA94FF';
  const summary = opts.summary_sentence || '今天的你，值得被看见。';
  const name = opts.user_name ? `${opts.user_name}的拾光` : '拾光';
  const w = 800;
  const h = 1000;
  const padding = 48;
  const titleSize = 28;
  const summarySize = 22;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${hex};stop-opacity:0.25"/>
      <stop offset="100%" style="stop-color:${hex};stop-opacity:0.08"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect x="${padding}" y="${padding}" width="${w - 2 * padding}" height="${h - 2 * padding}" rx="24" fill="rgba(26,26,46,0.85)" stroke="${hex}" stroke-width="2"/>
  <text x="${w / 2}" y="${h * 0.32}" text-anchor="middle" fill="${hex}" font-size="20" font-family="PingFang SC, sans-serif">${escapeXml(name)}</text>
  <text x="${w / 2}" y="${h * 0.48}" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-size="${summarySize}" font-family="PingFang SC, sans-serif" filter="url(#glow)">${escapeXml(summary)}</text>
  <text x="${w / 2}" y="${h * 0.58}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="14" font-family="PingFang SC, sans-serif">✨ 拾光 Glimmer</text>
</svg>`;

  const base64 = Buffer.from(svg, 'utf8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
