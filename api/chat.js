const crypto = require("node:crypto");
// SanZa Chat preview API — server-side Supabase access only.
// Required Vercel Preview env vars (scope to branch sanza-chat-preview):
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, TURNSTILE_SECRET_KEY
// Never expose the service-role key to browser code.

const ROOM_ID = "0d17bbf7-8bf1-4766-a9a0-c6658e086e8c";
const MAX_MESSAGE_LENGTH = 500;
const MIN_SEND_INTERVAL_MS = 2500;
const MAX_SENDS_PER_MINUTE = 12;
const NICK_RE = /^[A-Za-z0-9_]{3,18}$/;
// Preview-only strict family chat filter. Review false positives before public launch.
const BLOCKED_WORDS = [
  "fuck","fucking","fucker","shit","shitty","bitch","cunt","asshole","arsehole",
  "bastard","wanker","wank","wanking","twat","prick","dickhead","dick","diks","dik","penis","penus","pen1s","vagina","vagins","vag","ass","arse","pussy","pussi","motherfucker","motherfuker","fuk","fuker","fucker","fuking","fucking","slut","slapper","whore","hore","hoe","arsehole",
  "sex","sexy","porn","porno","pornography","nude","nudes","naked","horny",
  "nigger","nigga","niga","niger","nga","negro","coon","golliwog","paki","pakis",
  "raghead","towelhead","chink","gook","spic","wetback","kike","wog",
  "faggot","fag","dyke","tranny","homo","homosexual","gay","lesbian","ledbian",
  "retard","retarded","mongoloid","monkeyboy","blackmonkey","blackmonker",
  "whitepower","heilhitler","nazis","nazi",
  "die","death","suicide","selfharm","kys"
];
const BLOCKED_PHRASES = [
  "black monkey","black monker","go back to your country",
  "white power","heil hitler","kill yourself","kys","dirty immigrant",
  "go kill yourself","you should die","you should kill yourself","nobody wants you alive",
  "go die","drop dead","i will kill you","im going to kill you",
  "send nudes","show me nudes","send naked pics","show your private parts",
  "i will rape you","rape you","sexual assault","child porn","child pornography",
  "you are worthless","everyone hates you","nobody likes you","you dont belong here",
  "go back where you came from","dirty foreigner","dirty muslim","dirty jew",
  "shut up loser","ugly freak","stupid idiot"
];
const LEET = { "0":"o","1":"i","!":"i","3":"e","4":"a","@":"a","5":"s","$":"s","7":"t","+":"t","8":"b" };
function normalizeChatText(value) {
  return value.normalize("NFKC").toLowerCase()
    .replace(/[\u0300-\u036f\u200b-\u200f\u202a-\u202e\u2060\ufeff]/g,"")
    .replace(/[0134578!@$+]/g,c=>LEET[c]||c);
}
function containsBlockedLanguage(value) {
  const normal=normalizeChatText(value);
  const words=normal.split(/[^a-z]+/).filter(Boolean);
  const compact=normal.replace(/[^a-z]/g,"");
  const compressed=compact.replace(/([a-z])\1{2,}/g,"$1$1");
  for (const banned of BLOCKED_WORDS) {
    if(words.includes(banned)) return true;
    // Catch separated letters and punctuation within abusive words.
    if(banned.length>=4 && /[^a-z]/.test(normal) && (compact.includes(banned) || compressed.includes(banned))) return true;
  }
  const joined=words.join(" ");
  // Detect common misspellings of directed self-harm harassment (e.g. "kill yout self").
  // Do not flag a standalone help-seeking phrase such as "I feel unsafe".
  if (/\b(?:kill|k1ll|kll)\s+(?:your|you|yout|youre|ur|yr|yor)\s*self\b/i.test(value)) return true;
  return BLOCKED_PHRASES.some(phrase=>joined.includes(phrase)||compact.includes(phrase.replace(/ /g,"")));
}

