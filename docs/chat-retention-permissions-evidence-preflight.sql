-- SanZa Chat PREVIEW ONLY: read-only security and evidence preflight
-- Run in sanza-chat-preview Supabase SQL Editor.
-- No writes, deletes, grants, or scheduled jobs.
SELECT 'retention_functions_and_execute_permissions' AS section,
       p.proname AS object_name,
       pg_get_userbyid(p.proowner) AS detail,
       coalesce(string_agg(DISTINCT CASE WHEN has_function_privilege(r.oid,p.oid,'EXECUTE')
         THEN r.rolname END, ', ' ORDER BY CASE WHEN has_function_privilege(r.oid,p.oid,'EXECUTE') THEN r.rolname END),'none') AS access_info
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
CROSS JOIN pg_roles r
WHERE n.nspname='public'
  AND p.proname IN ('chat_retention_preview_counts','chat_set_report_legal_hold')
  AND r.rolname IN ('anon','authenticated','service_role')
GROUP BY p.oid,p.proname,p.proowner
UNION ALL
SELECT 'table_permissions', c.relname, CASE WHEN c.relrowsecurity THEN 'RLS enabled' ELSE 'RLS DISABLED' END,
       concat_ws(', ',
         CASE WHEN has_table_privilege('anon',c.oid,'DELETE') THEN 'anon DELETE' END,
         CASE WHEN has_table_privilege('authenticated',c.oid,'DELETE') THEN 'authenticated DELETE' END,
         CASE WHEN has_table_privilege('anon',c.oid,'UPDATE') THEN 'anon UPDATE' END,
         CASE WHEN has_table_privilege('authenticated',c.oid,'UPDATE') THEN 'authenticated UPDATE' END)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p')
  AND c.relname IN ('chat_messages','chat_reports','chat_report_hold_audit')
UNION ALL
SELECT 'foreign_key', con.conname,
       con.confdeltype::text,
       pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class child ON child.oid=con.conrelid
JOIN pg_namespace n ON n.oid=child.relnamespace
WHERE n.nspname='public' AND con.contype='f'
  AND (child.relname IN ('chat_reports','chat_report_hold_audit')
       OR con.confrelid='public.chat_messages'::regclass)
ORDER BY section,object_name;
