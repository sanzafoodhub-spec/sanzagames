# SanZa AI — Stage 1 (private development only)

Status: DESIGN PROTOTYPE ONLY. No AI provider is connected. No live deployment authorised.

## Product
- User-facing name: SanZa. On request: "I'm SanZa, an AI assistant from SanZa Games." Disclose third-party AI providers in privacy and transparency notices.
- Text-only first. Voice, images and video are later phases.
- Budget ceiling: €0. Never enable paid APIs or automatic upgrades.
- Do not deploy to production or expose the prototype to children.

## Required before a working public release
1. Secure server-side Gemini or other permitted free-tier API integration; keys in protected environment variables, never frontend.
2. Provider usage quota and per-user/IP rate limits; reject requests safely when limits reached.
3. Input and output safety checks, crisis escalation responses, abuse reporting, anti-prompt-injection testing.
4. Age assurance, parental authorisation where required for 13–15, child-specific protections, and clear separation from SanZa Chat 16+.
5. Data minimisation, privacy notices, retention/deletion process, GDPR lawful basis and DPIA screening.
6. Review API provider terms for child-facing and commercial uses; hosting plan terms; EU AI Act and DSA applicability.
7. Test security and moderation, then get explicit owner approval before production deployment.

The HTML file is intentionally static and nonfunctional to avoid pretending safety or backend readiness.