// Nickname checks run server-side before creating an anonymous account.
// Keep this separate from message filtering to avoid blocking ordinary names.
const RESERVED_NICKNAMES = /^(?:admin|administrator|moderator|mod|owner|staff|support|system|sanzaadmin|sanzamod|sanzaowner|official|supabase|vercel|chatbot|security|helpdesk)(?:[0-9_]*)$/i;
const NICKNAME_ABUSE = [
  "fuck","fuk","fck","shit","bitch","cunt","wanker","twat","asshole","arsehole",
  "motherfucker","dickhead","pussy","slut","whore","porn","nude","naked",
  "nigger","nigga","raghead","towelhead","chink","gook","spic","wetback","kike",
  "faggot","retard","whitepower","heilhitler","killyourself",
  "kys","suicide","suicidal","selfharm","selfharmtips","cutyourself",
  "bully","bullying","loser","uglyfreak","kill","murder","rape","rapist",
  "nudes","sexting","sext","pedo","pedophile","groomer","racist","racism",
  "hateall","die","deathwish","nobodylikesyou","worthless"
];
const NICKNAME_SHORTCUTS = /^(?:kys|stfu|gtfo|wtf|fu|fku|fuk|fck|n1gga|n1gger)(?:[0-9_]*)$/i;
function validateNickname(value) {
  if(typeof value!=="string" || !NICK_RE.test(value))
    return "Use 3–18 letters, numbers or underscores for your nickname.";
  if(RESERVED_NICKNAMES.test(value) || /^(?:sanza|official|staff|admin|mod)[_0-9]*(?:admin|owner|mod|staff|support)[_0-9]*$/i.test(value))
    return "That nickname is reserved. Choose another.";
  const normalized=normalizeChatText(value);
  const compact=normalized.replace(/[^a-z]/g,"");
  const squashed=compact.replace(/([a-z])\1+/g,"$1");
  const chunks=normalized.split(/[^a-z]+/).filter(Boolean);
  if(NICKNAME_SHORTCUTS.test(value) || containsBlockedLanguage(value) ||
     NICKNAME_ABUSE.some(word=>chunks.includes(word) || compact.includes(word) ||
       (word.length>=4 && squashed.includes(word.replace(/([a-z])\1+/g,"$1")))))
    return "That nickname is not allowed in SanZa Chat. Choose a friendly one.";
  return null;
}

function reply(res, status, data) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(status).json(data);
}

// Server-side email notification. Configure Resend for chat alerts; Brevo remains
// available only when Resend is not configured. No chat message text is emailed.
async function notifyChatReport(reportId) {
  const recipient = process.env.CHAT_ALERT_RECIPIENT;
  const sender = process.env.CHAT_ALERT_SENDER;
  if (!recipient || !sender) return false;
  const content = "A new SanZa Chat report needs review. Open the owner moderation panel. Report reference: " + reportId;
  try {
    if (process.env.RESEND_CHAT_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.RESEND_CHAT_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "SanZa Chat Alerts <" + sender + ">",
          to: [recipient],
          subject: "SanZa Chat: new report needs review",
          text: content
        })
      });
      if (!response.ok) console.error("Chat Resend alert failed", response.status);
      return response.ok;
    }
    if (process.env.BREVO_CHAT_API_KEY) {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": process.env.BREVO_CHAT_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { email: sender, name: "SanZa Chat Alerts" },
          to: [{ email: recipient }],
          subject: "SanZa Chat: new report needs review",
          textContent: content
        })
      });
      if (!response.ok) console.error("Chat Brevo alert failed", response.status);
      return response.ok;
    }
    return false;
  } catch (_) {
    console.error("Chat alert email unavailable");
    return false;
  }
}

function getConfig() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const anon = process.env.SUPABASE_ANON_KEY || "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const turnstile = process.env.TURNSTILE_SECRET_KEY || "";
  if (!url || !anon || !service || !turnstile) return null;
  return { url, anon, service, turnstile };
}

