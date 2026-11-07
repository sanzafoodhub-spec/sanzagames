# SanZa Chat — Pre-publication legal and safeguarding register
Status: NOT APPROVED FOR PUBLIC LAUNCH. Updated 2026-11-07.
Contact designated by owner: Sanzafoodhub@gmail.com.
Scope: public nickname-based text chat, mixed adults and minors, Ireland with possible international users.
This is an operational checklist, not legal advice or certification.

## Immediate release blockers
- [ ] Confirm actual legal entity/operator, postal contact, jurisdiction, controller and DSA authority contact.
- [ ] Map all data: Supabase Auth and chat tables, Vercel request logs, CAPTCHA, client storage, IP hash, abuse logs; record data processors and locations.
- [ ] Document Article 6 GDPR lawful basis for each purpose; evaluate Article 9 special-category information and child data risks.
- [ ] Complete and sign off a child-specific DPIA and risk register (adult-child contact, grooming, bullying, hate, sexual exploitation, self-harm, impersonation, doxxing, ban evasion).
- [ ] Choose age-assurance strategy that actually works; self-declared 16+ selection is insufficient to reliably exclude younger users.
- [ ] 13–15 access remains disabled until assessed parental permission/verification and suitable child safety measures are implemented.
- [ ] Implement retention periods and scheduled deletion for messages, reports, bans, technical logs, inactive profiles; verify backups and processor retention.
- [ ] Implement access, deletion, objection, correction and portability workflows; establish response ownership and timelines.
- [ ] Confirm processor agreements, subprocessor list, data-transfer mechanism, technical security, incident response and GDPR breach assessment/reporting.
- [ ] Implement functional illegal-content notices: receipt, categorisation, prompt review, outcomes, rationale, appeal and audit logs as applicable to service classification.
- [ ] Establish qualified human moderation coverage, escalation rota, emergency handling and Garda reporting for threats to life/safety where required.
- [ ] Review and test filters for false positives, hate, grooming, self-harm support, coded slurs, personal details and links.
- [ ] Test nickname creation, CAPTCHA, authentication, rate limiting, RLS, blocked users, 48-hour bans, re-registration, reports, appeals, data deletion, cross-device realtime and abuse under load.
- [ ] Confirm whether service qualifies as DSA hosting/online platform and whether micro/small-enterprise exemptions apply; implement applicable contact, terms, notices, transparency and appeal duties.
- [ ] No behavioural/profiling ads to known minors; verify analytics, cookie/consent and advertising arrangements before launch.
- [ ] Have qualified Irish privacy/platform solicitor review public terms, policies, risk assessment and actual implementation.
- [ ] Owner signoff after test evidence; publish from preview to live only after explicit approval.

## Current state
Preview age selector: under 13 rejected; 13–15 blocked; 16+ self-declared. Legacy sessions without age declaration blocked. This is NOT age verification.
Preview has draft /chat-privacy.html, /chat-terms.html, /chat-safety.html. These deliberately identify unresolved compliance matters.
Automatic and moderator bans have been coded but not end-to-end tested.
Live website must remain unchanged until launch gates pass.

## Operating response procedure (draft)
1. Review reports regularly; never claim 24/7 human coverage unless staffed.
2. For credible immediate threats to life/safety, escalate urgently to emergency services/law enforcement under an approved procedure; preserve minimum necessary evidence securely.
3. For child sexual exploitation/grooming indications, restrict exposure immediately, escalate to trained safeguarding lead and authorities as legally appropriate; do not attempt amateur investigation.
4. Record action, reasons, timing and reviewer in a secure moderation audit trail.
5. Notify reporter and affected user with legally required reasons and appeal route, avoiding disclosure that endangers children or investigations.
6. Review appeal independently where practicable; document outcome.
7. Periodically review false positives, retention, incident patterns and training.

References: dataprotection.ie Children's Fundamentals; cnam.ie DSA obligations.