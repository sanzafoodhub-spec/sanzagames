-- SANZA CHAT 2.0 SESSION STORAGE — DRAFT ONLY. DO NOT RUN.
-- Apply ONLY to an isolated V2 Supabase staging project after approval.
-- Never run against the working SanZa Chat beta database without review.
begin;
create table if not exists public.chat_v2_owner_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint expiry_after_creation check (expires_at > created_at)
);
create index if not exists chat_v2_sessions_owner_idx
  on public.chat_v2_owner_sessions(owner_user_id, expires_at);
alter table public.chat_v2_owner_sessions enable row level security;
revoke all on public.chat_v2_owner_sessions from anon, authenticated;
-- No public RLS policies; only a trusted backend service role may access.
-- Expired records should be periodically purged after audit retention review.
commit;
