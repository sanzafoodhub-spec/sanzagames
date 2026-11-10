-- SanZa Chat PREVIEW ONLY. Run in the dedicated preview Supabase project.
-- Emergency pause state is readable/writable only via server-side service role.
create table if not exists public.chat_emergency_state (
 room_id uuid primary key references public.chat_rooms(id) on delete cascade,
 manual_pause boolean not null default false,
 paused_until timestamptz,
 updated_at timestamptz not null default now()
);
alter table public.chat_emergency_state enable row level security;
revoke all on public.chat_emergency_state from anon, authenticated;
insert into public.chat_emergency_state(room_id,manual_pause)
values ('0d17bbf7-8bf1-4766-a9a0-c6658e086e8c',false)
on conflict(room_id) do nothing;
create or replace function public.chat_emergency_auto_pause(p_room_id uuid,p_until timestamptz)
returns void language plpgsql security definer set search_path=public as $$
begin
 update public.chat_emergency_state
 set paused_until=greatest(coalesce(paused_until,now()),p_until),updated_at=now()
 where room_id=p_room_id and manual_pause=false;
end $$;
revoke all on function public.chat_emergency_auto_pause(uuid,timestamptz) from public,anon,authenticated;
grant execute on function public.chat_emergency_auto_pause(uuid,timestamptz) to service_role;
-- After applying this migration, set Vercel Preview branch environment variable:
-- CHAT_EMERGENCY_CONTROLS_ENABLED=true and redeploy preview.
