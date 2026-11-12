// Static release gates for the SanZa AI preview. Run with node --test.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const api=readFileSync(new URL("../api/sanza-ai.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("./index.html",import.meta.url),"utf8");
test("explicit preview and public switches, disabled by default",()=>{
 assert.match(api,/SANZA_AI_PRIVATE_TEST/);
 assert.match(api,/VERCEL_ENV === "preview"/);
 assert.match(api,/VERCEL_ENV === "production"/);
 assert.match(api,/SANZA_AI_PUBLIC_ENABLED === "enabled"/);
 assert.match(api,/if \(!privateEnabled && !publicEnabled\)/);
 assert.match(api,/publicQuota\(req\)/);
 assert.match(api,/GEMINI_API_KEY/);
 assert.match(api,/GROQ_API_KEY/);
});
test("API input limits and privacy headers",()=>{
 assert.match(api,/message\.length > 1000/);
 assert.match(api,/rawHistory\.length > 12/);
 assert.match(api,/declaredLength > 18000/);
 assert.match(api,/no-store/);
 assert.match(api,/Referrer-Policy/);
});
test("safe response and family instructions",()=>{
 assert.match(api,/safeReply\(reply\)/);
 assert.match(api,/CHILD-FRIENDLY SAFETY/);
 assert.match(api,/dangerous pranks/);
});
test("mic toggle and transparency",()=>{
 assert.match(ui,/aria-pressed="false"/);
 assert.match(ui,/recognition\.stop\(\)/);
 assert.match(ui,/beep\(true\)/);
 assert.match(ui,/beep\(false\)/);
 assert.match(ui,/Privacy, age &amp; safety information/);
 assert.match(ui,/Under 16\? SanZa AI is not available yet/);
 assert.match(ui,/id="age-16"/);
 assert.match(ui,/id="activate-ai"/);
});