// 48-hour temporary bans require the private chat_bans table and CHAT_BAN_HASH_SECRET.
function ipFingerprint(req) {
  const secret = process.env.CHAT_BAN_HASH_SECRET;
  const raw = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (!secret || secret.length < 32 || !raw || raw.length > 64 || !/^[a-fA-F0-9:.]+$/.test(raw)) return null;
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}
// Preview registration throttling: shared networks receive a short cooldown, not a blanket ban.
// Requires the preview-only SQL migration in docs/chat-registration-throttle.sql.
async function registrationThrottle(config, req) {
  const hash = ipFingerprint(req);
  if (!hash) return { error: "Registration protection unavailable." };
  const check = await supa(config, "/rest/v1/rpc/chat_registration_throttle", {
    method: "POST", body: { p_ip_hash: hash }
  }, true);
  if (!check.ok || !check.data || typeof check.data.allowed !== "boolean")
    return { error: "Registration protection unavailable." };
  return check.data.allowed ? null : { error: "Too many new nicknames from this connection. Please try again later.", retry_after: check.data.retry_after || 900 };
}
function deviceFingerprint(body) {
  const secret=process.env.CHAT_BAN_HASH_SECRET;
  const id=body && typeof body.device_id==="string" ? body.device_id : "";
  if(!secret || secret.length<32 || !/^[a-f0-9-]{36}$/i.test(id)) return null;
  return crypto.createHmac("sha256",secret).update("device:"+id.toLowerCase()).digest("hex");
}
async function deviceBan(config,body) {
  const hash=deviceFingerprint(body);
  if(!hash) return {error:"Device safety check unavailable."};
  const q="/rest/v1/chat_bans?select=expires_at&device_hash=eq."+hash+
    "&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&limit=1";
  const found=await supa(config,q,{},true);
  if(!found.ok) return {error:"Device safety check unavailable."};
  return found.data && found.data.length ? {expires_at:found.data[0].expires_at} : null;
}
async function deviceHashesForUser(config,userId) {
  const found=await supa(config,"/rest/v1/chat_user_devices?select=device_hash&user_id=eq."+encodeURIComponent(userId),{},true);
  if(!found.ok) return null;
  return [...new Set((found.data||[]).map(x=>x.device_hash).filter(Boolean))];
}
async function activeBan(config, req, userId) {
  const ipHash = ipFingerprint(req);
  if (!ipHash) return { error: "Temporary ban protection unavailable." };
  const now = encodeURIComponent(new Date().toISOString());
  const filter = userId ? "or=(ip_hash.eq."+ipHash+",user_id.eq."+userId+")" : "ip_hash=eq."+ipHash;
  const q = "/rest/v1/chat_bans?select=expires_at&"+filter+"&expires_at=gt."+now+"&order=expires_at.desc&limit=1";
  const found = await supa(config,q,{},true);
  if (!found.ok) return { error: "Temporary ban protection unavailable." };
  const row = Array.isArray(found.data) ? found.data[0] : null;
  return row ? { expires_at: row.expires_at } : null;
}
// Count rejected abusive messages across serverless instances; fail closed if logging fails.
async function recordViolation(config, userId, category) {
  const logged = await supa(config,"/rest/v1/chat_violations",{
    method:"POST",headers:{Prefer:"return=minimal"},
    body:{user_id:userId,category,created_at:new Date().toISOString()}
  },true);
  if (!logged.ok) return {error:"Safety logging unavailable. Please try later."};
  const cutoff=encodeURIComponent(new Date(Date.now()-24*60*60*1000).toISOString());
  const result=await supa(config,"/rest/v1/chat_violations?select=id&user_id=eq."+encodeURIComponent(userId)+"&created_at=gte."+cutoff+"&limit=3",{},true);
  if (!result.ok) return {error:"Safety check unavailable. Please try later."};
  const count=Array.isArray(result.data)?result.data.length:0;
  if (count < 3) return {warning:true};
  const expires=new Date(Date.now()+48*60*60*1000).toISOString();
  const ban=await supa(config,"/rest/v1/chat_bans",{
    method:"POST",headers:{Prefer:"return=minimal"},
    body:{user_id:userId,ip_hash:null,reason:"Automatic ban: 3 blocked messages in 24 hours",expires_at:expires}
  },true);
  if(ban.ok) {
    const hashes=await deviceHashesForUser(config,userId);
    if(hashes===null) return {error:"Device ban lookup unavailable."};
    for(const hash of hashes) {
      const linked=await supa(config,"/rest/v1/chat_bans",{
        method:"POST",headers:{Prefer:"return=minimal"},
        body:{user_id:userId,ip_hash:null,device_hash:hash,reason:"Automatic device restriction",expires_at:expires}
      },true);
      if(!linked.ok) return {error:"Device ban protection unavailable."};
    }
  }
  if (!ban.ok) return {error:"Automatic safety restriction unavailable."};
  return {expires_at:expires};
}
function banReply(res, ban) {
  return reply(res, ban.error ? 503 : 403, {error:ban.error || "SanZa Chat access is temporarily suspended for 48 hours.", banned_until:ban.expires_at || null});
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
  return host === "sanzagames.ie" ||
    host === "www.sanzagames.ie" ||
    host === "sanzagames-preview.vercel.app" ||
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

async function verifyTurnstile(config, token, req) {
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  const params = new URLSearchParams({ secret: config.turnstile, response: token });
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (ip) params.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  if (!response.ok) return false;
  const result = await response.json();
  const verifiedHost = typeof result.hostname === "string" ? result.hostname.toLowerCase() : "";
  const requestHost = String(req.headers.host || "").toLowerCase().split(":")[0];
  const isAllowedHost = host => host === "sanzagames.ie" ||
    host === "www.sanzagames.ie" ||
    host === "sanzagames-preview.vercel.app" ||
    host === "sanzagames-preview-sanza3.vercel.app" ||
    /^sanzagames-preview-[a-z0-9-]+-sanza3\.vercel\.app$/.test(host);
  return result.success === true && isAllowedHost(verifiedHost) &&
    verifiedHost === requestHost;
}

async function authenticate(config, req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const result = await supa(config, "/auth/v1/user", { token: match[1] });
  if (!result.ok || !result.data || !result.data.id) return null;
  let aal="aal1";try{const payload=JSON.parse(Buffer.from(match[1].split(".")[1],"base64url").toString());aal=payload.aal||"aal1"}catch(_){}return { id: result.data.id, token: match[1], aal, age_group: result.data.user_metadata && result.data.user_metadata.age_group };
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
  if (containsBlockedLanguage(text)) {
    return { ok: false, error: "That language is not allowed in SanZa Chat." };
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
      const deviceBlock=await deviceBan(config,body);
      if(deviceBlock) return banReply(res,deviceBlock);
      const ban = await activeBan(config,req,null);
      if (ban) return banReply(res,ban);
      const ageGroup = typeof body.age_group === "string" ? body.age_group : "";
      if (ageGroup === "under13") return reply(res,403,{error:"SanZa Chat is currently for ages 16 and over."});
      if (ageGroup === "13to15") return reply(res,403,{error:"Ages 13–15 cannot join until a verified parental permission process is available."});
      if (ageGroup !== "16plus") return reply(res,400,{error:"Select your age group before joining."});
      const nickname = typeof body.nickname === "string" ? body.nickname.trim() : "";
      const nicknameError = validateNickname(nickname);
      if (nicknameError) return reply(res, 400, { error: nicknameError });
      if (!await verifyTurnstile(config, body.captcha_token, req)) {
        return reply(res, 403, { error: "Please complete the CAPTCHA check before joining." });
      }
      const throttle = await registrationThrottle(config,req);
      if (throttle) return reply(res,throttle.retry_after ? 429 : 503,{error:throttle.error,retry_after:throttle.retry_after || null});
      const signup = await supa(config, "/auth/v1/signup", {
        method: "POST",
        body: { data: { nickname, age_group: "16plus" } }
      });
      if (!signup.ok || !signup.data || !signup.data.access_token || !signup.data.user) {
        return reply(res, signup.status === 429 ? 429 : 503, {
          error: "Nickname sign-in is unavailable. Check that anonymous sign-ins are enabled in the preview project."
        });
      }
      const userId = signup.data.user.id;
      const profile = await supa(config, "/auth/v1/admin/users/" + encodeURIComponent(userId), {
        method: "PUT",
        body: { user_metadata: { nickname, age_group: "16plus" } }
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
      const deviceHash=deviceFingerprint(body);
      if(!deviceHash) return reply(res,503,{error:"Device safety protection unavailable."});
      const savedDevice=await supa(config,"/rest/v1/chat_user_devices",{
        method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
        body:{user_id:userId,device_hash:deviceHash}
      },true);
      if(!savedDevice.ok) return reply(res,503,{error:"Device safety protection unavailable."});
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

    // Preview-only admin email login. Admin rights are verified by Supabase UID,
    // never by a nickname or an email supplied in the request.
    if (action === "admin_email_login") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (email !== "sanzafoodhub@gmail.com" || !password || password.length > 1024)
        return reply(res, 401, { error: "Invalid admin credentials." });
      const signIn = await supa(config, "/auth/v1/token?grant_type=password", {
        method: "POST", body: { email, password }
      });
      if (!signIn.ok || !signIn.data?.access_token || !signIn.data?.user?.id)
        return reply(res, 401, { error: "Invalid admin credentials." });
      const id = signIn.data.user.id;
      if (id !== "68548953-f190-448e-87e4-3a51d84869b7" ||
          signIn.data.user.email?.toLowerCase() !== email ||
          !signIn.data.user.email_confirmed_at || !await isAdmin(config,id))
        return reply(res, 403, { error: "This account is not authorised for admin access." });
      const existing = await membership(config,id);
      if (!existing) {
        const joined = await supa(config, "/rest/v1/chat_members", {
          method:"POST", headers:{Prefer:"return=minimal"},
          body:{room_id:ROOM_ID,user_id:id,nickname:"SanZaOwner",is_active:true,joined_at:new Date().toISOString()}
        },true);
        if(!joined.ok) return reply(res,503,{error:"Admin chat membership could not be set up. Contact the operator."});
      }
      const profile = await supa(config, "/auth/v1/admin/users/"+encodeURIComponent(id), {
        method:"PUT",body:{user_metadata:{nickname:existing?.nickname||"SanZaOwner",age_group:"16plus"}}
      },true);
      if(!profile.ok) return reply(res,503,{error:"Admin profile could not be confirmed."});
      return reply(res,200,{
        user:{id,nickname:existing?.nickname||"SanZaOwner"},
        session:{access_token:signIn.data.access_token,refresh_token:signIn.data.refresh_token,
          expires_at:signIn.data.expires_at,token_type:signIn.data.token_type}
      });
    }

    // TOTP setup and challenge verification are handled by Supabase Auth.
    if (["owner_mfa_status","owner_mfa_enroll","owner_mfa_challenge","owner_mfa_verify"].includes(action)) {
      const auth=await authenticate(config,req);
      if(!auth||auth.id!=="68548953-f190-448e-87e4-3a51d84869b7"||!await isAdmin(config,auth.id))
        return reply(res,403,{error:"Owner sign-in required."});
      const identity=await supa(config,"/auth/v1/user",{token:auth.token});
      if(!identity.ok)return reply(res,401,{error:"Sign in again."});
      const factors=Array.isArray(identity.data?.factors)?identity.data.factors:[];
      const verified=factors.find(f=>f.factor_type==="totp"&&f.status==="verified");
      if(action==="owner_mfa_status")return reply(res,200,{
        enrolled:!!verified,factor_id:verified?.id||null,verified_session:auth.aal==="aal2"
      });
      if(action==="owner_mfa_enroll"){
        if(verified)return reply(res,409,{error:"Authenticator already enrolled."});
        const enrolled=await supa(config,"/auth/v1/factors",{method:"POST",token:auth.token,
          body:{factor_type:"totp",friendly_name:"SanZa Chat Owner"}});
        if(!enrolled.ok)return reply(res,400,{error:"Could not start authenticator setup."});
        return reply(res,200,{factor_id:enrolled.data?.id,qr_code:enrolled.data?.totp?.qr_code,
          secret:enrolled.data?.totp?.secret});
      }
      const factor=typeof body.factor_id==="string"?body.factor_id:"";
      if(!/^[a-f0-9-]{36}$/i.test(factor))return reply(res,400,{error:"Invalid authenticator."});
      if(action==="owner_mfa_challenge"){
        if(!factors.some(f=>f.id===factor&&f.factor_type==="totp"))
          return reply(res,403,{error:"Unknown authenticator."});
        const challenge=await supa(config,"/auth/v1/factors/"+encodeURIComponent(factor)+"/challenge",
          {method:"POST",token:auth.token,body:{}});
        if(!challenge.ok)return reply(res,400,{error:"Could not start verification."});
        return reply(res,200,{challenge_id:challenge.data?.id});
      }
      const challenge=typeof body.challenge_id==="string"?body.challenge_id:"";
      const otp=typeof body.code==="string"?body.code:"";
      if(!challenge||!/^[0-9]{6}$/.test(otp))return reply(res,400,{error:"Enter your six-digit code."});
      const result=await supa(config,"/auth/v1/factors/"+encodeURIComponent(factor)+"/verify",
        {method:"POST",token:auth.token,body:{challenge_id:challenge,code:otp}});
      if(!result.ok||!result.data?.access_token)return reply(res,401,{error:"Incorrect or expired authenticator code."});
      return reply(res,200,{session:{access_token:result.data.access_token,
        refresh_token:result.data.refresh_token,expires_at:result.data.expires_at,
        token_type:result.data.token_type}});
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
    if (user.age_group !== "16plus") return reply(res,403,{error:"This older chat session needs to be restarted. Leave this device and join again with the age selection."});
    const ban = await activeBan(config,req,user.id);
    if (ban) return banReply(res,ban);
    const member = await membership(config, user.id);
    if (!member) return reply(res, 403, { error: "You are not an active member of this chat room." });

    const admin = await isAdmin(config, user.id);
    const adminReady = admin && (user.id!=="68548953-f190-448e-87e4-3a51d84869b7" || user.aal==="aal2");
    if (action === "whoami") return reply(res, 200, { admin:adminReady });

    // A heartbeat is only sent while the tab is visible. Online means seen within 75 seconds.
    if (action === "presence") {
      const updated = await supa(config,
        "/rest/v1/chat_members?room_id=eq." + ROOM_ID + "&user_id=eq." + encodeURIComponent(user.id) + "&is_active=eq.true", {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: { last_seen_at: new Date().toISOString() }
        }, true);
      if (!updated.ok) return reply(res, 503, { error: "Online status is not configured yet." });
      return reply(res, 200, { ok: true });
    }

    if (action === "list") {
      // Run independent queries together to reduce round-trip latency.
      const cutoff = new Date(Date.now() - 75000).toISOString();
      const [messagesResult, onlineResult] = await Promise.all([
        supa(config,
          "/rest/v1/chat_messages?select=id,room_id,user_id,content,created_at&room_id=eq." +
          ROOM_ID + "&order=created_at.desc&limit=50", {}, true),
        supa(config,
          "/rest/v1/chat_members?select=nickname&room_id=eq." + ROOM_ID +
          "&is_active=eq.true&last_seen_at=gte." + encodeURIComponent(cutoff) +
          "&order=nickname.asc&limit=100", {}, true)
      ]);
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
      const online = onlineResult.ok && Array.isArray(onlineResult.data)
        ? onlineResult.data.map(m => m.nickname).filter(Boolean) : null;
      return reply(res, 200, { admin:adminReady, messages: messages.map(m => ({
        id: m.id, user_id: m.user_id, nickname: names[m.user_id] || "Member",
        content: m.content, created_at: m.created_at
      })), online });
    }

    if (action === "send") {
      const cutoff = new Date(Date.now()-60000).toISOString();
      const recent = await supa(config,
        "/rest/v1/chat_messages?select=created_at&room_id=eq."+ROOM_ID+
        "&user_id=eq."+encodeURIComponent(user.id)+"&created_at=gte."+encodeURIComponent(cutoff)+
        "&order=created_at.desc&limit=13",{},true);
      if(!recent.ok) return reply(res,503,{error:"Message safety check unavailable. Please try again."});
      const timestamps=Array.isArray(recent.data)?recent.data:[];
      if(timestamps.length>=MAX_SENDS_PER_MINUTE) return reply(res,429,{error:"Slow down! Maximum 12 messages per minute."});
      if(timestamps.length&&Date.now()-new Date(timestamps[0].created_at).getTime()<MIN_SEND_INTERVAL_MS)
        return reply(res,429,{error:"Please wait a couple of seconds between messages."});
      const checked = cleanMessage(body.content);
      if (!checked.ok) {
        // Only count abusive language, not accidental links, blank messages or length errors.
        if (checked.error === "That language is not allowed in SanZa Chat.") {
          const result=await recordViolation(config,user.id,"blocked_language");
          if (result.error) return reply(res,503,{error:result.error});
          if (result.expires_at) return reply(res,403,{error:"Automatic 48-hour ban after repeated blocked messages.",banned_until:result.expires_at});
          return reply(res,400,{error:"Inappropriate message blocked. Repeated violations lead to a 48-hour ban."});
        }
        return reply(res,400,{error:checked.error});
      }
      let finalText = checked.text;
      if (body.reply_to !== undefined && body.reply_to !== null) {
        const replyId = typeof body.reply_to === "string" ? body.reply_to : "";
        if (!/^[0-9a-f-]{36}$/i.test(replyId)) return reply(res, 400, { error: "Invalid reply target." });
        const original = await supa(config,
          "/rest/v1/chat_messages?select=id,user_id,content&room_id=eq." + ROOM_ID +
          "&id=eq." + encodeURIComponent(replyId) + "&limit=1", {}, true);
        if (!original.ok) return reply(res, 503, { error: "Couldn't verify the message being replied to." });
        const target = Array.isArray(original.data) ? original.data[0] : null;
        if (!target || /^\[Message (deleted|removed) by /.test(target.content || ""))
          return reply(res, 400, { error: "That message is no longer available to reply to." });
        const author = await supa(config,
          "/rest/v1/chat_members?select=nickname&room_id=eq." + ROOM_ID +
          "&user_id=eq." + encodeURIComponent(target.user_id) + "&limit=1", {}, true);
        if (!author.ok) return reply(res, 503, { error: "Couldn't verify the reply author." });
        const nick = Array.isArray(author.data) && author.data[0] ? author.data[0].nickname : "Member";
        const excerpt = String(target.content || "").replace(/\s+/g, " ").slice(0, 70);
        const prefix = "↪ " + nick + " said: “" + excerpt + "”\n";
        if (prefix.length + finalText.length > MAX_MESSAGE_LENGTH)
          return reply(res, 400, { error: "Reply is too long. Shorten your message." });
        finalText = prefix + finalText;
      }
      const inserted = await supa(config, "/rest/v1/chat_messages", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: { room_id: ROOM_ID, user_id: user.id, content: finalText, created_at: new Date().toISOString() }
      }, true);
      if (!inserted.ok) return reply(res, 502, { error: "Your message couldn't be sent. Please try again." });
      return reply(res, 201, { message: Array.isArray(inserted.data) ? inserted.data[0] : null });
    }

    if (action === "delete_own_message") {
      const id=typeof body.message_id==="string"?body.message_id:"";
      if(!/^[0-9a-f-]{36}$/i.test(id))return reply(res,400,{error:"Invalid message."});
      const q="/rest/v1/chat_messages?select=id,user_id,created_at,content&room_id=eq."+ROOM_ID+"&id=eq."+encodeURIComponent(id)+"&limit=1";
      const found=await supa(config,q,{},true);
      if(!found.ok)return reply(res,503,{error:"Unable to verify message ownership."});
      const msg=Array.isArray(found.data)?found.data[0]:null;
      if(!msg||msg.user_id!==user.id)return reply(res,403,{error:"You can only delete your own messages."});
      const age=Date.now()-new Date(msg.created_at).getTime();
      if(!Number.isFinite(age)||age<0||age>10*60*1000)return reply(res,403,{error:"You can only delete a message within 10 minutes."});
      if(msg.content==="[Message deleted by sender]")return reply(res,200,{message:"Already deleted."});
      const updated=await supa(config,"/rest/v1/chat_messages?room_id=eq."+ROOM_ID+"&id=eq."+encodeURIComponent(id)+"&user_id=eq."+encodeURIComponent(user.id)+"&created_at=gte."+encodeURIComponent(new Date(Date.now()-10*60*1000).toISOString()),{
        method:"PATCH",headers:{Prefer:"return=representation"},body:{content:"[Message deleted by sender]"}
      },true);
      if(!updated.ok||!Array.isArray(updated.data)||updated.data.length!==1)return reply(res,409,{error:"Message could not be deleted. It may be too old."});
      return reply(res,200,{message:"Message deleted for everyone."});
    }

    if (action === "report") {
      const messageId = typeof body.message_id === "string" ? body.message_id : "";
      const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
      if (!/^[0-9a-f-]{36}$/i.test(messageId) || !reason) {
        return reply(res, 400, { error: "Choose a message and give a reason for the report." });
      }
      const report = await supa(config, "/rest/v1/chat_reports", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: { room_id: ROOM_ID, message_id: messageId, reporter_id: user.id, reason, created_at: new Date().toISOString() }
      }, true);
      if (!report.ok) return reply(res, 502, { error: "Couldn't submit your report." });
      const newReportId = Array.isArray(report.data) && report.data[0] && report.data[0].id;
      if (newReportId) await notifyChatReport(newReportId);
      return reply(res, 201, { message: "Report submitted to the moderators." });
    }

    if (action === "admin_reports" || action === "resolve_report" || action === "set_report_legal_hold" || action === "hide_message" || action === "suspend_member" || action === "ban_member_48h") {
      if (!adminReady) return reply(res, 403, { error: "Admin access required." });
      if (action === "admin_reports") {
        const reports = await supa(config,
          "/rest/v1/chat_reports?select=id,room_id,message_id,reporter_id,reason,created_at,status,resolved_at,legal_hold,legal_hold_reason&room_id=eq." +
          ROOM_ID + "&order=created_at.desc&limit=100", {}, true);
        if (!reports.ok) return reply(res, 502, { error: "Couldn't load reports." });
        return reply(res, 200, { reports: reports.data });
      }
      if (action === "set_report_legal_hold") {
        const id = typeof body.report_id === "string" ? body.report_id : "";
        const hold = body.legal_hold;
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";
        if (!/^[0-9a-f-]{36}$/i.test(id) || typeof hold !== "boolean" || reason.length<5 || reason.length>500)
          return reply(res,400,{error:"Report, action and reason (5–500 characters) required."});
        const scoped = await supa(config,
          "/rest/v1/chat_reports?select=id&id=eq."+encodeURIComponent(id)+"&room_id=eq."+ROOM_ID+"&limit=1",{},true);
        if(!scoped.ok || !Array.isArray(scoped.data) || scoped.data.length!==1)
          return reply(res,404,{error:"Report not found."});
        const result = await supa(config,"/rest/v1/rpc/chat_set_report_legal_hold",{
          method:"POST",headers:{Prefer:"return=representation"},
          body:{p_report_id:id,p_admin_id:user.id,p_new_hold:hold,p_reason:reason}
        },true);
        if(!result.ok) return reply(res,503,{error:"Legal hold update failed. Check preview SQL migration."});
        return reply(res,200,{message:hold?"Legal hold placed and audited.":"Legal hold released and audited."});
      }
      if (action === "resolve_report") {
        const id = typeof body.report_id === "string" ? body.report_id : "";
        if (!/^[0-9a-f-]{36}$/i.test(id)) return reply(res,400,{error:"Invalid report."});
        const updated = await supa(config,
          "/rest/v1/chat_reports?id=eq."+encodeURIComponent(id)+"&room_id=eq."+ROOM_ID+"&status=eq.pending",{
            method:"PATCH",headers:{Prefer:"return=representation"},
            body:{status:"resolved",resolved_at:new Date().toISOString(),resolved_by:user.id}
          },true);
        if(!updated.ok) return reply(res,503,{error:"Could not resolve report."});
        if(!Array.isArray(updated.data)||updated.data.length!==1)
          return reply(res,409,{error:"Report already resolved or not found."});
        return reply(res,200,{message:"Report marked resolved."});
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
      if (action === "ban_member_48h") {
        const targetId = typeof body.user_id === "string" ? body.user_id : "";
        if (!/^[0-9a-f-]{36}$/i.test(targetId) || targetId === user.id || await isAdmin(config,targetId))
          return reply(res,400,{error:"Invalid ban target."});
        // User-based ban immediately takes effect. IP fingerprint is captured only if a
        // trusted, server-side fingerprint is available for the target in a future session.
        const expires = new Date(Date.now()+48*60*60*1000).toISOString();
        const hashes=await deviceHashesForUser(config,targetId);
        if(hashes===null) return reply(res,503,{error:"Device ban lookup unavailable."});
        const added = await supa(config,"/rest/v1/chat_bans",{
          method:"POST",headers:{Prefer:"return=minimal"},
          body:{user_id:targetId,ip_hash:null,expires_at:expires,reason:"Moderator 48-hour suspension"}
        },true);
        if (!added.ok) return reply(res,503,{error:"Could not save temporary ban."});
        for(const hash of hashes) {
          const linked=await supa(config,"/rest/v1/chat_bans",{
            method:"POST",headers:{Prefer:"return=minimal"},
            body:{user_id:targetId,ip_hash:null,device_hash:hash,expires_at:expires,reason:"Moderator device restriction"}
          },true);
          if(!linked.ok) return reply(res,503,{error:"Account banned, but device restriction couldn't be saved."});
        }
        return reply(res,200,{message:"Member banned for 48 hours.",banned_until:expires});
      }
      if (action === "suspend_member") {
        const targetId = typeof body.user_id === "string" ? body.user_id : "";
        if (!/^[0-9a-f-]{36}$/i.test(targetId) || targetId === user.id) {
          return reply(res, 400, { error: "Invalid member." });
        }
        if (await isAdmin(config,targetId)) return reply(res,403,{error:"Cannot suspend another administrator."});
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
