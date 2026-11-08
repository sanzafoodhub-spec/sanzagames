-- SanZa Chat PREVIEW — proposed cleanup job (NOT ENABLED)
-- Project: sanza-chat-preview ONLY. Do not run on production.
-- This file intentionally runs only SELECT statements.
-- No DELETE, no cron.schedule, no function installation.
--
-- Safeguards:
--  * Preserve any message still referenced by ANY report.
--  * Preserve pending reports and all legal_hold=true reports.
--  * Resolved reports may become eligible after 90 days only if legal_hold=false.
--  * A resolved report must not be removed if another pending/held report
--    refers to the same message (extra caution).
--  * If a report is removed in the future, its message may subsequently
--    become eligible for 30-day cleanup; that lifecycle needs testing.
--  * No assumption that legal_hold=false means safe to destroy evidence.
--  * Operator must review audit, backups, privacy rights, moderation
--    workflow, and applicable retention duties before activation.

WITH candidates AS (
  SELECT m.id
  FROM public.chat_messages m
  WHERE m.created_at < now() - interval '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id
    )
)
SELECT 'ordinary_messages_30d_no_reports' AS category, count(*) AS candidates
FROM candidates
UNION ALL
SELECT 'resolved_reports_90d_no_hold_no_other_pending_or_held',
       count(*)
FROM public.chat_reports r
WHERE r.status='resolved'
  AND r.resolved_at < now() - interval '90 days'
  AND r.legal_hold IS FALSE
  AND NOT EXISTS (
    SELECT 1 FROM public.chat_reports other
    WHERE other.message_id=r.message_id
      AND other.id<>r.id
      AND (other.status='pending' OR other.legal_hold IS TRUE)
  )
UNION ALL
SELECT 'pending_reports_protected',count(*)
FROM public.chat_reports WHERE status='pending'
UNION ALL
SELECT 'legal_hold_reports_protected',count(*)
FROM public.chat_reports WHERE legal_hold IS TRUE;

-- FUTURE IMPLEMENTATION ONLY; DO NOT EXECUTE YET.
-- Once legal/compliance review and integration tests pass, implement
-- cleanup as an audited, limited-privilege scheduled operation.
-- Delete resolved reports first (after preserving audit metadata if required),
-- then ordinary messages only where no report still references them.
-- Use explicit transactions, logging, bounded batches and failure alerts.
-- Never enable a job merely because this dry run returns expected counts.
