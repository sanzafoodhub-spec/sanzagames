# SanZa Chat — minimum launch gate (preview only)

Status: **NOT CLEARED FOR PUBLIC LAUNCH**. Do not merge this branch into main until the open gates are resolved.

## 1. Security
- [x] Server-side authentication and admin checks exist in `api/chat.js`.
- [x] Chat filtering, link/contact blocking and message rate checks exist.
- [x] Supabase RLS and restricted legal-hold/retention RPC permissions previously checked.
- [ ] Independently test unauthenticated requests, non-admin attempts, banned-account access, filter bypasses and report-spam against deployed preview.
- [ ] Verify service-role credentials never reach browser, and preview origin restrictions match the final production domain before release.

## 2. Moderation
- [x] Admin reports, resolve, hide, suspend, 48-hour ban and legal hold controls implemented.
- [x] Legal-hold audit placed/released successfully in user testing.
- [ ] Test end-to-end reporting from a normal, non-admin user; verify moderators receive and act on it, including urgent escalation.
- [ ] Confirm who actually monitors reports and how quickly; provide a visible safety contact.

## 3. Age safety
- [x] Registration requires self-declaration of age 16+; under-16 age groups blocked.
- [x] Updated misleading under-13 error to say 16+.
- [ ] Self-declaration is NOT age verification. Confirm audience, safety approach, age policy and applicable Irish/EU child-protection obligations before public release.
- [ ] Test bypasses and appropriate safeguarding escalation.

## 4. Legal/privacy basics
- [x] Draft privacy notice and support email exist.
- [ ] Confirm and publish the operator's **real legal name** and valid postal contact information where required.
- [ ] Finalise GDPR legal basis, supplier/data transfer details, retention (automated cleanup OFF), access/erasure handling, and security logs.
- [ ] Have public-facing privacy notice, rules and reporting contact reviewed for accuracy; remove draft/private-beta language only when ready.

## 5. Mobile and production safety
- [x] Chat page is responsive by design and marked noindex in private preview.
- [ ] Test real Android and iPhone sign-up, CAPTCHA, posting, reporting, blocking, session expiry, ban and reconnection.
- [ ] Confirm deployment health and environment variables on production configuration.
- [ ] Stage launch/rollback plan. Preserve existing live site, games and analytics.

## Can wait until after public launch
Automated retention cleanup, extra admin dashboards, visual polish and new chat features. Keep cleanup OFF until concurrency and recovery tests pass.

**Do not claim public-launch readiness on the basis of code inspection alone.**


## 8 November 2026 launch audit — actions and evidence
- Owner confirmed successful TOTP sign-in and denial of admin access without the code. This is a user-observed preview test, not an independent penetration test.
- Preview Vercel deployment `dpl_BAZ4scZbb5HKHpvudAvVbnes5BhP` was READY; production release has **not** been performed.
- Code inspection confirms server-side admin gate for owner UID requires an `aal2` JWT for moderator operations. Existing Curry admin is a separate account and has not been migrated to MFA.
- Registration still requires Cloudflare Turnstile. User reported client error `110200`; the Turnstile widget's allowed-hostname settings and deployed hostname need checking in Cloudflare dashboard. Do **not** bypass CAPTCHA.
- Read-only HTTP smoke tests attempted from isolated runtime but network resolution was unavailable; therefore unauthenticated, non-admin, banned-user, report-spam and production endpoint tests are **not passed**.
- Privacy notice remains explicitly DRAFT. Registered trading name is not sufficient to infer the legal operator's identity or postal contact. Obtain those details directly from owner; verify retention process and age/child-safety assessment.
- **HOLD** public deployment until normal-user report/ban tests, Turnstile fix, legal notice, privacy/retention process, and production origin/rollback verification are completed.
- Production launch must use a separate reviewed release, confirm production domain origin/Turnstile allowlist, and retain ability to roll back to prior production commit. Do not merge preview automatically.

## Sole trader / contact decision (8 November 2026)
- Operator confirmed sole trader trading as SanZa Food Hub. Public email contact: sanzafoodhub@gmail.com.
- Operator does not consent to publication of a personal/home address; do not insert or infer one.
- Irish e-commerce information requirements may require geographic establishment address and full operator identity. Seek a lawful business-address arrangement or qualified advice before public release; email-only must not be marked compliant.
- Continue preview testing without deploying to production.
