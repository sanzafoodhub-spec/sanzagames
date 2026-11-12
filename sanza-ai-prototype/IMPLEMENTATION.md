# SanZa AI Stage 1 — private implementation

- UI: `sanza-ai-prototype/index.html` (static preview).
- API: `api/sanza-ai.js` (Vercel serverless route).
- Public launch: **NOT APPROVED**. Do not merge to main or deploy to production.
- The API is **disabled by default**, even on preview. It requires BOTH `SANZA_AI_PRIVATE_TEST=enabled` and a long `SANZA_AI_TEST_TOKEN` server secret. Do not put that token in browser source, HTML, or GitHub.
- `GEMINI_API_KEY` is server-only and was configured on Vercel Preview by the owner.
- This is a private backend proof of concept, not a publicly usable chatbot. The static UI deliberately does not send requests until a secure authentication flow and moderation are implemented.
- Model: Gemini 2.5 Flash; verify availability and free-tier eligibility before testing. HTTP 429 fails closed; no paid fallback configured.
- No rate limiting, user authentication, age assurance, parental controls, reporting, privacy impact assessment, or comprehensive content moderation yet. Provider safety settings and a system prompt alone are insufficient.
- Before testing: confirm preview deployment cannot affect the production domain, add deployment protection, verify provider billing is disabled, and add a real rate limiter / quota cap.
- Before public 13+ access: age-appropriate design, legal/privacy review, parental authorisation as applicable, abuse protections, content moderation, audit and testing.
