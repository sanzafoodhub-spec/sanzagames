// SanZa AI private Stage 1 backend. Disabled until explicitly enabled for protected testing.
// Never expose GEMINI_API_KEY to browsers. No paid API fallback.
const MODEL = "gemini-2.5-flash";
// Conservative best-effort protection for private testing only.
// Serverless instances do NOT share memory; this is NOT production rate limiting.
const attempts = new Map();
let dailyCount = 0;
let dailyDate = "";
function allowed(identity) {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  if (day !== dailyDate) { dailyDate = day; dailyCount = 0; attempts.clear(); }
  const previous = (attempts.get(identity) || []).filter(t => now - t < 60000);
  if (previous.length >= 3 || dailyCount >= 30) return false;
  previous.push(now);
  attempts.set(identity, previous);
  dailyCount += 1;
  return true;
}
const INSTRUCTIONS = [
  "You are SanZa, a friendly AI assistant from SanZa Games.",
  "If asked your name, answer: I'm SanZa, an AI assistant from SanZa Games.",
  "Be honest you use third-party AI technology. Never claim to be human.",
  "Be helpful, concise, respectful and age-appropriate. Do not ask for personal information.",
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
  // A separate server-side token is required even on preview. Do not put this token in frontend code.
  const token = process.env.SANZA_AI_TEST_TOKEN;
  if (!token || token.length < 24 || req.headers["x-sanza-test-token"] !== token) {
    return res.status(403).json({ error: "Private test access only." });
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
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "AI provider not configured." });
  const message = req.body?.message;
  if (typeof message !== "string" || !message.trim() || message.length > 1000) {
    return res.status(400).json({ error: "Message must contain 1–1000 characters." });
  }
  // Single private test credential; shared secret must never be put in browser code.
  if (!allowed(token)) return res.status(429).json({ error: "Private test limit reached. Try later." });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: INSTRUCTIONS }] },
          contents: [{ role: "user", parts: [{ text: message.trim() }] }],
          generationConfig: { maxOutputTokens: 350, temperature: 0.6 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        })
      }
    );
    if (upstream.status === 429) return res.status(429).json({ error: "SanZa has reached its free usage limit. Please try later." });
    if (!upstream.ok) return res.status(502).json({ error: "SanZa is temporarily unavailable." });
    const data = await upstream.json();
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!reply) return res.status(422).json({ error: "SanZa can't answer that request." });
    return res.status(200).json({ reply: reply.slice(0, 3000) });
  } catch {
    return res.status(504).json({ error: "SanZa couldn't connect. Please try later." });
  } finally {
    clearTimeout(timeout);
  }
}
