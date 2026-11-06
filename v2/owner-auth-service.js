// SanZa Chat 2.0 owner authentication service — development only.
// Not an API route. Do not expose this module to browser bundles.
// Never log passwords, access tokens, refresh tokens, or service-role keys.
const { ROLES, readRole } = require("./role-permissions");

function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Password is verified by Supabase Auth, not by SanZa code.
// Owner authorization is checked separately using the protected V2 roles table.
async function verifyOwnerCredentials({ email, password, supabaseUrl, anonKey, serviceRoleKey, fetchImpl = fetch }) {
  if (!isValidEmail(email) || typeof password !== "string" ||
      password.length < 1 || password.length > 1024 ||
      !supabaseUrl || !anonKey || !serviceRoleKey) {
    return { ok: false, error: "Invalid sign-in credentials." };
  }
  const base = supabaseUrl.replace(/\/$/, "");
  try {
    const response = await fetchImpl(base + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) return { ok: false, error: "Invalid sign-in credentials." };
    const session = await response.json();
    if (!session.access_token || !session.user || !session.user.id ||
        !session.user.email_confirmed_at || session.user.is_anonymous === true) {
      return { ok: false, error: "Owner access unavailable." };
    }
    const role = await readRole({ supabaseUrl: base, serviceRoleKey,
      userId: session.user.id, fetchImpl });
    if (role !== ROLES.OWNER) return { ok: false, error: "Owner access unavailable." };
    // This module intentionally does NOT return bearer or refresh tokens.
    // A production endpoint must establish a protected HttpOnly, Secure,
    // SameSite cookie session, with rotation/revocation and CSRF protection.
    return { ok: true, ownerUserId: session.user.id };
  } catch (_) {
    return { ok: false, error: "Sign-in is temporarily unavailable." };
  }
}

module.exports = { isValidEmail, verifyOwnerCredentials };
