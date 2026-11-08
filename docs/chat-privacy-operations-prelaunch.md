# SanZa Chat — operator and GDPR operating procedure (PRE-LAUNCH DRAFT)

Status: NOT APPROVED FOR PUBLIC LAUNCH. This document is an implementation checklist, not legal certification.

## Controller and public contact
- Individual sole trader trading as **SanZa Food Hub**. Confirm the exact legal name with the owner before publication.
- Contact email: **sanzafoodhub@gmail.com**.
- No personal/home address is approved for publication. Irish e-commerce rules generally require an accessible geographic establishment address. Obtain a lawful business establishment address or qualified Irish legal advice; do not invent or substitute an unverified PO box as the establishment address.
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
- Confirm legal identity and geographic address disclosure lawfully without publishing home details without consent.
- Verify suppliers, processing locations, transfer safeguards, lawful bases, actual retention controls and rights-handling.
- Review accurate public-facing privacy/rules pages, 16+ protections and moderator staffing.
- Test production configuration and rollback; no production merge before approval.
