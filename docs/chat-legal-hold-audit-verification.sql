-- SanZa Chat PREVIEW ONLY — read-only legal-hold audit verification
-- Run in Supabase SQL Editor for sanza-chat-preview.
-- No changes, deletes or scheduled jobs.
WITH events AS (
  SELECT a.report_id, a.changed_at, a.changed_by, a.old_hold, a.new_hold,
         a.reason,
         r.legal_hold AS current_hold,
         r.status AS report_status,
         EXISTS (SELECT 1 FROM public.chat_admins ad WHERE ad.user_id=a.changed_by) AS actor_is_admin,
         row_number() OVER (PARTITION BY a.report_id ORDER BY a.changed_at DESC, a.id DESC) AS latest
  FROM public.chat_report_hold_audit a
  JOIN public.chat_reports r ON r.id=a.report_id
)
SELECT report_id, changed_at, changed_by, actor_is_admin,
       CASE WHEN old_hold THEN 'ON' ELSE 'OFF' END AS previous_hold,
       CASE WHEN new_hold THEN 'ON' ELSE 'OFF' END AS new_hold,
       reason, report_status,
       CASE WHEN latest=1 AND current_hold IS DISTINCT FROM new_hold
         THEN 'MISMATCH — REVIEW'
         ELSE 'OK' END AS audit_consistency
FROM events
ORDER BY changed_at DESC
LIMIT 25;
