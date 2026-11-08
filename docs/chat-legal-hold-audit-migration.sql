-- SanZa Chat PREVIEW ONLY: legal-hold audit foundation
-- Run in sanza-chat-preview Supabase SQL Editor.
-- Additive schema changes; does not delete or change existing reports.
ALTER TABLE public.chat_reports
  ADD COLUMN IF NOT EXISTS legal_hold_reason text,
  ADD COLUMN IF NOT EXISTS legal_hold_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS legal_hold_changed_by uuid;

CREATE TABLE IF NOT EXISTS public.chat_report_hold_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id uuid NOT NULL REFERENCES public.chat_reports(id),
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  old_hold boolean NOT NULL,
  new_hold boolean NOT NULL,
  reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 5 AND 500),
  changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_report_hold_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.chat_report_hold_audit FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.chat_report_hold_audit_id_seq FROM PUBLIC, anon, authenticated;
-- The API service role will write audit rows, after verifying admin status.
-- Do not enable automatic cleanup yet.
