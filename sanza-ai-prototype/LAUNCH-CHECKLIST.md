# SanZa AI release status (12 November 2026)

**PRIVATE PREVIEW ONLY — NOT READY FOR PUBLIC OR CHILD ACCESS.**

## Verified by source inspection
- Isolated Vercel project with SSO protection enabled for all deployments.
- API refuses non-preview environments and is disabled without SANZA_AI_PRIVATE_TEST=enabled.
- No API keys in browser source; request length and history bounded.
- No-store and defensive HTTP response headers.
- Mic tap toggle with on/off audio cues, text-only answers, browser-provider disclosure.
- Family-oriented AI instructions, provider safety settings and conservative output screening.
- Node static checks: `node --test sanza-ai-prototype/safety.test.mjs`.

## Still required
1. **Persistent** per-IP/user rate limits and provider quota budget protection. No durable shared store is configured; cannot safely claim protection from abuse or unexpected provider charges.
2. Live model red-team testing, real browser/Android microphone testing and reportable evidence. Static checks are not behavioural safety certification.
3. Child access and age/parental consent policy reviewed for Ireland/EU; child-specific risk assessment and age assurance.
4. GDPR controller contact details, lawful basis, processors, retention, rights, transfer disclosures, privacy impact screening, and published report mechanism.
5. Verify current provider terms for 13+ users and commercial operation, Vercel hosting terms and zero-cost billing controls.
6. Incident response, reporting workflow, accessibility testing, ongoing monitoring and explicit owner approval.

**Do not merge to main or publish.** Keep Vercel Authentication enabled; do not expose API publicly.
