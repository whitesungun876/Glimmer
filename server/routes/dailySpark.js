import { Router } from 'express';
import {
  upsertDailySpark,
  getDailySparkById,
  getDailySparkByUserAndDate,
  incrementLuminosity,
} from '../db/dailySparkDb.js';
import { getDailySparkFromLLM } from '../services/dailySparkLLM.js';
import { generateDailySparkImageUrl } from '../services/dailySparkImage.js';
import { generateDailySparkImageFromLLM } from '../services/dailySparkImageGen.js';

const router = Router();

/**
 * POST /api/daily_spark/generate
 * Body: { user_id, entry_type: 'morning'|'evening', source_text, user_name? }
 * Trigger: right after morning/evening submit.
 * Returns: { id, daily_spark_image_url, core_trait, mood_color_hex, summary_sentence, daily_spark_luminosity_count }
 */
router.post('/daily_spark/generate', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { user_id: userId, entry_type: entryType, source_text: sourceText, user_name: userName } = req.body || {};
  if (!userId || !entryType || !sourceText) {
    return res.status(400).json({ error: 'user_id, entry_type, and source_text are required' });
  }
  if (!['morning', 'evening'].includes(entryType)) {
    return res.status(400).json({ error: 'entry_type must be morning or evening' });
  }
  const entryDate = new Date().toISOString().slice(0, 10);

  try {
    const llm = await getDailySparkFromLLM(sourceText);
    // 1. 总结已有（llm）；2. 文生图：用 abstract_symbol_prompt 生成配图，失败则用 SVG 兜底
    let imageUrl = await generateDailySparkImageFromLLM(llm);
    if (!imageUrl) {
      imageUrl = generateDailySparkImageUrl({
        mood_color_hex: llm.mood_color_hex,
        summary_sentence: llm.summary_sentence,
        user_name: userName,
      });
    }
    const row = await upsertDailySpark(connectionString, {
      userId,
      entryDate,
      entryType,
      sourceText,
      coreTrait: llm.core_trait,
      moodColorHex: llm.mood_color_hex,
      summarySentence: llm.summary_sentence,
      abstractSymbolPrompt: llm.abstract_symbol_prompt,
      dailySparkImageUrl: imageUrl,
    });
    return res.status(200).json({
      id: row.id,
      daily_spark_image_url: row.daily_spark_image_url,
      core_trait: row.core_trait,
      mood_color_hex: row.mood_color_hex,
      summary_sentence: row.summary_sentence,
      daily_spark_luminosity_count: row.daily_spark_luminosity_count ?? 0,
    });
  } catch (err) {
    console.error('daily_spark/generate', err);
    return res.status(500).json({ error: 'Failed to generate daily spark' });
  }
});

/**
 * GET /api/daily_spark/:id
 * Public: for shared link / light-up page. Returns spark card data.
 */
router.get('/daily_spark/:id', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const sparkId = req.params.id;
  try {
    const row = await getDailySparkById(connectionString, sparkId);
    if (!row) return res.status(404).json({ error: 'Spark not found' });
    return res.json({
      id: row.id,
      user_id: row.user_id,
      entry_date: row.entry_date,
      entry_type: row.entry_type,
      core_trait: row.core_trait,
      mood_color_hex: row.mood_color_hex,
      summary_sentence: row.summary_sentence,
      daily_spark_image_url: row.daily_spark_image_url,
      daily_spark_luminosity_count: row.daily_spark_luminosity_count ?? 0,
    });
  } catch (err) {
    console.error('daily_spark get', err);
    return res.status(500).json({ error: 'Failed to get spark' });
  }
});

/**
 * GET /api/daily_spark?user_id=xxx&entry_date=YYYY-MM-DD&entry_type=morning|evening
 */
router.get('/daily_spark', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { user_id: userId, entry_date: entryDate, entry_type: entryType } = req.query;
  if (!userId || !entryDate || !entryType) {
    return res.status(400).json({ error: 'user_id, entry_date, entry_type are required' });
  }
  try {
    const row = await getDailySparkByUserAndDate(connectionString, userId, entryDate, entryType);
    if (!row) return res.status(404).json({ error: 'Spark not found' });
    return res.json({
      id: row.id,
      daily_spark_image_url: row.daily_spark_image_url,
      core_trait: row.core_trait,
      mood_color_hex: row.mood_color_hex,
      summary_sentence: row.summary_sentence,
      daily_spark_luminosity_count: row.daily_spark_luminosity_count ?? 0,
    });
  } catch (err) {
    console.error('daily_spark get', err);
    return res.status(500).json({ error: 'Failed to get spark' });
  }
});

/**
 * POST /api/daily_spark/light_up
 * Body: { spark_id }
 * On "Light Up" click: increment daily_spark_luminosity_count.
 */
router.post('/daily_spark/light_up', async (req, res) => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }
  const { spark_id: sparkId } = req.body || {};
  if (!sparkId) {
    return res.status(400).json({ error: 'spark_id is required' });
  }
  try {
    const count = await incrementLuminosity(connectionString, sparkId);
    return res.json({ ok: true, daily_spark_luminosity_count: count });
  } catch (err) {
    console.error('daily_spark/light_up', err);
    return res.status(500).json({ error: 'Failed to light up' });
  }
});

export default router;
