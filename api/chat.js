// SanZa Chat preview API — server-side Supabase access only.
// Required Vercel Preview env vars (scope to branch sanza-chat-preview):
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Never expose the service-role key to browser code.

const ROOM_ID = "0d17bbf7-8bf1-4766-a9a0-c6658e086e8c";
const MAX_MESSAGE_LENGTH = 500;
const NICK_RE = /^[A-Za-z0-9_]{3,18}$/;
const BLOCKED_WORDS = ["fuck", "shit", "bitch", "cunt", "nigger", "faggot"];

function reply(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(data);
}

function getConfig() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !anon || !service) return null;
  return { url, anon, service };
}

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (_) { return {}; }
  }
  return {};
}

function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  let host = "";
  try { host = new URL(origin).hostname.toLowerCase(); } catch (_) { return false; }
  return host === "sanzagames-preview.vercel.app" ||
    host === "sanzagames-preview-sanza3.vercel.app" ||
    (host.startsWith("sanzagames-preview-") && host.endsWith(".vercel.app"));
}

async function supa(config, path, options = {}, useService = false) {
  const key = useService ? config.service : config.anon;
  const headers = Object.assign({
    apikey: key,
    Accept: "application/json"
  }, options.headers || {});
  if (options.token) headers.Authorization = "Bearer " + options.token;
  else if (useService) headers.Authorization = "Bearer " + config.service;
  const init = { method: options.method || "GET", headers };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(config.url + path, init);
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = null; }
  return { ok: response.ok, status: response.status, data };
}

async function authenticate(config, req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const result = await supa(config, "/auth/v1/user", { token: match[1] });
  if (!result.ok || !result.data || !result.data.id) return null;
  return { id: result.data.id, token: match[1] };
}

async function membership(config, userId) {
  const q = "/rest/v1/chat_members?select=user_id,nickname,is_active&room_id=eq." +
    ROOM_ID + "&user_id=eq." + encodeURIComponent(userId) + "&is_active=eq.true&limit=1";
  const result = await supa(config, q, {}, true);
  return result.ok && Array.isArray(result.data) && result.data.length ? result.data[0] : null;
}

async function isAdmin(config, userId) {
  const q = "/rest/v1/chat_admins?select=user_id&user_id=eq." +
    encodeURIComponent(userId) + "&limit=1";
  const result = await supa(config, q, {}, true);
  return result.ok && Array.isArray(result.data) && result.data.length > 0;
}

