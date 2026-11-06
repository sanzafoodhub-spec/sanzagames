"use strict";
// Supabase recovery access token is accepted only for a password update.
// No secret keys or recovery tokens are returned to the browser.
module.exports=async function handler(req,res){
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed."});}
 if(!req.headers.host||req.headers.origin!=="https://"+req.headers.host||
 !String(req.headers["content-type"]||"").toLowerCase().startsWith("application/json"))
 return res.status(403).json({error:"Request not allowed."});
 const {accessToken,password}=req.body||{};
 if(typeof accessToken!=="string"||accessToken.length>4096||!accessToken||
 typeof password!=="string"||password.length<12||password.length>1024)
 return res.status(400).json({error:"Invalid reset link or password. Use at least 12 characters."});
 const url=process.env.CHAT_V2_SUPABASE_URL,key=process.env.CHAT_V2_SUPABASE_ANON_KEY;
 if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(url||"")||!key)
 return res.status(503).json({error:"Password reset unavailable."});
 try{
  const base=url.replace(/\/$/,"");
  // Supabase Auth validates the signed recovery session token.
  const response=await fetch(base+"/auth/v1/user",{
   method:"PUT",headers:{apikey:key,Authorization:"Bearer "+accessToken,"Content-Type":"application/json"},
   body:JSON.stringify({password})
  });
  if(!response.ok)return res.status(400).json({error:"Reset link expired or password rejected. Request a new link."});
  return res.status(200).json({ok:true});
 }catch(_){return res.status(503).json({error:"Password reset temporarily unavailable."});}
};