// SanZa Chat V2 — isolated role authorization tests.
// Run: node v2/role-permissions.test.js
// No network, database credentials, or changes to the working chat.
const assert = require("node:assert/strict");
const { ROLES, ACTIONS, can, readRole } = require("./role-permissions");

const ownerId = "c3de2327-4a69-400c-9f69-a28634a4f5bf";
const config = { supabaseUrl: "https://example.supabase.co", serviceRoleKey: "test-only-not-a-secret", userId: ownerId };

async function main() {
  assert.equal(can(ROLES.OWNER, ACTIONS.MANAGE_MODERATORS), true);
  assert.equal(can(ROLES.MODERATOR, ACTIONS.MANAGE_MODERATORS), false);
  assert.equal(can(ROLES.MODERATOR, ACTIONS.TEMP_BAN), true);
  assert.equal(can(ROLES.MODERATOR, ACTIONS.PERMANENT_BAN), false);
  assert.equal(can(ROLES.MEMBER, ACTIONS.VIEW_REPORTS), false);
  assert.equal(can("owner ", ACTIONS.MANAGE_SECURITY), false);

  let calledUrl;
  const owner = await readRole({ ...config, fetchImpl: async (url, options) => {
    calledUrl = url;
    assert.equal(options.headers.apikey, config.serviceRoleKey);
    return { ok: true, json: async () => [{ role: "owner" }] };
  } });
  assert.equal(owner, ROLES.OWNER);
  assert.ok(calledUrl.includes("chat_v2_roles?select=role&user_id=eq."));
  assert.ok(!calledUrl.includes("revoked_at"), "Staging schema has no revoked_at column");

  const moderator = await readRole({ ...config, fetchImpl: async () => ({ ok: true, json: async () => [{ role: "moderator" }] }) });
  assert.equal(moderator, ROLES.MODERATOR);
  const unknown = await readRole({ ...config, fetchImpl: async () => ({ ok: true, json: async () => [{ role: "superadmin" }] }) });
  assert.equal(unknown, ROLES.MEMBER);
  const missing = await readRole({ ...config, fetchImpl: async () => ({ ok: true, json: async () => [] }) });
  assert.equal(missing, ROLES.MEMBER);
  const failure = await readRole({ ...config, fetchImpl: async () => { throw Error("network failure"); } });
  assert.equal(failure, ROLES.MEMBER);
  const unauthorized = await readRole({ ...config, fetchImpl: async () => ({ ok: false }) });
  assert.equal(unauthorized, ROLES.MEMBER);
  const invalid = await readRole({ ...config, userId: "not-a-uuid", fetchImpl: async () => { throw Error("should not be called"); } });
  assert.equal(invalid, ROLES.MEMBER);
  console.log("SanZa Chat V2: role authorization tests passed");
}
main().catch(err => { console.error(err); process.exitCode = 1; });
