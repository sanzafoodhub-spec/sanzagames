-- SanZa Chat V2 staging only. Review and apply ONLY to sanza-chat-v2-staging.
-- Never run against the existing SanZa Chat Supabase project.
create table if not exists public.chat_v2_owner_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  constraint chat_v2_owner_session_expiry check (expires_at > created_at)
);
create index if not exists chat_v2_owner_sessions_owner_idx
  on public.chat_v2_owner_sessions(owner_user_id);
create index if not exists chat_v2_owner_sessions_expiry_idx
  on public.chat_v2_owner_sessions(expires_at);
alter table public.chat_v2_owner_sessions enable row level security;
revoke all on public.chat_v2_owner_sessions from anon, authenticated, public;
-- No policies. Only server-side service role may access this table.
