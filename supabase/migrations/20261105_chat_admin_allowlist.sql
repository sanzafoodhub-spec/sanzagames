-- SanZa Chat preview: lock the original owner account to admin.
-- Run only in the dedicated SanZa Chat preview Supabase project.
-- This creates a separate admin allow-list and does not alter existing chat data.

create table if not exists public.chat_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.chat_admins enable row level security;

-- Only an authenticated admin can read the admin allow-list.
drop policy if exists "Admins can view admin list" on public.chat_admins;
create policy "Admins can view admin list"
on public.chat_admins
for select
to authenticated
using (user_id = auth.uid());

revoke all privileges on table public.chat_admins from anon;
revoke all privileges on table public.chat_admins from authenticated;
grant select on table public.chat_admins to authenticated;

-- Original Sanza test account: preserve its existing auth.users identity.
insert into public.chat_admins (user_id)
values ('44f1e2b9-fc59-4c3f-8577-613ec6dbeab0'::uuid)
on conflict (user_id) do nothing;
