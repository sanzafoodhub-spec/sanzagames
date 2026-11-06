"use strict";
// Preview-only, read-only bridge to the original #sanza report queue.
// Configure LEGACY_CHAT_SUPABASE_URL and LEGACY_CHAT_SUPABASE_SERVICE_ROLE_KEY
// ONLY on the isolated V2 preview Vercel project. Never expose them to clients.
// This endpoint cannot write, ban, delete, or alter legacy data.
const {COOKIE_NAME,parseCookies}=require("../v2/owner-session");
const {findSession}=require("../v2/owner-session-store");
const {readRole,ROLES}=require("../v2/role-permissions");
const ROOM_ID="0d17bbf7-8bf1-4766-a9a0-c6658e086e8c";
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Method not allowed."});}
 const token=parseCookies(String(req.headers.cookie||""))[COOKIE_NAME];
 if(!token)return res.status(401).json({error:"Owner sign-in required."});
 try{
  const session=await findSession(token);
  if(!session)return res.status(401).json({error:"Session expired."});
  const role=await readRole({supabaseUrl:process.env.CHAT_V2_SUPABASE_URL,serviceRoleKey:process.env.CHAT_V2_SUPABASE_SERVICE_ROLE_KEY,userId:session.owner_user_id});
  // Owner-only until the bridge has been security-reviewed for moderators.
  if(role!==ROLES.OWNER)return res.status(403).json({error:"Owner access required."});
  const base=process.env.LEGACY_CHAT_SUPABASE_URL;
  const key=process.env.LEGACY_CHAT_SUPABASE_SERVICE_ROLE_KEY;
  if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(base||"")||!key)
   return res.status(503).json({error:"Original chat reports not connected yet."});
  const url=base.replace(/\/$/,"")+"/rest/v1/chat_reports?select=id,message_id,reason,created_at&room_id=eq."+ROOM_ID+"&order=created_at.desc&limit=50";
  const response=await fetch(url,{headers:{apikey:key,...(key.startsWith("sb_secret_")?{}:{Authorization:"Bearer "+key}),Accept:"application/json"},signal:AbortSignal.timeout(8000)});
  if(!response.ok)return res.status(503).json({error:"Original chat report queue unavailable."});
  const rows=await response.json();
  const reports=Array.isArray(rows)?rows.map(x=>({id:x.id,message_id:x.message_id,reason:x.reason,created_at:x.created_at,source:"original-chat"})):[];
  return res.status(200).json({reports});
 }catch(_){return res.status(503).json({error:"Original chat reports temporarily unavailable."});}
};