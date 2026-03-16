import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './inviteDb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 启动时确保 daily_spark 表存在（执行 schema-daily-spark.sql）。
 * 无 DATABASE_URL 时跳过；失败时抛出，由调用方决定是否阻止启动。
 */
export async function ensureDailySparkSchema() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return;

  const sqlPath = path.join(__dirname, 'schema-daily-spark.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  const db = getPool(connectionString);
  await db.query(sql);
}
