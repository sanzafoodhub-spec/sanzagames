-- Run ONLY in the sanza-chat-preview Supabase SQL Editor.
-- Limits new nickname registrations to 3 per network per rolling 15-minute window.
-- Shared Wi-Fi users may hit the limit; this is a cooldown, NOT a network-wide ban.
CREATE TABLE IF NOT EXISTS public.chat_registration_limits (
  ip_hash text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_registration_limits_hash_check CHECK (ip_hash ~ '^[a-f0-9]{64}$')
);
ALTER TABLE public.chat_registration_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_registration_limits FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.chat_registration_throttle(p_ip_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE v_attempts integer; v_start timestamptz; v_now timestamptz := clock_timestamp();
BEGIN
  IF p_ip_hash IS NULL OR p_ip_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid registration fingerprint';
  END IF;
  INSERT INTO public.chat_registration_limits AS l (ip_hash, window_start, attempts, updated_at)
  VALUES (p_ip_hash, v_now, 1, v_now)
  ON CONFLICT (ip_hash) DO UPDATE
  SET window_start = CASE WHEN l.window_start < v_now - interval '15 minutes' THEN v_now ELSE l.window_start END,
      attempts = CASE WHEN l.window_start < v_now - interval '15 minutes' THEN 1 ELSE l.attempts + 1 END,
      updated_at = v_now
  RETURNING attempts, window_start INTO v_attempts, v_start;
  RETURN jsonb_build_object('allowed', v_attempts <= 3,
    'retry_after', CASE WHEN v_attempts > 3 THEN GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_start + interval '15 minutes' - v_now)))::integer) ELSE 0 END);
END;
$$;
REVOKE ALL ON FUNCTION public.chat_registration_throttle(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_registration_throttle(text) TO service_role;
-- Periodically delete old rows as part of the privacy retention policy.
