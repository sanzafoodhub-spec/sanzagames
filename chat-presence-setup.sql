-- SanZa Chat preview: online presence (run in Supabase SQL Editor).
-- No existing messages or members are deleted.
ALTER TABLE public.chat_members
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
CREATE INDEX IF NOT EXISTS chat_members_room_presence_idx
  ON public.chat_members (room_id, last_seen_at)
  WHERE is_active = true;
-- Existing table RLS and grants remain unchanged; API uses service-role server-side.
