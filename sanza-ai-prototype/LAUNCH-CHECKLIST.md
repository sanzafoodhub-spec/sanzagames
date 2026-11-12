# SanZa AI public launch gate — 12 November 2026

**Status: NOT APPROVED FOR PUBLIC LAUNCH.** Private preview only. No production promotion or main-branch merge.

## Implemented in this preview
- Server-only Gemini/Groq API keys, origin/content-type checks, bounded inputs/history, no-store response header.
- Family-friendly system instructions, provider safety configuration, conservative output gate.
- Entertaining original games/riddles/jokes guidance and prompt-injection refusal.
- Microphone tap on/off, visual recording state and audible cues; text-only answers.
- Visible privacy, AI transparency, age and speech-processing disclosures.
- Preview-only backend guard; Vercel Authentication should remain enabled.

## Mandatory outstanding launch blockers
- **Durable** per-user/IP rate limiting, bot protection, quota caps and abuse reporting (serverless instance-local counters do not count).
- Independent adversarial safety testing with recorded results, including prompt injection, hate, sexual content, self-harm, child safety, bullying and harmful requests.
- Age-appropriate design review and workable age assurance/parental consent where legally required; 13+ label alone is insufficient.
- GDPR privacy notice with controller identity/contact, lawful basis, processor/subprocessor disclosures, retention, rights and transfer details; DPIA screening and child-specific risk assessment.
- Confirm Groq/Google model and speech-provider terms, child access and commercial-use eligibility; verify free API and Vercel hosting restrictions.
- Accessibility and mobile-browser speech testing, including permission denial, no-speech, interruption, mic start/stop, screen readers and keyboard access.
- Clear incident response, safety report channel, support process, monitoring and rollback plan.
- Owner acceptance of test evidence and explicit go-live authorization.

## Scope
Never change live sanzagames.ie, SanZa Chat, paid plans or billing during preview work. Do not claim the AI is perfectly safe.
