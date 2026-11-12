// SanZa AI regression and security checks. No external API calls or paid services.
// Run: node --test sanza-ai-prototype/security-regression.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const api = readFileSync(new URL("../api/sanza-ai.js", import.meta.url), "utf8");

test("public access fails closed without Redis", () => {
  assert.ok(api.includes("if (!url || !token"));
  assert.match(api, /return \{ allowed: false, reason: "Capacity protection is not configured\." \}/);
  assert.match(api, /if \(!quota\.allowed\)/);
});
test("atomic shared daily quota protects both per-IP and global limits", () => {
  assert.match(api, /\["EVAL", script, 2, perIp, global, 50, 1000\]/);
  assert.match(api, /a>=tonumber\(ARGV\[1\]\) or b>=tonumber\(ARGV\[2\]\)/);
  assert.match(api, /createHash\("sha256"\)/);
});
test("requests have explicit validation and bounded history", () => {
  for (const fragment of ["declaredLength > 18000", "message.length > 1000", "rawHistory.length > 12", "turn.content.length > 1500", "Origin denied.", "JSON required."]) {
    assert.ok(api.includes(fragment), "Missing safeguard: " + fragment);
  }
});
test("only production explicit opt-in enables public AI", () => {
  assert.match(api, /process\.env\.VERCEL_ENV === "production" && process\.env\.SANZA_AI_PUBLIC_ENABLED === "enabled"/);
  assert.match(api, /if \(!privateEnabled && !publicEnabled\)/);
});
test("provider ordering and failure codes restrict fallback", () => {
  const groq = api.indexOf('https://api.groq.com/openai/v1/chat/completions');
  const gemini = api.indexOf('https://generativelanguage.googleapis.com');
  const openrouter = api.indexOf('https://openrouter.ai/api/v1/chat/completions');
  assert.ok(groq >= 0 && gemini > groq && openrouter > gemini);
  assert.match(api, /fallbackAllowed = \[404, 408, 429, 500, 502, 503, 504\]/);
  assert.match(api, /tryOpenRouter = \[404, 408, 429, 500, 502, 503, 504\]/);
});
test("OpenRouter cannot silently select a paid model", () => {
  assert.match(api, /model === "openrouter\/free"/);
  assert.match(api, /:free\$/);
  assert.match(api, /Free backup model not configured/);
});
test("sensitive credentials remain server-side", () => {
  for (const key of ["GROQ_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY", "SANZA_AI_REDIS_REST_TOKEN"]) {
    assert.match(api, new RegExp("process\\.env\\." + key));
  }
  assert.match(api, /Cache-Control", "no-store"/);
});
test("family safety and complaints have explicit instructions and output gate", () => {
  assert.match(api, /CHILD-FRIENDLY SAFETY IS HIGHER PRIORITY/);
  assert.match(api, /function safeReply\(reply\)/);
  assert.match(api, /When someone criticises SanZa Food Hub food or service/);
  assert.match(api, /do not invent contact details, refunds/);
});

// These are static regression gates, not simulated provider outages or live abuse tests.
