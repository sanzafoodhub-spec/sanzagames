"use strict";
// Staging-only moderator sign-in; independent cookie from Owner.
const {issueSessionRecord}=require("../v2/owner-session");
const {saveSession}=require("../v2/owner-session-store");
const {readRole,ROLES}=require("../v2/role-permissions");
const COOKIE="__Host-sanza_moderator";
const attempts=new Map();
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed."});}
 if(req.headers.origin!=="https://"+req.headers.host||!String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))return res.status(403).json({error:"Request rejected."});
 const ip=String(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].trim();
 const now=Date.now();for(const [k,v] of attempts)if(v.until<=now)attempts.delete(k);
 const prior=attempts.get(ip)||{count:0,until:now+900000};
 if(prior.count>=5){res.setHeader("Retry-After",String(Math.ceil((prior.until-now)/1000)));return res.status(429).json({error:"Too many attempts. Try later."});}
 prior.count++;attempts.set(ip,prior);
 const {email,password}=req.body&&typeof req.body==="object"?req.body:{};
 if(typeof email!=="string"||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=="string"||password.length<1||password.length>1024)return res.status(400).json({error:"Invalid credentials."});
 const base=process.env.CHAT_V2_SUPABASE_URL,key=process.env.CHAT_V2_SUPABASE_ANON_KEY,service=process.env.CHAT_V2_SUPABASE_SERVICE_ROLE_KEY;
 if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(base||"")||!key||!service)return res.status(503).json({error:"Staging sign-in unavailable."});
 try{
  const response=await fetch(base.replace(/\/$/,"")+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
  if(!response.ok)return res.status(401).json({error:"Sign-in unsuccessful."});
  const auth=await response.json();
  if(!auth.user?.id||!auth.user.email_confirmed_at||auth.user.is_anonymous===true)return res.status(401).json({error:"Sign-in unsuccessful."});
  const role=await readRole({supabaseUrl:base,serviceRoleKey:service,userId:auth.user.id});
  if(role!==ROLES.MODERATOR)return res.status(403).json({error:"Moderator access required."});
  const {token,record}=issueSessionRecord(auth.user.id);
  await saveSession(record);
  res.setHeader("Set-Cookie",COOKIE+"="+token+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800");
  return res.status(200).json({ok:true});
 }catch(_){return res.status(503).json({error:"Sign-in temporarily unavailable."});}
};