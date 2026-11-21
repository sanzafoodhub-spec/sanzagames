-- SanZa Chat preview: step 1, emoji reactions
create table if not exists public.chat_message_reactions (
 message_id uuid not null references public.chat_messages(id) on delete cascade,
 user_id uuid not null,
 emoji text not null check (emoji in ('😂','❤️','🔥','👍')),
 created_at timestamptz not null default now(),
 primary key (message_id,user_id)
);
alter table public.chat_message_reactions enable row level security;
revoke all on public.chat_message_reactions from anon, authenticated;
create index if not exists chat_reactions_message_idx on public.chat_message_reactions(message_id);
