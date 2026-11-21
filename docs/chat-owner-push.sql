-- Apply in the existing SanZa Chat Supabase SQL editor before enabling push.
-- Service role only: no browser client can read or write push endpoints.
create table if not exists public.chat_owner_push (
 endpoint text primary key,
 owner_id uuid not null,
 p256dh text not null,
 auth text not null,
 enabled boolean not null default true,
 last_active_at timestamptz,
 created_at timestamptz not null default now(),
 constraint chat_owner_push_owner_check check (owner_id='68548953-f190-448e-87e4-3a51d84869b7'::uuid),
 constraint chat_owner_push_endpoint_check check (length(endpoint) between 10 and 2048)
);
alter table public.chat_owner_push enable row level security;
revoke all on public.chat_owner_push from anon,authenticated;
create index if not exists chat_owner_push_enabled on public.chat_owner_push(owner_id,enabled);
-- The server uses the Supabase service role to bypass RLS after verified owner MFA.
