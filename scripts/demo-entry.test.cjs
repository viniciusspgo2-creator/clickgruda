const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const ROOT = path.resolve(__dirname,'..')
const privacy = (() => {
 const js=ts.transpileModule(fs.readFileSync(path.join(ROOT,'src/lib/analytics-privacy.ts'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const mod={exports:{}};new Function('require','module','exports',js)(require,mod,mod.exports);return mod.exports
})()
function loadRoute({ admin=false, ignoredBrowser=false, ignoredIp=false, failWrite=false }={}){
 const events=[], settings=new Map()
 const cookieStore={get:()=>ignoredBrowser?{value:privacy.signedInternalCookie()}:undefined}
 if(ignoredIp)settings.set(privacy.ANALYTICS_IGNORE_IPS_KEY,JSON.stringify(['203.0.113.10']))
 const db={
   setting:{findUnique:async ({where})=>settings.has(where.key)?{value:settings.get(where.key)}:null},
   siteEvent:{count:async ()=>0,create:async ({data})=>{if(failWrite)throw new Error('DB failure');events.push(data);return data}},
 }
 const code=ts.transpileModule(fs.readFileSync(path.join(ROOT,'src/app/api/auth/demo/route.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText
 const mocks={
   'next/headers':{cookies:async ()=>cookieStore},'@/lib/db':{db},
   '@/lib/auth':{getSessionUser:async ()=>admin?{role:'ADMIN',hasAccess:true}:null,
     createPublicDemoSession:async ()=>({isPublicDemo:true,hasAccess:true,role:'USER',name:'Visitante'}),
     jsonError:(e,s)=>Response.json({error:e},{status:s})},
   '@/lib/analytics-privacy':privacy
 }
 const mod={exports:{}}
 new Function('require','module','exports',code)(id=>mocks[id]??require(id),mod,mod.exports)
 const req=new Request('https://site.test/api/auth/demo',{method:'POST',headers:{'origin':'https://site.test','Content-Type':'application/json',...(ignoredIp?{'x-vercel-forwarded-for':'203.0.113.10'}:{})},body:JSON.stringify({visitorId:'550e8400-e29b-41d4-a716-446655440000', location:'landing_test'})})
 return {route:mod.exports,events,req}
}
test('DEMOs válidas geram evento somente após sessão liberada',async()=>{
 const {route,events,req}=loadRoute(); const res=await route.POST(req)
 assert.equal(res.status,200);assert.equal(events.length,1)
 assert.equal(events[0].name,'demo_entry');assert.equal(events[0].location,'landing_test')
 assert.equal(events[0].visitorId,privacy.visitorHash('550e8400-e29b-41d4-a716-446655440000'))
})
test('Admin e navegadores e IPs excluídos não inflam DEMO',async()=>{
 for(const option of [{admin:true},{ignoredBrowser:true},{ignoredIp:true}]){
  const {route,events,req}=loadRoute(option);const res=await route.POST(req)
  assert.equal(res.status,200);assert.equal(events.length,0)
 }
})
test('Erro no contador nunca impede a DEMO de abrir',async()=>{
 const {route,req}=loadRoute({failWrite:true});const res=await route.POST(req)
 assert.equal(res.status,200);assert.equal((await res.json()).user.isPublicDemo,true)
})
test('Não aceita origem cruzada',async()=>{
 const {route,events}=loadRoute();const req=new Request('https://site.test/api/auth/demo',{method:'POST',headers:{origin:'https://fake.test'}})
 const res=await route.POST(req)
 assert.equal(res.status,403);assert.equal(events.length,0)
})
