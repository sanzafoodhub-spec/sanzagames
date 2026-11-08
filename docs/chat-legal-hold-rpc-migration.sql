-- SanZa Chat PREVIEW ONLY: atomic, audited legal-hold changes.
-- Run in Supabase SQL Editor for sanza-chat-preview.
-- Only the backend service role can execute this function.
CREATE OR REPLACE FUNCTION public.chat_set_report_legal_hold(
  p_report_id uuid,
  p_admin_id uuid,
  p_new_hold boolean,
  p_reason text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE v_old_hold boolean;
BEGIN
  IF p_report_id IS NULL OR p_admin_id IS NULL OR p_new_hold IS NULL
     OR char_length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'Invalid legal hold request';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.chat_admins WHERE user_id=p_admin_id) THEN
    RAISE EXCEPTION 'Administrator required';
  END IF;
  SELECT legal_hold INTO v_old_hold
  FROM public.chat_reports
  WHERE id=p_report_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found';
  END IF;
  IF v_old_hold IS NOT DISTINCT FROM p_new_hold THEN
    RETURN false;
  END IF;
  UPDATE public.chat_reports
  SET legal_hold=p_new_hold,
      legal_hold_reason=btrim(p_reason),
      legal_hold_changed_at=now(),
      legal_hold_changed_by=p_admin_id
  WHERE id=p_report_id;
  INSERT INTO public.chat_report_hold_audit
    (report_id,changed_by,old_hold,new_hold,reason)
  VALUES (p_report_id,p_admin_id,v_old_hold,p_new_hold,btrim(p_reason));
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.chat_set_report_legal_hold(uuid,uuid,boolean,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_set_report_legal_hold(uuid,uuid,boolean,text)
  TO service_role;
-- No cleanup job is scheduled by this migration.
