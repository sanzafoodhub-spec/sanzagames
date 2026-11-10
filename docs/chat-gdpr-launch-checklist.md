# SanZa Chat GDPR launch gate — preview only

Status: **NOT APPROVED FOR PUBLIC LAUNCH**. This is an operational checklist, not legal certification.

## Verified in this review
- Existing preview privacy, terms and safety pages reviewed; privacy notice expanded to explain automated moderation, required information and named providers.
- The private-beta pages remain noindex and explicitly labelled draft.
- Age gate is self-declaration only; 16–17-year-olds remain children and need appropriate safeguards.
- Emergency pause database RPC was transaction-tested by the operator with manual_pause=false and auto_pause_works=true; this does not test the full reporting path.

## Required before launch
- [ ] Confirm controller's legally required identity, trading-name registration and appropriate contact disclosures with Irish legal advice. Do not publicly disclose personal details without checking obligations.
- [ ] Record the Article 6 lawful basis separately for providing chat, abuse prevention, moderation, report handling, and service communications; document legitimate-interest balancing where used.
- [ ] Audit actual Supabase tables, auth records, device fingerprints/hashes, IP-derived identifiers, Vercel logs, Turnstile and email providers. Create data inventory and retention schedule for **each** category.
- [ ] Verify scheduled deletion jobs execute and cover ordinary messages (proposed 30 days), resolved reports (proposed 90 days), linked messages, registration limits, bans, security identifiers, backups and logs; confirm legal holds and exception handling. Do not promise deletion before this is proven.
- [ ] Verify provider DPAs, subprocessors, hosting regions, international transfer mechanisms and necessary transfer assessments for Supabase, Vercel, Cloudflare and Resend/Brevo.
- [ ] Verify cookies, browser storage, analytics and advertising scripts; implement consent where required before enabling optional tracking.
- [ ] Establish a tested process for access, erasure, rectification, objection, appeals and response deadlines, including identity verification without oversharing.
- [ ] Complete child-safety risk assessment for 16–17-year-olds, underage-report escalation, human moderation coverage and emergency handling; assess applicability of the EU Digital Services Act.
- [ ] Document breach response, access controls, audit logs, recovery procedures and whether a DPIA is needed.
- [ ] Have Irish-qualified legal/privacy adviser review final notices, controller disclosures and lawful bases; remove draft/noindex only after approval.

Official guidance: https://www.dataprotection.ie/en/individuals/know-your-rights/right-be-informed-transparency-article-13-14-gdpr
