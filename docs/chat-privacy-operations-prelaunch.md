# SanZa Chat — operator and GDPR operating procedure (PRE-LAUNCH DRAFT)

Status: NOT APPROVED FOR PUBLIC LAUNCH. This document is an implementation checklist, not legal certification.

## Controller and public contact
- Individual sole trader trading as **SanZa Food Hub**. Confirm the exact legal name with the owner before publication.
- Contact email: **sanzafoodhub@gmail.com**.
- Operator-provided business correspondence address for public disclosure: **The Dance Factory, Century Business Park, Finglas, Dublin, D11 VP46, Ireland**. Verify it is an appropriate geographic establishment/contact address for the operator; do not publish any residential address.
- Verify business-name registration number, if applicable, and required website disclosures.

## Purpose and legal basis register — requires owner approval
- Nickname, account/session identifiers, public posts: operating requested chat; assess GDPR Article 6(1)(b) contract necessity or another appropriate basis and document the assessment.
- Abuse filtering, reports, bans, security IP/device hashes, audit logs: safety and fraud prevention; assess Article 6(1)(f) legitimate interests with balancing test, especially for 16–17-year-olds, or another lawful basis as appropriate.
- Any legally mandated evidence preservation: Article 6(1)(c) only where a specific obligation actually applies.
- Do not assert that consent or legitimate interests automatically covers all data; document purposes, minimisation, recipients and legal bases.

## Retention — do not claim automatic deletion
- Proposed ordinary messages: 30 days; resolved reports: 90 days after resolution; legal holds may extend retention when justified.
- Automatic cleanup is **OFF**. Until tested, implement a documented manual review/deletion procedure with evidence preservation, report references, relational constraints, and audit logs; record each deletion and exception. No guarantee of 30/90-day automatic deletion may be published.
- Determine schedules for inactive accounts, sessions, bans, IP/device hashes, audit logs and hosting logs; verify Supabase/Vercel processor retention and international transfers before approval.

## Rights request procedure
1. Receive requests at sanzafoodhub@gmail.com; acknowledge and log receipt date, request type and deadline securely.
2. Verify requester proportionately without collecting unnecessary identity documents; never expose other members' private data.
3. Locate account, nickname, messages, reports and security records; assess access, rectification, erasure, restriction, objection or portability, and any lawful exemptions/holds.
4. Respond normally within one month under GDPR, or explain any lawful extension; document action and outcome. Escalate complex cases for qualified advice.
5. Report harmful content can be handled through chat report controls or the email. Set a realistic human moderation schedule before public launch.

## 16+ and child safety
- Under-16 participation remains blocked by self-declaration; do not call it verified age. Assess circumvention risks and proportionate safeguards.
- 16–17-year-olds are children and need enhanced privacy, clear notices, rapid abuse escalation and safe defaults.
- No direct messages or image uploads. Keep filtering, rate limits, reporting, bans and moderator access controls active.
- Determine whether a DPIA and further online-safety/DSA obligations apply; document outcome. Do not imply the age-16 rule alone resolves child-safety duties.

## Public release gates
- Confirm full legal identity and verify the supplied business address meets applicable geographic establishment disclosure requirements. Do not publish home details without consent.
- Verify suppliers, processing locations, transfer safeguards, lawful bases, actual retention controls and rights-handling.
- Review accurate public-facing privacy/rules pages, 16+ protections and moderator staffing.
- Test production configuration and rollback; no production merge before approval.

## Practical privacy inbox workflow (no SQL required to receive requests)
- In the SanZa Food Hub email inbox, label incoming messages **SanZa Chat / Privacy**; record receipt date, nickname, request category, response due date, verification state, outcome, and any lawful reason for retaining specific records in a restricted-access log.
- Acknowledge promptly using: "We received your SanZa Chat privacy request. Please do not send passwords or authentication codes. We may ask for limited information to verify the account before taking action. We normally respond within one month."
- Never promise that a request is completed until the underlying Supabase records and associated report/audit references have been reviewed. Do not delete moderation evidence under active legal hold.
- Where a request cannot be fulfilled safely with current tooling, log it and escalate to a qualified technical/privacy adviser; do not silently ignore it.
- Do not store requests or identity evidence in public GitHub issues or repositories.

## Verification status
- Privacy request instructions added to preview notice. This is documentation/UI only, **not** a working self-service deletion feature.
- Retention deletion remains OFF. Existing 30-day/90-day periods are proposals, not operating guarantees.
- Public launch still requires a functioning retention/rights-fulfilment process, documented legal bases, processor/transfer review, age-safety assessment, and required identity disclosures.
