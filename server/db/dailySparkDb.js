import { getPool } from './inviteDb.js';

/**
 * 插入或更新一条 daily_spark（按 user_id + entry_date + entry_type 唯一）
 */
export async function upsertDailySpark(connectionString, row) {
  const db = getPool(connectionString);
  const {
    userId,
    entryDate,
    entryType,
    sourceText,
    coreTrait,
    moodColorHex,
    summarySentence,
    abstractSymbolPrompt,
    dailySparkImageUrl,
  } = row;
  await db.query(
    `INSERT INTO daily_spark (
      user_id, entry_date, entry_type, source_text,
      core_trait, mood_color_hex, summary_sentence, abstract_symbol_prompt, daily_spark_image_url
    ) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (user_id, entry_date, entry_type) DO UPDATE SET
      source_text = EXCLUDED.source_text,
      core_trait = EXCLUDED.core_trait,
      mood_color_hex = EXCLUDED.mood_color_hex,
      summary_sentence = EXCLUDED.summary_sentence,
      abstract_symbol_prompt = EXCLUDED.abstract_symbol_prompt,
      daily_spark_image_url = EXCLUDED.daily_spark_image_url,
      created_at = now()`,
    [
      userId,
      entryDate,
      entryType,
      sourceText || null,
      coreTrait || null,
      moodColorHex || null,
      summarySentence || null,
      abstractSymbolPrompt || null,
      dailySparkImageUrl || null,
    ]
  );
  const res = await db.query(
    `SELECT id, user_id, entry_date, entry_type, core_trait, mood_color_hex, summary_sentence,
            daily_spark_image_url, daily_spark_luminosity_count, created_at
     FROM daily_spark WHERE user_id = $1 AND entry_date = $2::date AND entry_type = $3`,
    [userId, entryDate, entryType]
  );
  return res.rows[0];
}

/**
 * 按 id 查询（用于公开点亮页）
 */
export async function getDailySparkById(connectionString, sparkId) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT id, user_id, entry_date, entry_type, core_trait, mood_color_hex, summary_sentence,
            daily_spark_image_url, daily_spark_luminosity_count, created_at
     FROM daily_spark WHERE id = $1`,
    [sparkId]
  );
  return res.rows[0] ?? null;
}

/**
 * 按用户 + 日期 + 类型查询
 */
export async function getDailySparkByUserAndDate(connectionString, userId, entryDate, entryType) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT id, user_id, entry_date, entry_type, core_trait, mood_color_hex, summary_sentence,
            daily_spark_image_url, daily_spark_luminosity_count, created_at
     FROM daily_spark WHERE user_id = $1 AND entry_date = $2::date AND entry_type = $3`,
    [userId, entryDate, entryType]
  );
  return res.rows[0] ?? null;
}

/**
 * 点亮：daily_spark_luminosity_count + 1
 */
export async function incrementLuminosity(connectionString, sparkId) {
  const db = getPool(connectionString);
  await db.query(
    `UPDATE daily_spark SET daily_spark_luminosity_count = daily_spark_luminosity_count + 1 WHERE id = $1`,
    [sparkId]
  );
  const res = await db.query(
    `SELECT daily_spark_luminosity_count FROM daily_spark WHERE id = $1`,
    [sparkId]
  );
  return res.rows[0]?.daily_spark_luminosity_count ?? 0;
}

/**
 * 获取用户某周内每日的 luminosity（用于周图谱节点亮度）
 * entry_date 为 week_start..week_end 的每一天
 */
export async function getLuminosityByUserAndWeek(connectionString, userId, weekStart, weekEnd) {
  const db = getPool(connectionString);
  const res = await db.query(
    `SELECT entry_date::text as date, daily_spark_luminosity_count as luminosity
     FROM daily_spark
     WHERE user_id = $1 AND entry_date >= $2::date AND entry_date <= $3::date
     ORDER BY entry_date`,
    [userId, weekStart, weekEnd]
  );
  return res.rows;
}
