// Vercel serverless endpoint for the SanZa Games newsletter.
// Double opt-in only: Brevo keeps contacts pending until they click its confirmation link.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  // Only accept requests originating from the SanZa Games preview deployment.
  const origin = req.headers.origin;
  if (origin) {
    let host = "";
    try { host = new URL(origin).hostname.toLowerCase(); } catch (_) {}
    const allowed = host === "sanzagames-preview.vercel.app" ||
      host === "sanzagames-preview-sanza3.vercel.app" ||
      (host.startsWith("sanzagames-preview-") && host.endsWith(".vercel.app"));
    if (!allowed) return res.status(403).json({ error: "Request origin not allowed." });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const templateId = Number(process.env.BREVO_DOI_TEMPLATE_ID);
  if (!apiKey || !Number.isInteger(templateId) || templateId < 1) {
    return res.status(503).json({
      error: "Newsletter signup is not configured yet. Please try again later."
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  if (!body || typeof body !== "object") body = {};

  // Quietly accept honeypot submissions without contacting Brevo.
  if (typeof body.website === "string" && body.website.trim()) {
    return res.status(200).json({ message: "If the address is valid, a confirmation email will arrive shortly." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (body.consent !== true) {
    return res.status(400).json({ error: "Please tick the consent box to sign up." });
  }

  try {
    // Resolve the exact list by name server-side so no list ID has to be exposed in the page.
    let listId = null;
    for (let offset = 0; offset < 500 && listId === null; offset += 50) {
      const listResponse = await fetch("https://api.brevo.com/v3/contacts/lists?limit=50&offset=" + offset, {
        headers: { "accept": "application/json", "api-key": apiKey }
      });
      if (!listResponse.ok) {
        console.error("Brevo list lookup failed:", listResponse.status);
        return res.status(502).json({ error: "Newsletter signup is temporarily unavailable. Please try again later." });
      }
      const listData = await listResponse.json();
      const lists = Array.isArray(listData.lists) ? listData.lists : [];
      const found = lists.find(function(item) { return item && item.name === "SanZa Games Newsletter"; });
      if (found) listId = Number(found.id);
      if (lists.length < 50) break;
    }
    if (!Number.isInteger(listId) || listId < 1) {
      console.error("Brevo list not found: SanZa Games Newsletter");
      return res.status(502).json({ error: "Newsletter signup is temporarily unavailable. Please try again later." });
    }

    const response = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email,
        includeListIds: [listId],
        templateId,
        redirectionUrl: "https://sanzagames-preview-git-website-upgrade-preview-sanza3.vercel.app/",
        updateEnabled: false
      })
    });

    if (response.ok || response.status === 201 || response.status === 204) {
      return res.status(200).json({
        message: "Check your inbox for the confirmation email. You are not subscribed until you confirm."
      });
    }

    // Do not expose Brevo's raw response or credentials to the browser.
    console.error("Brevo double opt-in request failed:", response.status);
    if (response.status === 400 || response.status === 401 || response.status === 403 || response.status === 404) {
      return res.status(502).json({
        error: "We couldn't start confirmation just now. Please try again later."
      });
    }
    return res.status(502).json({ error: "Newsletter signup is temporarily unavailable. Please try again later." });
  } catch (error) {
    console.error("Newsletter provider request failed:", error && error.message ? error.message : "unknown error");
    return res.status(502).json({ error: "Newsletter signup is temporarily unavailable. Please try again later." });
  }
};
