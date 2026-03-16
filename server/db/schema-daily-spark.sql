-- Daily Spark: AI-generated daily card (core_trait, mood_color, summary, image, luminosity)
-- 由 server 启动时自动执行（initDailySparkSchema.js）；也可手动：psql $DATABASE_URL -f server/db/schema-daily-spark.sql

create table if not exists daily_spark (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  entry_date date not null,
  entry_type text not null check (entry_type in ('morning', 'evening')),
  source_text text,
  core_trait text,
  mood_color_hex text,
  summary_sentence text,
  abstract_symbol_prompt text,
  daily_spark_image_url text,
  daily_spark_luminosity_count int not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, entry_date, entry_type)
);

create index if not exists idx_daily_spark_user_date
  on daily_spark(user_id, entry_date desc);
create index if not exists idx_daily_spark_id
  on daily_spark(id);
