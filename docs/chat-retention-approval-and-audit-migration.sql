-- SANZA CHAT PREVIEW ONLY — REVIEW BEFORE RUNNING
-- Retention infrastructure. Does NOT delete records or schedule jobs.
-- Execute only in the sanza-chat-preview project after reviewing privileges.
BEGIN;

CREATE TABLE IF NOT EXISTS public.chat_retention_disposal_approvals (
  report_id uuid PRIMARY KEY REFERENCES public.chat_reports(id) ON DELETE RESTRICT,
  approved_by uuid NOT NULL REFERENCES auth.users(id),
  approved_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL CHECK (length(btrim(reason)) BETWEEN 10 AND 500),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id)
);
CREATE TABLE IF NOT EXISTS public.chat_retention_run_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  run_mode text NOT NULL CHECK (run_mode IN ('dry_run','execute')),
  status text NOT NULL CHECK (status IN ('started','completed','failed')),
  candidate_messages bigint NOT NULL DEFAULT 0,
  candidate_reports bigint NOT NULL DEFAULT 0,
  deleted_messages bigint NOT NULL DEFAULT 0,
  deleted_reports bigint NOT NULL DEFAULT 0,
  error_detail text
);
ALTER TABLE public.chat_retention_disposal_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_retention_run_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_retention_disposal_approvals FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.chat_retention_run_audit FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.chat_retention_run_audit_id_seq FROM PUBLIC,anon,authenticated;

-- No user-accessible approval-writing function. A reviewed service-side
-- administrative workflow must verify admin identity and document evidence needs.
-- No pg_cron schedule is created.
COMMIT;

-- PREVIEW ONLY — candidate review query, safe to run repeatedly.
SELECT
 (SELECT count(*) FROM public.chat_messages m
  WHERE m.created_at < now()-interval '30 days'
  AND NOT EXISTS(SELECT 1 FROM public.chat_reports r WHERE r.message_id=m.id))
    AS ordinary_message_candidates,
 (SELECT count(*) FROM public.chat_reports r
  JOIN public.chat_retention_disposal_approvals a ON a.report_id=r.id
  WHERE r.status='resolved'
    AND r.resolved_at < now()-interval '90 days'
    AND r.legal_hold=false AND a.revoked_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.chat_reports other
      WHERE other.message_id=r.message_id AND other.id<>r.id
        AND (other.status='pending' OR other.legal_hold)
    )) AS approved_report_candidates;
