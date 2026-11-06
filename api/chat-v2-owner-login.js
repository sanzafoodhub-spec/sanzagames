// SanZa Chat V2 staging-only owner login. Never import from the working chat API.
// This route authenticates but intentionally does not issue a session until
// a revocable server-side session store and CSRF protections are ready.
const { verifyOwnerCredentials } = require("../v2/owner-auth-service");
const RATE_WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map(); // best-effort per-instance throttle; not a production distributed rate limiter

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const expectedOrigin = "https://" + req.headers.host;
  if (!req.headers.origin || req.headers.origin !== expectedOrigin ||
      !String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    return res.status(403).json({ error: "Request not allowed." });
  }
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const entry = attempts.get(ip) || { count: 0, until: now + RATE_WINDOW_MS };
  if (entry.count >= 5) {
    res.setHeader("Retry-After", String(Math.ceil((entry.until - now) / 1000)));
    return res.status(429).json({ error: "Too many attempts. Try later." });
  }
  entry.count++;
  attempts.set(ip, entry);
  const { email, password } = req.body && typeof req.body === "object" ? req.body : {};
  if (typeof email !== "string" || typeof password !== "string" ||
      email.length > 254 || password.length > 1024) {
    return res.status(400).json({ error: "Invalid sign-in credentials." });
  }
  const result = await verifyOwnerCredentials({
    email, password,
    supabaseUrl: process.env.CHAT_V2_SUPABASE_URL,
    anonKey: process.env.CHAT_V2_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.CHAT_V2_SUPABASE_SERVICE_ROLE_KEY
  });
  if (!result.ok) return res.status(401).json({ error: "Invalid sign-in credentials." });
  // No cookie/token returned: authentication alone must not imply an active session.
  return res.status(503).json({ error: "Owner authentication verified, but secure sessions are not enabled yet." });
};
