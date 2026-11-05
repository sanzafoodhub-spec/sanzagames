-- SanZa Chat preview: private server-side admin allow-list.
-- Run only in the dedicated SanZa Chat preview Supabase project.
-- This creates a new table; it does not alter or delete existing chat data.
-- No client (anon/authenticated) access is granted. The server will check this
-- table using the private service-role key, which must never reach the browser.

create table if not exists public.chat_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.chat_admins enable row level security;

revoke all privileges on table public.chat_admins from anon;
revoke all privileges on table public.chat_admins from authenticated;
grant select, insert, update, delete on table public.chat_admins to service_role;

-- The original Sanza account is added only after its auth.users row is verified.
-- Do not insert an admin ID until the read-only verification step is complete.
