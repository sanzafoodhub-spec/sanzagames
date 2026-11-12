# Optional OpenRouter third provider

The code supports OpenRouter after Groq and Gemini for eligible outage, rate-limit or model-unavailable responses. Safety-blocked or empty responses do not trigger provider shopping.

To activate:
1. Create an OpenRouter account and check its current free-model limits, provider terms, privacy terms and billing controls.
2. Select an actually available OpenRouter model with an identifier ending in `:free`; availability changes. Do not assume any specific model is still free.
3. Set `OPENROUTER_API_KEY` and `OPENROUTER_FREE_MODEL` as **server-only** environment variables in the private test Vercel project, scoped to preview. Do not paste secrets into chat or GitHub.
4. Verify that Groq and Gemini fail over to OpenRouter in controlled testing, then test safety, quotas and privacy disclosures.
5. Public release still requires a connected shared Redis rate limiter, production-only configuration, and separate approval. Never enable paid routing or automatic top-ups.

Adding providers does not increase the shared 20-per-IP/hour and 300-global/hour ceilings automatically, nor guarantee more free usage.
