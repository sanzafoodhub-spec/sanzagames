# SanZa Chat owner-only push — preview implementation status

## Implemented
- `/sanza-chat-owner-push-sw.js`: receives authenticated-backend-sent push payloads, displays a generic message alert, and opens chat on tap.
- Suppresses push display when an existing chat page is visible in the same browser installation.
- Uses generic notification text (no public chat message content exposed on the lock screen).

## NOT YET ACTIVE — do not enable for users
- Owner-only registration UI after verified admin sign-in and MFA.
- Server-generated VAPID public/private keys (private key stored only in server environment).
- Authenticated owner-only subscribe/unsubscribe endpoints; store subscription data in access-controlled Supabase tables.
- Owner presence/heartbeat and idle timeout to avoid notifications while chatting on another device.
- Message-send event trigger to queue Web Push, delivery retries, invalid subscription cleanup, and per-message deduplication.
- Push subscription ownership verification (not just client-side labels).
- Android/Samsung browser install and permission test; background delivery and mute-while-active test.

## Privacy and cost
Use a no-cost Web Push implementation with VAPID and existing infrastructure only if the free tiers allow it. No third-party paid messaging. Never expose chat credentials, VAPID private key, or Supabase service-role key to the browser. Do not ask visitors for push permissions.

## Deployment policy
Preview-only until end-to-end verified. The service worker is inert unless explicitly registered and sent a valid push event by a future authenticated backend. Do not publish as a working notification feature.
