// SanZa Chat V2 owner logout. Isolated from original chat.
// Requires staging session schema and credentials; fails closed otherwise.
"use strict";
const { COOKIE_NAME, clearSessionCookie, parseCookies } = require("../v2/owner-session");
const { revokeSession } = require("../v2/owner-session-store");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const host = req.headers.host;
  if (!host || req.headers.origin !== "https://" + host ||
      !String(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
    return res.status(403).json({ error: "Request not allowed." });
  }
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) {
    res.setHeader("Set-Cookie", clearSessionCookie());
    return res.status(200).json({ ok: true });
  }
  try {
    // Do not clear the browser cookie until revocation is durable.
    await revokeSession(token);
  } catch (_) {
    return res.status(503).json({ error: "Logout temporarily unavailable. Please retry." });
  }
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true });
};
