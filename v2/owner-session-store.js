// Server-only durable session repository for isolated SanZa Chat V2 staging.
// Requires CHAT_V2_SUPABASE_URL and CHAT_V2_SUPABASE_SERVICE_ROLE_KEY.
// Database schema: docs/sanza-chat-v2-staging-owner-sessions.sql
"use strict";
const { hashToken, validateSessionRecord } = require("./owner-session");
const TABLE = "chat_v2_owner_sessions";

function config() {
  const base = process.env.CHAT_V2_SUPABASE_URL;
  const key = process.env.CHAT_V2_SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !/^https:\/\/[^/]+\.supabase\.co\/?$/.test(base) || !key) {
    throw new Error("V2 staging session store is not configured");
  }
  return { base: base.replace(/\/$/, ""), key };
}
async function request(method, query, body) {
  const { base, key } = config();
  const response = await fetch(base + "/rest/v1/" + TABLE + query, {
    method,
    headers: { apikey: key, ...(key.startsWith("sb_secret_") ? {} : { Authorization: "Bearer " + key }),
      "Content-Type": "application/json", Accept: "application/json",
      Prefer: method === "POST" ? "return=minimal" : "return=representation" },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new Error("V2 session store unavailable");
  if (method === "GET") return response.json();
}
async function saveSession(record) {
  await request("POST", "", record);
}
async function findSession(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const rows = await request("GET",
    "?select=token_hash,owner_user_id,created_at,expires_at,revoked_at&token_hash=eq." +
    encodeURIComponent(hashToken(token)) + "&limit=1");
  const record = Array.isArray(rows) && rows.length === 1 ? rows[0] : null;
  if (!record || record.revoked_at || !validateSessionRecord(token, record)) return null;
  return record;
}
async function revokeSession(token) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  await request("PATCH", "?token_hash=eq." + encodeURIComponent(hashToken(token)) +
    "&revoked_at=is.null", { revoked_at: new Date().toISOString() });
}
module.exports = { saveSession, findSession, revokeSession };
