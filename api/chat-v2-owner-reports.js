"use strict";
// Read-only staging moderation queue. Never connects to legacy chat.
const {COOKIE_NAME,parseCookies}=require("../v2/owner-session");
const {findSession}=require("../v2/owner-session-store");
const {readRole,ROLES,ACTIONS,can}=require("../v2/role-permissions");
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed."});}
 const cookies=String(req.headers.cookie||"");
 const token=parseCookies(cookies)[COOKIE_NAME] || (cookies.match(/(?:^|;\s*)__Host-sanza_moderator=([A-Za-z0-9_-]{43})(?:;|$)/)||[])[1];
 if(!token)return res.status(401).json({error:"Sign in required."});
 try{
  const session=await findSession(token);
  if(!session)return res.status(401).json({error:"Session expired."});
  const base=process.env.CHAT_V2_SUPABASE_URL,key=process.env.CHAT_V2_SUPABASE_SERVICE_ROLE_KEY;
  const role=await readRole({supabaseUrl:base,serviceRoleKey:key,userId:session.owner_user_id});
  if(!can(role,ACTIONS.VIEW_REPORTS))return res.status(403).json({error:"Moderation permission required."});
  if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(base||"")||!key)return res.status(503).json({error:"Staging not configured."});
  const response=await fetch(base.replace(/\/$/,"")+"/rest/v1/chat_v2_moderation_reports?select=id,created_at,reason,status,message_excerpt&order=created_at.desc&limit=50",{
   headers:{apikey:key,...(key.startsWith("sb_secret_")?{}:{Authorization:"Bearer "+key}),Accept:"application/json"}
  });
  if(!response.ok)return res.status(503).json({error:"Report queue not configured in staging yet."});
  const rows=await response.json();
  return res.status(200).json({reports:Array.isArray(rows)?rows:[]});
 }catch(_){return res.status(503).json({error:"Report queue temporarily unavailable."});}
};