function cleanMessage(value) {
  if (typeof value !== "string") return { ok: false, error: "Enter a message." };
  const text = value.trim();
  if (!text || text.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: "Messages must be between 1 and 500 characters." };
  }
  if (/https?:\/\/|www\.|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text) ||
      /\b(?:snapchat|instagram|insta|whatsapp|telegram|discord|tiktok)\b/i.test(text) ||
      /@[A-Za-z0-9_.]{2,}/.test(text) ||
      /(?:\+?\d[\d ()-]{7,}\d)/.test(text)) {
    return { ok: false, error: "Sharing links, contact details and social handles is not allowed." };
  }
  const lower = text.toLowerCase();
  if (BLOCKED_WORDS.some(word => new RegExp("(^|[^a-z])" + word + "([^a-z]|$)", "i").test(lower))) {
    return { ok: false, error: "Please keep the chat respectful." };
  }
  return { ok: true, text };
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, { error: "Method not allowed." });
  }
  if (!allowedOrigin(req)) return reply(res, 403, { error: "Request origin not allowed." });

  const config = getConfig();
  if (!config) return reply(res, 503, { error: "Chat backend is not configured yet." });

  const body = readBody(req);
  const action = typeof body.action === "string" ? body.action : "";

  try {
    // Anonymous registration is available only after anonymous sign-ins are enabled
    // in the dedicated preview Supabase project's Auth settings.
    if (action === "register") {
      const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
      if (!NICK_RE.test(nickname)) {
        return reply(res, 400, { error: "Use 3–18 letters, numbers or underscores for your nickname." });
      }
      const signup = await supa(config, "/auth/v1/signup", {
        method: "POST",
        body: { data: { nickname } }
      });
      if (!signup.ok || !signup.data || !signup.data.access_token || !signup.data.user) {
        return reply(res, signup.status === 429 ? 429 : 503, {
          error: "Nickname sign-in is unavailable. Check that anonymous sign-ins are enabled in the preview project."
        });
      }
      const userId = signup.data.user.id;
      const profile = await supa(config, "/auth/v1/admin/users/" + encodeURIComponent(userId), {
        method: "PUT",
        body: { user_metadata: { nickname } }
      }, true);
      if (!profile.ok) {
        await supa(config, "/auth/v1/admin/users/" + encodeURIComponent(userId), { method: "DELETE" }, true);
        return reply(res, 503, { error: "Couldn't finish creating your chat profile. Please try again." });
      }
      const member = await supa(config, "/rest/v1/chat_members", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: { room_id: ROOM_ID, user_id: userId, nickname, is_active: true, joined_at: new Date().toISOString() }
      }, true);
      if (!member.ok) {
        await supa(config, "/auth/v1/admin/users/" + encodeURIComponent(userId), { method: "DELETE" }, true);
        if (member.status === 409 || (member.data && member.data.code === "23505")) {
          return reply(res, 409, { error: "That nickname is already in use. Please choose another." });
        }
        return reply(res, 503, { error: "Couldn't join the chat room. Please try again." });
      }
      return reply(res, 201, {
        user: { id: userId, nickname },
        session: {
          access_token: signup.data.access_token,
          refresh_token: signup.data.refresh_token,
          expires_at: signup.data.expires_at,
          token_type: signup.data.token_type
        }
      });
    }

    if (action === "refresh") {
      const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token : "";
      if (!refreshToken || refreshToken.length > 4096) {
        return reply(res, 400, { error: "A valid session refresh token is required." });
      }
      const refreshed = await supa(config, "/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: { refresh_token: refreshToken }
      });
      if (!refreshed.ok || !refreshed.data || !refreshed.data.access_token) {
        return reply(res, 401, { error: "Your chat session has expired. Please join again." });
      }
      return reply(res, 200, {
        session: {
          access_token: refreshed.data.access_token,
          refresh_token: refreshed.data.refresh_token,
          expires_at: refreshed.data.expires_at,
          token_type: refreshed.data.token_type
        }
      });
    }

    const user = await authenticate(config, req);
    if (!user) return reply(res, 401, { error: "Please sign in to SanZa Chat." });
    const member = await membership(config, user.id);
    if (!member) return reply(res, 403, { error: "You are not an active member of this chat room." });

    if (action === "list") {
      const messagesResult = await supa(config,
        "/rest/v1/chat_messages?select=id,room_id,user_id,content,created_at&room_id=eq." +
        ROOM_ID + "&order=created_at.desc&limit=50", {}, true);
      if (!messagesResult.ok) return reply(res, 502, { error: "Couldn't load chat messages." });
      const messages = Array.isArray(messagesResult.data) ? messagesResult.data.reverse() : [];
      const ids = Array.from(new Set(messages.map(m => m.user_id).filter(Boolean)));
      let names = {};
      if (ids.length) {
        const inList = ids.map(id => encodeURIComponent(id)).join(",");
        const membersResult = await supa(config,
          "/rest/v1/chat_members?select=user_id,nickname&room_id=eq." + ROOM_ID +
          "&user_id=in.(" + inList + ")", {}, true);
        if (membersResult.ok && Array.isArray(membersResult.data)) {
          for (const item of membersResult.data) names[item.user_id] = item.nickname || "Member";
        }
      }
      return reply(res, 200, { messages: messages.map(m => ({
        id: m.id, user_id: m.user_id, nickname: names[m.user_id] || "Member",
        content: m.content, created_at: m.created_at
      })) });
    }

    if (action === "send") {
      const checked = cleanMessage(body.content);
      if (!checked.ok) return reply(res, 400, { error: checked.error });
      const inserted = await supa(config, "/rest/v1/chat_messages", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: { room_id: ROOM_ID, user_id: user.id, content: checked.text, created_at: new Date().toISOString() }
      }, true);
      if (!inserted.ok) return reply(res, 502, { error: "Your message couldn't be sent. Please try again." });
      return reply(res, 201, { message: Array.isArray(inserted.data) ? inserted.data[0] : null });
    }

    if (action === "report") {
      const messageId = typeof body.message_id === "string" ? body.message_id : "";
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
      if (!/^[0-9a-f-]{36}$/i.test(messageId) || !reason) {
        return reply(res, 400, { error: "Choose a message and give a reason for the report." });
      }
      const report = await supa(config, "/rest/v1/chat_reports", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: { room_id: ROOM_ID, message_id: messageId, reporter_id: user.id, reason, created_at: new Date().toISOString() }
      }, true);
      if (!report.ok) return reply(res, 502, { error: "Couldn't submit your report." });
      return reply(res, 201, { message: "Report submitted to the moderators." });
    }

    if (action === "admin_reports" || action === "hide_message" || action === "suspend_member") {
      if (!await isAdmin(config, user.id)) return reply(res, 403, { error: "Admin access required." });
      if (action === "admin_reports") {
        const reports = await supa(config,
          "/rest/v1/chat_reports?select=id,room_id,message_id,reporter_id,reason,created_at&room_id=eq." +
          ROOM_ID + "&order=created_at.desc&limit=100", {}, true);
        if (!reports.ok) return reply(res, 502, { error: "Couldn't load reports." });
        return reply(res, 200, { reports: reports.data });
      }
      if (action === "hide_message") {
        const id = typeof body.message_id === "string" ? body.message_id : "";
        if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(res, 400, { error: "Invalid message." });
        const hidden = await supa(config,
          "/rest/v1/chat_messages?id=eq." + encodeURIComponent(id) + "&room_id=eq." + ROOM_ID, {
            method: "PATCH", headers: { Prefer: "return=minimal" },
            body: { content: "[Message removed by moderator]" }
          }, true);
        if (!hidden.ok) return reply(res, 502, { error: "Couldn't remove that message." });
        return reply(res, 200, { message: "Message removed from the chat." });
      }
      if (action === "suspend_member") {
        const targetId = typeof body.user_id === "string" ? body.user_id : "";
        if (!/^[0-9a-f-]{36}$/i.test(targetId) || targetId === user.id) {
          return reply(res, 400, { error: "Invalid member." });
        }
        const suspended = await supa(config,
          "/rest/v1/chat_members?room_id=eq." + ROOM_ID + "&user_id=eq." + encodeURIComponent(targetId), {
            method: "PATCH", headers: { Prefer: "return=minimal" },
            body: { is_active: false }
          }, true);
        if (!suspended.ok) return reply(res, 502, { error: "Couldn't suspend that member." });
        return reply(res, 200, { message: "Member suspended from this room." });
      }
    }

    return reply(res, 400, { error: "Unknown chat action." });
  } catch (error) {
    console.error("SanZa Chat API error:", error && error.message ? error.message : "unknown");
    return reply(res, 500, { error: "SanZa Chat is temporarily unavailable." });
  }
};
