// SanZa Chat 2.0 — server-only session primitives (not connected to a route).
// Requires Node.js crypto and a durable session store (not implemented here).
// Never use localStorage for owner sessions or place tokens in URLs.
"use strict";
const { randomBytes, createHash, timingSafeEqual } = require("node:crypto");

const SESSION_TTL_MS = 30 * 60 * 1000;
const COOKIE_NAME = "__Host-sanza_owner";
const CSRF_COOKIE_NAME = "__Host-sanza_csrf";

function newToken() {
  return randomBytes(32).toString("base64url");
}
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
function equalHashes(a, b) {
  if (!/^[0-9a-f]{64}$/.test(a || "") || !/^[0-9a-f]{64}$/.test(b || "")) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
function sessionCookie(token, maxAgeSeconds = 1800) {
  if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new Error("Invalid session token");
  }
  return COOKIE_NAME + "=" + token +
    "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + maxAgeSeconds;
}
function clearSessionCookie() {
  return COOKIE_NAME + "=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}
function parseCookies(header) {
  const result = Object.create(null);
  if (typeof header !== "string" || header.length > 8192) return result;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 1) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key === COOKIE_NAME && /^[A-Za-z0-9_-]{43}$/.test(value)) result[key] = value;
  }
  return result;
}
function issueSessionRecord(ownerUserId, now = Date.now()) {
  if (typeof ownerUserId !== "string") throw new Error("Owner ID required");
  const token = newToken();
  return {
    token,
    // Persist only the hash in a restricted server-side store.
    record: { token_hash: hashToken(token), owner_user_id: ownerUserId,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + SESSION_TTL_MS).toISOString() }
  };
}
function validateSessionRecord(token, record, now = Date.now()) {
  return typeof token === "string" && record &&
    equalHashes(hashToken(token), record.token_hash) &&
    typeof record.owner_user_id === "string" &&
    Number.isFinite(Date.parse(record.expires_at)) &&
    Date.parse(record.expires_at) > now;
}
module.exports = {
  COOKIE_NAME, CSRF_COOKIE_NAME, SESSION_TTL_MS,
  newToken, hashToken, equalHashes, sessionCookie, clearSessionCookie,
  parseCookies, issueSessionRecord, validateSessionRecord
};

// Integration requirements BEFORE enabling sign-in:
// 1. Use a durable server-side session store with hashed token, expiry and revocation.
// 2. Recheck current owner role on every privileged request; revoke on role change.
// 3. Protect state-changing routes with CSRF tokens AND strict Origin validation.
// 4. Limit login attempts per account and IP; add optional MFA and session rotation.
// 5. Set Cache-Control: no-store; no tokens in JSON responses or browser storage.
// 6. Use a dedicated V2 hostname and staging database; never share live beta roles.
// 7. Add logout, timeout, and secure recovery before launch.
