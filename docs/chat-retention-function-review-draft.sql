-- SANZA CHAT PREVIEW ONLY — REVIEW DRAFT, NOT FOR EXECUTION YET.
-- This is a proposed retention function, not a migration.
-- DO NOT RUN this file until schema/permissions, evidence-disposal and restore tests pass.
-- It intentionally contains NO DELETE statements and NO cron scheduling.
--
-- Returns a read-only snapshot of age-qualified records. An age-qualified
-- resolved report is NOT automatically authorised for evidence destruction.
CREATE OR REPLACE FUNCTION public.chat_retention_preview_counts()
RETURNS TABLE(check_name text, record_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT 'ordinary_messages_30d_no_reports'::text, count(*)
  FROM public.chat_messages m
  WHERE m.created_at < now() - interval '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_reports r WHERE r.message_id = m.id
    )
  UNION ALL
  SELECT 'resolved_reports_90d_unheld_review_only'::text, count(*)
  FROM public.chat_reports r
  WHERE r.status = 'resolved'
    AND r.resolved_at < now() - interval '90 days'
    AND r.legal_hold = false
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_reports other
      WHERE other.message_id = r.message_id AND other.id <> r.id
        AND (other.status = 'pending' OR other.legal_hold)
    )
  UNION ALL
  SELECT 'pending_reports_protected'::text, count(*)
  FROM public.chat_reports r WHERE r.status = 'pending'
  UNION ALL
  SELECT 'legal_hold_reports_protected'::text, count(*)
  FROM public.chat_reports r WHERE r.legal_hold = true
  UNION ALL
  SELECT 'reported_messages_protected'::text, count(DISTINCT r.message_id)
  FROM public.chat_reports r;
$$;
-- Before installing, restrict EXECUTE to a dedicated admin/service role.
-- Note: SECURITY INVOKER uses caller's RLS policies; do not rely on it for
-- authoritative counts until the executing role is confirmed.
-- Planned destructive cleanup needs separate audited approval, explicit
-- per-report evidence disposition, and isolated rollback/restore tests.
