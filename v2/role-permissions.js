// SanZa Chat 2.0 — role authorization helper (NOT WIRED INTO LIVE API).
// Development-only module. Requires server-only Supabase service-role key.
// No owner UID, password or email is hardcoded in source.

const ROLES = Object.freeze({ OWNER: "owner", MODERATOR: "moderator", MEMBER: "member" });
const ACTIONS = Object.freeze({
  VIEW_REPORTS: "view_reports",
  HIDE_MESSAGE: "hide_message",
  TEMP_MUTE: "temporary_mute",
  TEMP_BAN: "temporary_ban",
  PERMANENT_BAN: "permanent_ban",
  MANAGE_MODERATORS: "manage_moderators",
  MANAGE_SECURITY: "manage_security",
  VIEW_FULL_AUDIT: "view_full_audit",
  PIN_ANNOUNCEMENT: "pin_announcement"
});
const permissions = Object.freeze({
  [ROLES.OWNER]: new Set(Object.values(ACTIONS)),
  [ROLES.MODERATOR]: new Set([
    ACTIONS.VIEW_REPORTS, ACTIONS.HIDE_MESSAGE,
    ACTIONS.TEMP_MUTE, ACTIONS.TEMP_BAN, ACTIONS.PIN_ANNOUNCEMENT
  ]),
  [ROLES.MEMBER]: new Set()
});

function can(role, action) {
  return Boolean(permissions[role] && permissions[role].has(action));
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// Fetch role from the staging roles table (user_id, role, granted_at).
// Revocation in the current staging schema means deleting the moderator row.
// Fail closed on lookup errors.
// Do not accept a role supplied by the browser.
async function readRole({ supabaseUrl, serviceRoleKey, userId, fetchImpl = fetch }) {
  if (!isUuid(userId) || !supabaseUrl || !serviceRoleKey) return ROLES.MEMBER;
  const endpoint = supabaseUrl.replace(/\/$/, "") +
    "/rest/v1/chat_v2_roles?select=role&user_id=eq." +
    encodeURIComponent(userId) + "&limit=1";
  try {
    const response = await fetchImpl(endpoint, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: "Bearer " + serviceRoleKey,
        Accept: "application/json"
      }
    });
    if (!response.ok) return ROLES.MEMBER;
    const rows = await response.json();
    const role = Array.isArray(rows) && rows.length === 1 ? rows[0].role : null;
    return role === ROLES.OWNER || role === ROLES.MODERATOR ? role : ROLES.MEMBER;
  } catch (_) {
    return ROLES.MEMBER;
  }
}

// Before wiring into any endpoint:
// - Verify Supabase JWT with /auth/v1/user (not just client claims).
// - Authenticate Owner via email/password Supabase Auth; never store passwords here.
// - Implement rate limiting, CSRF/origin checks, append-only audit, target-role
//   protections and atomic role updates; require fresh auth for sensitive actions.
// - Keep the old chat_admins path unchanged until separate V2 preview testing.
module.exports = { ROLES, ACTIONS, can, isUuid, readRole };
