-- Step 1: 邀请系统 — 关系绑定与分享
-- 运行: psql $DATABASE_URL -f server/db/schema-invite.sql
-- 若已有 daily_data/weekly_report，可单独执行本文件；否则与主 schema 一起执行。

-- 用户表：存储 invite_code（若主 schema 无 users 表则创建）
create table if not exists users (
  id text primary key,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_invite_code on users(invite_code);

-- 关系表：邀请人与被邀请人绑定
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  friend_id text not null,
  status text not null check (status in ('PENDING', 'ACTIVE')),
  created_at timestamptz not null default now(),
  unique(user_id, friend_id)
);

create index if not exists idx_relationships_user on relationships(user_id);
create index if not exists idx_relationships_friend on relationships(friend_id);
create index if not exists idx_relationships_status on relationships(status);

-- 为已有 user_id 生成 invite_code 的示例（应用层调用）:
-- INSERT INTO users (id, invite_code) VALUES ($1, $2)
-- ON CONFLICT (id) DO UPDATE SET invite_code = EXCLUDED.invite_code
-- 其中 invite_code 可为 nanoid(8) 或 uuid 短码，保证唯一即可。
