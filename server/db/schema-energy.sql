-- Step 4: 每日能量投射 — Glimmer_Core 投射与接收
-- 运行: psql $DATABASE_URL -f server/db/schema-energy.sql

create table if not exists energy_projections (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null references users(id) on delete cascade,
  recipient_id text not null,
  created_at timestamptz not null default now(),
  seen_at timestamptz
);

create index if not exists idx_energy_projections_recipient_seen
  on energy_projections(recipient_id, seen_at);
create index if not exists idx_energy_projections_sender_created
  on energy_projections(sender_id, created_at);
