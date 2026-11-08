# SanZa Chat retention cleanup — PREVIEW DESIGN, NOT ACTIVE

**Status:** proposed implementation for review. Do not paste this document into SQL Editor.
**Scope:** `sanza-chat-preview` only. Never production. No cron job enabled.

## Policy

- Ordinary messages: eligible after 30 days, provided no report references them.
- Pending reports: never automatically deleted.
- Legal-hold reports: never automatically deleted.
- Resolved reports: eligible 90 days after `resolved_at`, only if `legal_hold=false`, and only after a documented final-review process confirms no continuing investigation, appeal, or legal need.
- Messages referenced by any report: retained until that report is lawfully disposed of; assess message evidence separately after report disposal.

## Blockers before installation

1. **Legal-hold management:** `legal_hold` exists but needs an admin-only way to set/unset it, reason, actor and timestamp, plus an audit trail. Default false is not enough to prove no hold is needed.
2. **Final disposition:** `status=resolved` is not a substitute for authorisation to destroy evidence. Add a reviewed `retention_release_at` or equivalent with audited approver; never automatically infer release from age alone.
3. **Audit trail:** record each run, eligible counts, deleted counts, failures, and evidence dispositions without exposing message content.
4. **Permissions:** database function must not be callable by `anon`, `authenticated`, or public; audit owner and schema search path; prefer a tightly scoped execution role.
5. **Foreign keys:** confirm referenced messages cannot be deleted before reports; check any other dependencies and deletion order.
6. **Testing:** run transaction-wrapped deletion tests against isolated fixtures, plus rollback and restore tests; verify pg_cron job monitoring.
7. **Privacy/legal:** confirm retention purposes, GDPR transparency, erasure handling, backups, log retention and legal review before enabling.

## Proposed deletion algorithm (design pseudocode, NOT SQL)

1. Acquire advisory lock so only one cleanup runs at a time.
2. Identify *approved-for-disposal* resolved reports older than 90 days, without legal hold and with an audited retention release; process bounded batches.
3. Write an immutable minimum-necessary audit entry; delete only approved reports in a transaction.
4. Identify messages older than 30 days that have **no** remaining report references and **no** separate legal/evidence hold.
5. Delete messages in bounded batches, record counts and errors.
6. Verify invariants; alert an operator on errors; retain audit records according to separately approved policy.
7. Only after a separate review, schedule a daily run via pg_cron on preview; monitor failures.

## Current verification

Read-only simulated fixture result: PASS, eligible report ID 14, eligible message IDs 1 and 4.
Real preview dry-run counts: 0 ordinary eligible messages, 0 resolved eligible reports, 5 pending reports, 4 messages referenced by pending reports.
No real deletion test completed and no scheduled cleanup job installed.
