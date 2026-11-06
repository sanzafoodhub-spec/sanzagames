-- SanZa Chat 2.0: READ-ONLY schema and policy inspection
-- Paste into Supabase SQL Editor and RUN; this does not change data or settings.
-- Do not paste passwords, service-role keys, or private email addresses into chat.

select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('chat_admins','chat_members','chat_messages','chat_reports','chat_rooms')
order by table_name, ordinal_position;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('chat_admins','chat_members','chat_messages','chat_reports','chat_rooms')
order by tablename, policyname;

select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('chat_admins','chat_members','chat_messages','chat_reports','chat_rooms')
  and c.relkind in ('r','p')
order by c.relname;
