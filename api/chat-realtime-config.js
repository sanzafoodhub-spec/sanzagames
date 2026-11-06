"use strict";
// Public configuration only. Never return a service-role/secret key.
module.exports=function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const url=process.env.SUPABASE_URL||"";
 const key=process.env.SUPABASE_ANON_KEY||"";
 const enabled=process.env.SANZA_REALTIME_ENABLED==="true" && /^https:\/\/[^/]+\.supabase\.co\/?$/.test(url) && !!key && !key.startsWith("sb_secret_");
 return res.status(200).json(enabled?{enabled:true,url:url.replace(/\/$/,""),anonKey:key,roomId:"0d17bbf7-8bf1-4766-a9a0-c6658e086e8c"}:{enabled:false});
};