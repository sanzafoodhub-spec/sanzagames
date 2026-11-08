-- SANZA CHAT PREVIEW ONLY: audited retention DRY RUN
-- Run only in Supabase project sanza-chat-preview after reviewing.
-- Creates a restricted function; DOES NOT DELETE messages/reports.
-- DOES NOT create or enable a cron job.
CREATE OR REPLACE FUNCTION public.chat_retention_dry_run()
RETURNS TABLE(run_id bigint, ordinary_message_candidates bigint, approved_report_candidates bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_messages bigint;
  v_reports bigint;
  v_run_id bigint;
BEGIN
  -- Count ordinary messages with no report references.
  SELECT count(*) INTO v_messages
  FROM public.chat_messages m
  WHERE m.created_at < now() - interval '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id
    );

  -- Resolved reports must have a non-revoked, explicit disposal approval.
  -- No pending or held report on the same message may be present.
  SELECT count(*) INTO v_reports
  FROM public.chat_reports r
  JOIN public.chat_retention_disposal_approvals a ON a.report_id=r.id
  WHERE r.status='resolved'
    AND r.resolved_at < now()-interval '90 days'
    AND r.legal_hold=false
    AND a.revoked_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_reports other
      WHERE other.message_id=r.message_id AND other.id<>r.id
        AND (other.status='pending' OR other.legal_hold)
    );

  INSERT INTO public.chat_retention_run_audit
    (run_mode,status,candidate_messages,candidate_reports,
     deleted_messages,deleted_reports,finished_at)
  VALUES ('dry_run','completed',v_messages,v_reports,0,0,now())
  RETURNING id INTO v_run_id;

  RETURN QUERY SELECT v_run_id,v_messages,v_reports;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_retention_dry_run() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_retention_dry_run() TO service_role;

-- VERIFY PRIVILEGES (read-only)
SELECT r.rolname AS role_name,
       has_function_privilege(r.oid,'public.chat_retention_dry_run()','EXECUTE') AS can_execute
FROM pg_roles r
WHERE r.rolname IN ('anon','authenticated','service_role')
ORDER BY role_name;

-- IMPORTANT: Do NOT call chat_retention_dry_run() from the SQL editor
-- until we explicitly agree to create a test audit row.
-- This function does not delete any records.
