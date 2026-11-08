-- SanZa Chat preview — retention DRY RUN ONLY
-- Read-only: no DELETE, UPDATE, function creation, or cron scheduling.
-- Run in Supabase project sanza-chat-preview, not production.
-- Proposed policy: ordinary messages 30 days; resolved reports 90 days
-- after resolution; preserve any report with an ongoing hold.
-- NOTE: A legal-hold mechanism is not yet implemented. Do NOT activate
-- deletion until this is addressed and privacy/security review is complete.

SELECT 'ordinary_messages_older_than_30_days_without_any_report' AS category,
       count(*)::bigint AS eligible
FROM public.chat_messages m
WHERE m.created_at < now() - interval '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM public.chat_reports r WHERE r.message_id = m.id
  )
UNION ALL
SELECT 'resolved_reports_older_than_90_days_REVIEW_ONLY', count(*)::bigint
FROM public.chat_reports r
WHERE r.status = 'resolved'
  AND r.resolved_at < now() - interval '90 days'
UNION ALL
SELECT 'pending_reports_must_remain', count(*)::bigint
FROM public.chat_reports r WHERE r.status = 'pending'
UNION ALL
SELECT 'messages_referenced_by_pending_reports_must_remain',
       count(DISTINCT r.message_id)::bigint
FROM public.chat_reports r WHERE r.status = 'pending';

-- Important:
-- Deleting resolved reports can release a previously reported message for
-- deletion, but that message might still be needed as evidence.
-- The admin workflow currently has no legal-hold flag. Also verify
-- backups, ban/device retention, audit needs, user rights, and deletion
-- order before implementing scheduled pg_cron cleanup.
