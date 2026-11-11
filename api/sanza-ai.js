// SanZa AI private Stage 1 backend. Disabled until explicitly enabled for protected testing.
// Never expose GEMINI_API_KEY to browsers. No paid API fallback.
// Confirmed working model for this private preview. Avoid a models-list network call on every chat message.
const MODEL = "gemini-3.5-flash-lite";
// Private preview only: provider free-tier quotas apply. No artificial per-instance message caps.
const INSTRUCTIONS = [
  "You are SanZa, a friendly AI assistant from SanZa Games.",
  "If asked your name, answer: I'm SanZa, an AI assistant from SanZa Games.",
  "If asked whether you are ChatGPT or Gemini, say: I am SanZa from SanZa Games, powered by third-party AI. My primary provider is Groq, with Google Gemini as a backup when configured. I am not ChatGPT.",
  "Be transparent about the AI provider used when asked. Groq is primary and Google Gemini is an optional backup. Never claim to be human.",
  "Be helpful, concise, respectful and age-appropriate. For simple questions reply in one or two short sentences; give more detail when the user needs it. Do not ask for personal information.",
  "Do not provide sexual content involving minors, exploitation, harassment, self-harm instructions, or dangerous wrongdoing.",
  "For emergencies, encourage contacting emergency services or a trusted adult.",
  "Do not impersonate a doctor, lawyer, or other professional."
].join(" ");
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (process.env.SANZA_AI_PRIVATE_TEST !== "enabled") {
    return res.status(503).json({ error: "SanZa AI is not yet available." });
  }
  // Project-wide Vercel Authentication must remain enabled for ALL deployments.
  // This is a private preview proof of concept, not an authorization mechanism for public use.
  if (process.env.VERCEL_ENV !== "preview") {
    return res.status(403).json({ error: "Private preview only." });
  }
  // Do not accept cross-origin browser requests.
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin) {
    try { if (new URL(origin).host !== host) return res.status(403).json({ error: "Origin denied." }); }
    catch { return res.status(403).json({ error: "Origin denied." }); }
  }
  const contentType = req.headers["content-type"] || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return res.status(415).json({ error: "JSON required." });
  }
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (!geminiKey && !groqKey) return res.status(503).json({ error: "AI provider not configured." });
  const message = req.body?.message;
  if (typeof message !== "string" || !message.trim() || message.length > 1000) {
    return res.status(400).json({ error: "Message must contain 1–1000 characters." });
  }
  const prompt = message.trim();
  let fallbackAllowed = !groqKey;
  if (groqKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8500);
      let upstream;
      try {
        upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + groqKey },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [{ role: "system", content: INSTRUCTIONS }, { role: "user", content: prompt }],
            max_completion_tokens: 350,
            temperature: 0.6
          })
        });
      } finally { clearTimeout(timeout); }
      if (upstream.ok) {
        const data = await upstream.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) return res.status(200).json({ reply: reply.slice(0, 3000), provider: "groq" });
        return res.status(422).json({ error: "SanZa couldn't produce an answer." });
      }
      console.error("SanZa AI Groq request failed:", upstream.status);
      fallbackAllowed = [404, 408, 429, 500, 502, 503, 504].includes(upstream.status);
      if (!fallbackAllowed) return res.status(502).json({ error: "SanZa cannot answer that request right now." });
    } catch (error) {
      console.error("SanZa AI Groq connection failed:", error?.name || "network");
      fallbackAllowed = true;
    }
  }
  if (fallbackAllowed && geminiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      let upstream;
      try {
        upstream = await fetch("https://generativelanguage.googleapis.com/v1/models/" + MODEL + ":generateContent", {
          method: "POST", signal: controller.signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 220, temperature: 0.6 },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          })
        });
      } finally { clearTimeout(timeout); }
      if (upstream.ok) {
        const data = await upstream.json();
        const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
        if (reply) return res.status(200).json({ reply: reply.slice(0, 3000), provider: "gemini" });
        // No fallback on empty or filtered content: avoid bypassing provider safety decisions.
        return res.status(422).json({ error: "SanZa can't answer that request." });
      }
      console.error("SanZa AI Gemini request failed:", upstream.status);
      // Only retry provider outages, quotas, or model retirement; never bypass safety/policy errors.
      if (upstream.status === 429) return res.status(429).json({ error: "Both AI providers have reached their free limits. Try later." });
    } catch (error) {
      console.error("SanZa AI Gemini connection failed:", error?.name || "network");
      fallbackAllowed = true;
    }
  }
  return res.status(503).json({ error: groqKey ? "SanZa's AI providers are temporarily unavailable." : "Gemini is unavailable. Free backup is not connected yet." });
}
