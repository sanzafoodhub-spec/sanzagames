# SanZa Chat preview backend setup

This is for the dedicated SanZa Chat preview Supabase project and the Vercel project
`sanzagames-preview` only. Do not add these credentials to Production.

## Vercel Preview environment variables

In Vercel → sanzagames-preview → Settings → Environment Variables, add each variable
with Target = Preview and Git Branch = `sanza-chat-preview`:

- `SUPABASE_URL`: Project URL from Supabase → Project Settings → API.
- `SUPABASE_ANON_KEY`: the project's anon/public key (legacy anon JWT or publishable key).
- `SUPABASE_SERVICE_ROLE_KEY`: the legacy `service_role` JWT key from the same preview project.
  This is a secret. Never put it in browser code, GitHub, screenshots, or chat messages.

Do not set these for Production or any other branch. Redeploy the preview after adding them.

## Supabase Auth settings

Before testing nickname registration, enable Anonymous Sign-Ins only in the dedicated
preview project: Authentication → Sign In / Providers → Anonymous Sign-Ins.

Supabase anonymous users cannot recover the same account after signing out, clearing
browser data, or switching devices. The nickname is not a password or a way to log back in.
The initial browser session must be retained securely by the chat page.

Supabase recommends CAPTCHA / Turnstile to reduce anonymous-account abuse. Configure
CAPTCHA before opening registration to the public. Supabase also applies its own
anonymous-sign-in rate limit.

## Current API actions

All requests are POST to `/api/chat` with a JSON body:

- `register`: creates an anonymous account and joins #sanza.
- `refresh`: refreshes a session using `refresh_token`.
- `list`: returns the latest 50 messages for active members.
- `send`: validates and posts a message.
- `report`: reports a message.
- `admin_reports`: admin-only report list.
- `hide_message`: admin-only message moderation (replaces content with a removal notice).
- `suspend_member`: admin-only room suspension.

The existing `chat.html` is still a local-only prototype until the frontend is connected
to this API and tested. Do not present it as a live chat service yet.
