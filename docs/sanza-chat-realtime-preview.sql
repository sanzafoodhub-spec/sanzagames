-- Preview only. Review existing RLS policies BEFORE enabling realtime.
-- Run in the ORIGINAL chat Supabase project, not V2 staging.
-- Confirm authenticated SELECT on chat_messages is restricted to active room members,
-- and that anonymous users cannot subscribe to private chat messages.
-- Enable RLS if it is not already enabled; DO NOT replace existing policies blindly.
-- ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
-- After confirming SELECT policies, enable the publication:
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages') THEN
   ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
 END IF;
END $$;
-- Then configure SANZA_REALTIME_ENABLED=true on the PREVIEW Vercel project only.
-- Confirm 2 devices receive new messages, hidden messages update, and unauthenticated
-- subscriptions cannot read rows. Keep 2s polling as fallback until tested.
