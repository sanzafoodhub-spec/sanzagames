"use strict";
// Run locally: node --test tests/chat-v2-moderation-security.test.js
// Pure permission tests: no network, credentials, or staging database required.
const test = require("node:test");
const assert = require("node:assert/strict");
const {ROLES,ACTIONS,can,isUuid,readRole} = require("../v2/role-permissions");

test("members cannot use any moderation action",()=>{
 for(const action of Object.values(ACTIONS))assert.equal(can(ROLES.MEMBER,action),false);
});
test("unknown or client-forged roles have no privileges",()=>{
 for(const role of ["admin","OWNER","superuser",null,undefined,{}])
  for(const action of Object.values(ACTIONS))assert.equal(can(role,action),false);
});
test("moderators can view reports but cannot manage security, moderators or full audit",()=>{
 assert.equal(can(ROLES.MODERATOR,ACTIONS.VIEW_REPORTS),true);
 for(const action of [ACTIONS.MANAGE_SECURITY,ACTIONS.MANAGE_MODERATORS,ACTIONS.VIEW_FULL_AUDIT,ACTIONS.PERMANENT_BAN])
  assert.equal(can(ROLES.MODERATOR,action),false);
});
test("owner has all declared actions",()=>{
 for(const action of Object.values(ACTIONS))assert.equal(can(ROLES.OWNER,action),true);
});
test("invalid user ids never trigger database lookups",async()=>{
 let called=false;
 const role=await readRole({supabaseUrl:"https://staging.supabase.co",serviceRoleKey:"fake",userId:"not-a-uuid",fetchImpl:async()=>{called=true;throw Error("should not fetch")}});
 assert.equal(role,ROLES.MEMBER);assert.equal(called,false);assert.equal(isUuid("not-a-uuid"),false);
});
test("role lookup fails closed on upstream failure",async()=>{
 const role=await readRole({supabaseUrl:"https://staging.supabase.co",serviceRoleKey:"fake",userId:"44f1e2b9-fc59-4c3f-8577-613ec6dbeab0",fetchImpl:async()=>({ok:false})});
 assert.equal(role,ROLES.MEMBER);
});
test("only explicit owner/moderator roles accepted from database",async()=>{
 const id="44f1e2b9-fc59-4c3f-8577-613ec6dbeab0";
 for(const [value,expected] of [["owner",ROLES.OWNER],["moderator",ROLES.MODERATOR],["admin",ROLES.MEMBER],["member",ROLES.MEMBER]]){
  const role=await readRole({supabaseUrl:"https://staging.supabase.co",serviceRoleKey:"fake",userId:id,fetchImpl:async()=>({ok:true,json:async()=>[{role:value}]})});
  assert.equal(role,expected);
 }
});
