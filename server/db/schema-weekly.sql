-- Step 3 依赖：weekly_report（若 Phase 2/3 已建可跳过）
-- 运行: psql $DATABASE_URL -f server/db/schema-weekly.sql

create table if not exists weekly_report (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  week_start date not null,
  week_end date not null,
  aggregated_json jsonb not null,
  viz_json jsonb,
  created_at timestamptz not null default now(),
  unique(user_id, week_start)
);

create index if not exists idx_weekly_report_user_time
  on weekly_report(user_id, week_start desc);
