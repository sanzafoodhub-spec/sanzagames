-- Run only in Supabase project sanza-chat-preview, before deploying the matching preview code.
ALTER TABLE public.chat_bans ADD COLUMN IF NOT EXISTS device_hash text;
CREATE INDEX IF NOT EXISTS chat_bans_device_active_idx ON public.chat_bans (device_hash, expires_at) WHERE device_hash IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.chat_user_devices (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 device_hash text NOT NULL CHECK (device_hash ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id,device_hash)
);
CREATE INDEX IF NOT EXISTS chat_user_devices_user_idx ON public.chat_user_devices(user_id);
ALTER TABLE public.chat_user_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_user_devices FROM PUBLIC,anon,authenticated;
-- Service role is used only by the server. Delete device links according to a documented retention policy.
