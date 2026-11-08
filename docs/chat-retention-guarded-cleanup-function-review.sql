-- SanZa Chat PREVIEW ONLY — guarded retention cleanup function.
-- REVIEW DRAFT: DO NOT RUN YET. This file defines a function but does not call it.
-- No cron schedule, no automatic deletion. Service role only.
-- IMPORTANT: report deletion is intentionally NOT implemented. Both
-- chat_report_hold_audit.report_id and chat_retention_disposal_approvals.report_id
-- reference chat_reports and require evidence-preserving archival/disposition.
-- This function can ONLY delete old messages that have NEVER been reported.
-- Default p_execute=false records a dry run; p_execute=true is a manual,
-- service-role-only operation and MUST NOT be used before restore tests.

CREATE OR REPLACE FUNCTION public.chat_retention_cleanup_preview(
  p_execute boolean DEFAULT false,
  p_batch_limit integer DEFAULT 100
)
RETURNS TABLE(run_id bigint, run_mode text, candidate_messages bigint,
              deleted_messages bigint, candidate_reports bigint,
              deleted_reports bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run_id bigint;
  v_candidates bigint;
  v_deleted bigint := 0;
  v_mode text;
BEGIN
  IF p_execute IS NULL OR p_batch_limit IS NULL
     OR p_batch_limit NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'Invalid cleanup parameters';
  END IF;

  -- Prevent overlapping executions. Transaction-scoped lock.
  IF NOT pg_catalog.pg_try_advisory_xact_lock(824117, 20261108) THEN
    RAISE EXCEPTION 'Cleanup already running';
  END IF;

  v_mode := CASE WHEN p_execute THEN 'execute' ELSE 'dry_run' END;

  -- All reported messages are excluded, regardless of report status.
  SELECT count(*) INTO v_candidates
  FROM (
    SELECT m.id
    FROM public.chat_messages m
    WHERE m.created_at < pg_catalog.now() - interval '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id
      )
    ORDER BY m.created_at,m.id
    LIMIT p_batch_limit
  ) q;

  INSERT INTO public.chat_retention_run_audit
    (run_mode,status,candidate_messages,candidate_reports,
     deleted_messages,deleted_reports)
  VALUES (v_mode,'started',v_candidates,0,0,0)
  RETURNING id INTO v_run_id;

  IF p_execute THEN
    -- Recheck the report protection at DELETE time.
    WITH candidates AS (
      SELECT m.id FROM public.chat_messages m
      WHERE m.created_at < pg_catalog.now() - interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id
        )
      ORDER BY m.created_at,m.id
      LIMIT p_batch_limit
      FOR UPDATE OF m SKIP LOCKED
    ), removed AS (
      DELETE FROM public.chat_messages m
      USING candidates c
      WHERE m.id=c.id
        AND m.created_at < pg_catalog.now() - interval '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id
        )
      RETURNING m.id
    )
    SELECT count(*) INTO v_deleted FROM removed;
  END IF;

  UPDATE public.chat_retention_run_audit
  SET status='completed',finished_at=pg_catalog.now(),
      deleted_messages=v_deleted
  WHERE id=v_run_id;

  RETURN QUERY SELECT v_run_id,v_mode,v_candidates,v_deleted,
                      0::bigint,0::bigint;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_retention_cleanup_preview(boolean,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_retention_cleanup_preview(boolean,integer)
  TO service_role;

-- The definition above does not execute cleanup.
-- IMPORTANT: Do NOT call with p_execute=true until recovery, backup,
-- concurrent-report race, and other dependent foreign-key tests pass.
-- No scheduled job is installed by this file.
