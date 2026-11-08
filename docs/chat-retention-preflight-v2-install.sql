-- SanZa Chat PREVIEW ONLY: safe, audited retention preflight v2.
-- No DELETE statements. No cron scheduling. Does not modify messages/reports.
-- Only writes a dry_run entry to chat_retention_run_audit.
-- Requires the earlier approval/audit migration.
CREATE OR REPLACE FUNCTION public.chat_retention_preflight_v2(
  p_batch_limit integer DEFAULT 100
)
RETURNS TABLE(run_id bigint, candidate_messages bigint,
              age_qualified_reports bigint, approved_reports bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run_id bigint;
  v_messages bigint;
  v_age_reports bigint;
  v_approved_reports bigint;
BEGIN
  IF p_batch_limit IS NULL OR p_batch_limit NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Invalid batch limit';
  END IF;

  SELECT count(*) INTO v_messages FROM (
    SELECT m.id
    FROM public.chat_messages m
    WHERE m.created_at < pg_catalog.now() - interval '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id
      )
    ORDER BY m.created_at,m.id
    LIMIT p_batch_limit
  ) candidates;

  SELECT count(*) INTO v_age_reports
  FROM public.chat_reports r
  WHERE r.status='resolved'
    AND r.resolved_at < pg_catalog.now() - interval '90 days'
    AND r.legal_hold=false;

  SELECT count(*) INTO v_approved_reports
  FROM public.chat_reports r
  JOIN public.chat_retention_disposal_approvals a ON a.report_id=r.id
  WHERE r.status='resolved'
    AND r.resolved_at < pg_catalog.now() - interval '90 days'
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
  VALUES ('dry_run','completed',v_messages,v_approved_reports,0,0,pg_catalog.now())
  RETURNING id INTO v_run_id;

  RETURN QUERY SELECT v_run_id,v_messages,v_age_reports,v_approved_reports;
END;
$$;
REVOKE ALL ON FUNCTION public.chat_retention_preflight_v2(integer)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.chat_retention_preflight_v2(integer)
  TO service_role;

SELECT r.rolname AS role_name,
       has_function_privilege(r.oid,
         'public.chat_retention_preflight_v2(integer)','EXECUTE') AS can_execute
FROM pg_roles r
WHERE r.rolname IN ('anon','authenticated','service_role')
ORDER BY role_name;

-- This file defines the dry-run function but does NOT call it.
-- No destructive cleanup function or cron job is installed.
