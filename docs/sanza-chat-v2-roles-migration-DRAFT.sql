-- SANZA CHAT 2.0 — DRAFT ONLY. DO NOT RUN YET.
-- Additive migration design; review in a separate V2 database/staging project first.
-- This does not alter public.chat_admins or its existing rows.
-- Replace OWNER_USER_UUID_HERE with the confirmed owner auth.users.id ONLY when approved.
-- The SQL below intentionally omits the owner INSERT and grants; provisioning must be reviewed.

begin;

create table if not exists public.chat_v2_roles (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null check (role in ('owner','moderator')),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint active_owner_not_revoked check (role <> 'owner' or revoked_at is null)
);

create unique index if not exists chat_v2_one_active_owner
  on public.chat_v2_roles ((role))
  where role = 'owner' and revoked_at is null;

alter table public.chat_v2_roles enable row level security;
revoke all on public.chat_v2_roles from anon, authenticated;
-- No policies: clients cannot read or write roles directly.
-- API may read via trusted server-only service role; never expose service key.
-- Privileged owner bootstrap is a separate reviewed one-time operation.

create table if not exists public.chat_v2_moderation_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id),
  target_user_id uuid references auth.users(id),
  action text not null,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.chat_v2_moderation_audit enable row level security;
revoke all on public.chat_v2_moderation_audit from anon, authenticated;
-- Audit inserts/reads only via trusted server with role checks.

-- Intentionally no migration of existing admin IDs, no owner assignment,
-- no modifications to chat_admins, no deployment.
commit;
