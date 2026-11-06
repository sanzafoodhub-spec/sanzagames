// SanZa Chat V2 isolated owner session check. No owner data returned.
"use strict";
const { COOKIE_NAME, parseCookies } = require("../v2/owner-session");
const { findSession } = require("../v2/owner-session-store");
const { readRole, ROLES } = require("../v2/role-permissions");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return res.status(401).json({ authenticated: false });
  try {
    const session = await findSession(token);
    if (!session) return res.status(401).json({ authenticated: false });
    const role = await readRole({
      supabaseUrl: process.env.CHAT_V2_SUPABASE_URL,
      serviceRoleKey: process.env.CHAT_V2_SUPABASE_SERVICE_ROLE_KEY,
      userId: session.owner_user_id
    });
    if (role !== ROLES.OWNER) return res.status(401).json({ authenticated: false });
    return res.status(200).json({ authenticated: true, role: "owner" });
  } catch (_) {
    return res.status(503).json({ error: "Session verification unavailable." });
  }
};
