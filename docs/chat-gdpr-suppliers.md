# SanZa Chat — processor and international transfer register (draft)

**Controller:** Abbas Akbari trading as SanZa Food Hub. **Review date:** 10 November 2026. **Status:** preliminary inventory; supplier terms and account settings not independently verified. No declaration of GDPR compliance.

| Supplier | Service / data categories | Agreement and transfer verification required |
|---|---|---|
| Supabase | Authentication, chat database, user/session identifiers, messages, moderation and bans | Confirm current DPA acceptance, subprocessors, database region, backup/log retention, cross-border transfers and appropriate safeguards |
| Vercel | Web/API hosting, request metadata, runtime logs, environment secrets | Confirm DPA, subprocessors, deployment/function regions, log retention, transfer safeguards and access controls |
| Cloudflare Turnstile | Bot screening and technical request/device signals | Confirm relevant privacy terms, controller/processor roles, subprocessors, transfers, data retention and user notice |
| Resend | Safety/report notification delivery, report reference and recipient email | Confirm DPA, subprocessors, email delivery/log retention and international transfers; no chat message text in notifications |
| Brevo (if fallback active) | Alternative moderation email delivery | Confirm whether actually enabled, DPA, subprocessors, transfer safeguards and retention; remove from notice if unused |

## Before public launch
- [ ] Open each supplier account's current legal/privacy/DPA pages and save dated evidence of acceptance or applicable terms.
- [ ] Confirm Supabase region and Vercel processing/logging regions; record all transfers outside the EEA and the applicable legal transfer mechanism (e.g., adequacy or SCCs as appropriate).
- [ ] Review supplier subprocessor lists and notification arrangements; confirm technical/security measures.
- [ ] Check actual production/preview settings for Resend vs Brevo, Cloudflare Turnstile, cookies, analytics, advertising and log retention.
- [ ] Ensure privacy notice accurately reflects the verified processors, transfer information, user rights and retention.
- [ ] Complete controller legal disclosure, child-safety assessment and final legal review.

**Evidence status:** Not verified. A written register alone does not mean supplier agreements are executed or international transfers lawful.
