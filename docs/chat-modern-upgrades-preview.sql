-- SanZa Chat modern upgrades, PREVIEW: run once in the chat Supabase SQL Editor.
-- Existing chat remains operational if these optional tables are not installed.
CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
 message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 emoji text NOT NULL CHECK (emoji IN ('😂','❤️','🔥','👍')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(message_id,user_id)
);
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_message_reactions FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS chat_reactions_message_idx ON public.chat_message_reactions(message_id);

CREATE TABLE IF NOT EXISTS public.chat_typing (
 room_id uuid NOT NULL,
 user_id uuid NOT NULL,
 nickname text NOT NULL,
 expires_at timestamptz NOT NULL,
 PRIMARY KEY(room_id,user_id)
);
ALTER TABLE public.chat_typing ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_typing FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS chat_typing_expires_idx ON public.chat_typing(room_id,expires_at);

CREATE TABLE IF NOT EXISTS public.chat_pinned_messages (
 room_id uuid PRIMARY KEY,
 message_id uuid NOT NULL,
 content text NOT NULL,
 nickname text NOT NULL,
 pinned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_pinned_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_pinned_messages FROM anon,authenticated;
