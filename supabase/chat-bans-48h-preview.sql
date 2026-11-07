-- Run once in the SanZa Chat PREVIEW Supabase SQL editor before deploying the ban API.
-- Keep this table inaccessible to browser roles. Service-role API only.
create table if not exists public.chat_bans (
 id uuid primary key default gen_random_uuid(),
 user_id uuid null,
 ip_hash text null check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
 reason text not null default 'Temporary chat ban',
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 constraint chat_bans_identity check (user_id is not null or ip_hash is not null)
);
create index if not exists chat_bans_user_expiry_idx on public.chat_bans(user_id,expires_at);
create index if not exists chat_bans_ip_expiry_idx on public.chat_bans(ip_hash,expires_at);
alter table public.chat_bans enable row level security;
revoke all on public.chat_bans from anon,authenticated;
-- Do not create public read/write policies. Service role bypasses RLS.
-- Set CHAT_BAN_HASH_SECRET to a random 32+ character value in Vercel preview.
-- 48-hour bans are initially by user ID; IP fingerprint ban creation needs a separate trusted capture mechanism.
