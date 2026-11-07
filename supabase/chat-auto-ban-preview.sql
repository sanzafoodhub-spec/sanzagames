-- SanZa Chat preview: persistent automatic abuse counter.
-- Run once in the same PREVIEW Supabase SQL Editor.
create table if not exists public.chat_violations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null,
 category text not null,
 created_at timestamptz not null default now()
);
create index if not exists chat_violations_user_time_idx on public.chat_violations(user_id,created_at desc);
alter table public.chat_violations enable row level security;
revoke all on public.chat_violations from anon,authenticated;
-- Service-role API only. Review and purge older records periodically.
