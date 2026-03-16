-- Step 2: 天赋互证 — 验证请求与 strength_luminosity
-- 运行: psql $DATABASE_URL -f server/db/schema-validation.sql

-- 验证请求：A 的周报生成后向好友 B 推送“认同该天赋吗”
create table if not exists validation_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id text not null references users(id) on delete cascade,
  validator_id text not null,
  week_start date not null,
  target_strength text not null,
  requester_display_name text,
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'SKIPPED')),
  created_at timestamptz not null default now(),
  unique(requester_id, validator_id, week_start, target_strength)
);

create index if not exists idx_validation_requests_validator_status
  on validation_requests(validator_id, status);
create index if not exists idx_validation_requests_requester_week
  on validation_requests(requester_id, week_start);

-- 用户某天赋的“光晕”累计（好友认同一次 +1）
create table if not exists user_strength_luminosity (
  user_id text not null references users(id) on delete cascade,
  strength_tag text not null,
  luminosity int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, strength_tag)
);
