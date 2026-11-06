# SanZa Chat 2.0 — Isolated staging setup

Status: PREPARATION ONLY. No database created, no credentials configured, no deployment made.

## Separation rules
- Production `main`, existing `sanza-chat-preview` branch and its stable URL stay unchanged.
- Existing Supabase project and existing `chat_admins` rows stay unchanged.
- Create a **new free Supabase project** for V2 staging only if the account's free-project quota allows it. If quota is exhausted, stop and ask before using any shared database.
- Use a separate Vercel preview project or an explicitly branch-scoped preview environment, never production env vars.
- Keep Turnstile enabled. Register the actual V2 preview hostname with Cloudflare before browser testing; never disable CAPTCHA to bypass hostname errors.

## Setup sequence (no secrets in GitHub)
1. In Supabase Dashboard create a new staging project, e.g. `sanza-chat-v2-staging`. Note its project URL and anon/publishable key; do NOT paste service-role or secret keys into chat.
2. Confirm the new project's Auth email/password provider is enabled. Use a separate staging Owner test account; do not copy the real Owner's password.
3. Review and apply the base chat schema and policies in staging before V2 migrations. Current beta tables are not automatically copied to a new project. Avoid copying live messages, users or secrets.
4. Review `docs/sanza-chat-v2-roles-migration-DRAFT.sql` and `docs/sanza-chat-v2-owner-sessions-DRAFT.sql` for staging; do not run without explicit approval.
5. In Vercel create a separate V2 preview environment with staging-only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` (sensitive values in encrypted server environment only). Do not copy production environment settings automatically.
6. Implement and review backend login/logout endpoints with durable session storage, strict Origin and CSRF checks, login rate limits, generic errors, audit logs, and owner-role checks on every privileged action.
7. Test role escalation attempts, bad credentials, logout, expiry, lost session, moderator privilege boundaries, and CAPTCHA on the exact preview hostname.
8. Only deploy a V2 staging preview with explicit user approval. Never connect it to the live SanZa site until the owner approves and legal/privacy checks are complete.

## Current implementation caveats
- `v2/owner-login.html` currently references a not-yet-implemented API endpoint.
- `v2/owner-auth-service.js` verifies credentials but intentionally does not establish a session.
- `v2/owner-session.js` supplies primitives, not a complete session backend.
- `v2/role-permissions.js` requires the V2 roles table; it is not wired to the existing chat API.
- The earlier role migration is a draft and must be inspected before use.
- The confirmed Owner account in the existing project is NOT provisioned in staging automatically.

## Go/no-go
Proceed only when the new staging project exists and its empty schema is confirmed. If a second free project is unavailable, stop rather than risking the existing chat.
