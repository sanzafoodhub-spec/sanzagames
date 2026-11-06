# SanZa Chat 2.0 — Secure Roles Design (planning only)

Status: DRAFT. This document does not deploy code or modify Supabase.

## Goals
- One owner; owner may appoint and revoke moderators.
- Public nickname-only chat remains available to ordinary members through Supabase anonymous auth.
- Never authorize by nickname, client-provided role, or a browser-only flag.
- No DMs, file uploads, public launch, or changes to the working beta.
- All moderation operations must be server-enforced, auditable, and rate-limited.

## Roles and permissions
| Action | Member | Moderator | Owner |
|---|---|---|---|
| Read/post permitted chat, report | Yes | Yes | Yes |
| Remove inappropriate messages | No | Yes | Yes |
| Temporary mute / temporary ban | No | Yes | Yes |
| Permanent ban | No | No | Yes |
| Pin/unpin announcements | No | Yes | Yes |
| Review reports | No | Yes | Yes |
| Appoint/revoke moderator | No | No | Yes |
| Security settings / audit access | No | No | Yes |

## Identity and privilege
- The existing `chat_admins` lookup currently answers a boolean. Replace it with a server-side permission check after inspecting the actual table schema and policies.
- The owner must be bound to a durable, verified Supabase user ID; do not use an anonymous nickname as proof of ownership. The owner authentication method must be agreed before provisioning. Ordinary users retain anonymous sign-in.
- Moderator appointments must refer to a specific verified user ID and require an authenticated owner action. Do not allow arbitrary user-submitted IDs to grant roles.
- Owner role cannot be changed through ordinary chat or moderator endpoints. Protect the last owner from deletion or demotion.
- Enforce authorization in server API and restrictive Supabase RLS; service-role credentials stay server-side only.
- Avoid exposing private identifiers or moderation records in public chat responses.

## Moderation data design (pending schema review)
- Roles: user_id, role (owner/moderator), granted_by, granted_at, revoked_at.
- Sanctions: target_user_id, action, reason, actor_user_id, created_at, expires_at, revoked_at; temporary sanctions must expire automatically in server checks.
- Audit log: actor_user_id, action, target_user_id, timestamp, reason, outcome. Append-only; only owner sees full log.
- Reports: retain existing reports table; define status/assignment after inspecting existing columns.
- Prevent evasion where feasible through server rate limits; anonymous accounts are disposable, so bans by user ID alone are insufficient for robust public moderation. Avoid invasive device fingerprinting.

## Safe implementation sequence
1. Read current `chat_admins`, `chat_members`, `chat_messages`, `chat_reports` schemas, grants, and RLS policies. Do not run migrations blindly.
2. Choose secure owner authentication and bind owner account ID via privileged provisioning.
3. Draft additive, reversible migrations and role-check API changes; review before executing SQL.
4. Build moderation endpoints with explicit authorization and audit trails on `sanza-chat-v2-development` only.
5. Add UI behind owner/moderator checks; never trust UI to enforce permissions.
6. Test as owner, moderator, ordinary member, blocked member, and unauthenticated visitor; include attempted privilege escalation.
7. Only then plan remaining five feature groups and deploy to a separate V2 preview after explicit approval.

## Rollout and privacy
- Keep existing `sanza-chat-preview` branch, its Vercel alias, and `main` untouched.
- No database migrations, deployment, or live-site edits during this planning stage.
- Before expanding beyond trusted testers, review Irish/EU GDPR, children's safety, retention, privacy notice, and moderation procedures.
