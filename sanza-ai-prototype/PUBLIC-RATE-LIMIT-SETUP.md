# SanZa AI shared public quota setup (not yet active)

The public API now requires a shared Redis-compatible REST endpoint supporting atomic EVAL.
It fails closed until configured; private preview still works independently.

1. Create a free Redis database with a compatible REST API (e.g. Upstash) after checking its current free limits, terms and billing settings. Never enable a paid plan or add payment details for this project without explicit approval.
2. In the intended **public** Vercel project, set server-only environment variables:
   - `SANZA_AI_REDIS_REST_URL`: Redis REST endpoint (HTTPS)
   - `SANZA_AI_REDIS_REST_TOKEN`: secret REST token
   - `SANZA_AI_PUBLIC_ENABLED`: `enabled` (only after testing)
   - `GROQ_API_KEY` and/or `GEMINI_API_KEY`: server-only provider keys
3. Test requests from separate devices and concurrent requests, confirm HTTP 429 after 8 requests per IP/hour and after 150 total/hour, and confirm HTTP 503 when Redis configuration is missing.
4. Keep provider free-tier spending disabled, and monitor provider quotas. The global 150/hour cap is a **ceiling**, not a guarantee of remaining within provider free limits. Reduce it if provider quotas are smaller.
5. Never publish the private test deployment or remove its Vercel Authentication as a shortcut. Confirm GDPR/provider policies and safety testing before public release.

Limits are fixed per UTC hour; IPs are hashed before use as Redis keys. Shared networks may hit the per-IP limit together. Do not use this as proof of age or identity.
