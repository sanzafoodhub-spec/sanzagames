// Staging-only owner password recovery request. Never reveals account existence.
"use strict";
const attempts = new Map();
module.exports = async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed."});}
  if(!req.headers.host || req.headers.origin!=="https://"+req.headers.host ||
     !String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))
    return res.status(403).json({error:"Request not allowed."});
  const email=req.body?.email;
  if(typeof email!=="string" || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({error:"Enter a valid email."});
  const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim();
  const now=Date.now(), item=attempts.get(ip);
  if(item && item.until>now && item.count>=3) return res.status(429).json({error:"Please try again later."});
  attempts.set(ip, item && item.until>now ? {count:item.count+1,until:item.until}:{count:1,until:now+900000});
  const url=process.env.CHAT_V2_SUPABASE_URL;
  const key=process.env.CHAT_V2_SUPABASE_ANON_KEY;
  const origin="https://"+req.headers.host;
  if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url||"") || !key)
    return res.status(503).json({error:"Recovery is not configured yet."});
  try {
    // The Supabase Auth redirect URL must also be allowlisted in staging Auth settings.
    const upstream = await fetch(url.replace(/\/$/,"")+"/auth/v1/recover?redirect_to="+
      encodeURIComponent(origin+"/v2/owner-reset.html"),{
      method:"POST",headers:{apikey:key,"Content-Type":"application/json"},
      body:JSON.stringify({email:email.trim()})
    });
    if (upstream.status === 429) return res.status(429).json({error:"Email sending is rate-limited. Please wait before retrying."});
    if (!upstream.ok) {
      console.error("V2 recovery provider rejected request; status:", upstream.status);
      return res.status(503).json({error:"Recovery email could not be requested. Check staging email settings or try later."});
    }
  } catch (_) {
    console.error("V2 recovery provider connection failed");
    return res.status(503).json({error:"Recovery service temporarily unavailable."});
  }
  return res.status(200).json({ok:true,message:"If this email is registered, a reset link will arrive shortly."});
};
