/** Testes de regressão Bocão. Executar: NODE_PATH=$(npm root -g) node --test scripts/bocao.test.cjs */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
function loadTs(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const mod = { exports: {} }
  new Function('require','module','exports',code)(id => Object.hasOwn(mocks,id) ? mocks[id] : require(id),mod,mod.exports)
  return mod.exports
}
const err = (message, status = 400) => Response.json({ error: message }, { status })
const codes = loadTs('src/lib/art-code.ts')
const validation = loadTs('src/lib/bocao-validation.ts')
const sampleArt = { id: 'art-1', code: 145, title: 'Bichinho feliz', imageUrl: '/uploads/arts/test.png', isRejected: false }
const sampleBocao = { id: 'bocao-1', artId: sampleArt.id, art: sampleArt, imageUrl: '/uploads/arts/bocao.png', originalKey: 'originals/bocao.png', note: 'Base da caneca' }
function request(path, method='GET', data) { return new Request('https://clickgruda.example' + path, { method, ...(data ? {headers:{'content-type':'application/json'},body:JSON.stringify(data)} : {})}) }
class UniqueError extends Error { constructor(code) { super(code); this.code = code }}
const Prisma = { PrismaClientKnownRequestError: UniqueError }
function adminRoute(db, session) {
  return loadTs('src/app/api/admin/bocoes/route.ts',{
    '@prisma/client':{ Prisma }, '@/lib/db':{db}, '@/lib/auth':{getSessionUser:async()=>session, jsonError:err}, '@/lib/art-code':codes, '@/lib/bocao-validation': validation,
  })
}
test('Bocão herda código CG e nunca recebe uma sequência de código própria', () => {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'prisma/schema.prisma'),'utf8')
  assert.match(schema, /model Bocao \{/)
  const section = schema.split('model Bocao {')[1].split('}\n')[0]
  assert.match(section, /artId\s+String\s+@unique/)
  assert.match(section, /art\s+Art.*@relation\(fields: \[artId\]/)
  assert.doesNotMatch(section, /\bcode\b\s+Int/)
  assert.equal(codes.formatArtCode(sampleArt.code),'CG-0145')
})
test('Admin não cadastra bocão sem login Master e nunca grava indevidamente', async () => {
  let created = 0
  const db={art:{findUnique:async()=>sampleArt},bocao:{create:async()=>{created++;return sampleBocao}}}
  const handler=adminRoute(db,{role:'USER'})
  const res=await handler.POST(request('/api/admin/bocoes','POST',{artId:'art-1',imageUrl:'/uploads/arts/bocao.png'}))
  assert.equal(res.status,401); assert.equal(created,0)
})
test('Admin vincula ao CG existente; duplicata é recusada', async () => {
  let lastData
  const db={art:{findUnique:async()=>sampleArt},bocao:{create:async({data})=>{lastData=data;return sampleBocao}}}
  const handler=adminRoute(db,{role:'ADMIN'})
  const res=await handler.POST(request('/api/admin/bocoes','POST',{artId:'art-1',imageUrl:'/uploads/arts/bocao.png',note:'Base'}))
  assert.equal(res.status,201)
  assert.equal(lastData.artId,'art-1')
  assert.equal(Object.hasOwn(lastData,'code'),false)
  const duplicate=adminRoute({art:db.art,bocao:{create:async()=>{throw new UniqueError('P2002')}}},{role:'ADMIN'})
  const dupRes=await duplicate.POST(request('/api/admin/bocoes','POST',{artId:'art-1',imageUrl:'/uploads/arts/bocao.png'}))
  assert.equal(dupRes.status,409)
})
test('Imagens sem URL HTTPS válida ou sem arquivo de upload são rejeitadas', () => {
  for (const url of ['http://example.com/x.png','file:///etc/passwd','https://127.0.0.1/x','/uploads/../private.png']) {
    assert.equal(validation.validBocaoImageUrl(url),false)
  }
  assert.equal(validation.validBocaoImageUrl('/uploads/arts/bocao.png'),true)
  assert.equal(validation.validBocaoImageUrl('https://cdn.example.com/bocao.webp'),true)
})
test('API de catálogo retorna mesmo código e protege prévias para o usuário Preview', async () => {
  const db={bocao:{findMany:async()=>[sampleBocao],count:async()=>1}}
  const handler=loadTs('src/app/api/bocoes/route.ts',{
    '@/lib/db':{db}, '@/lib/auth':{getSessionUser:async()=>({hasAccess:true,isDemo:true}),jsonError:err}, '@/lib/art-code':codes,
  })
  const res=await handler.GET(request('/api/bocoes?q=CG-0145'))
  const data=await res.json(); assert.equal(data.bocoes[0].code,145)
  assert.equal(data.bocoes[0].imageUrl,'/api/bocoes/bocao-1/preview')
  assert.equal(data.bocoes[0].artImageUrl,'/api/arts/art-1/preview')
  assert.equal('originalKey' in data.bocoes[0],false)
})
test('Downloads: Preview é bloqueado e assinante recebe arquivo com código CG da arte', async () => {
  const calls={ original:0, recorded:[],count:0 }
  const db={bocao:{findUnique:async()=>sampleBocao},download:{create:async({data})=>{calls.recorded.push(data);return data}},art:{update:async({where})=>{assert.equal(where.id,'art-1');calls.count++;return {}}},$transaction:async(ps)=>Promise.all(ps)}
  const mocks={
    '@/lib/db':{db},'@/lib/art-code':codes,
    '@/lib/download-quota':{downloadQuota:async()=>({limit:10,used:0,today:new Set()}),limitMessage:()=>'',nextResetBR:()=>new Date(),recordLimitHit:async()=>{}},
    '@/lib/storage':{getR2Config:async()=>({}),presignOriginalGet:async()=>{calls.original++;return 'https://cdn.example.com/signed-original'},slugify:()=> 'bichinho-feliz'},
  }
  const demo=loadTs('src/app/api/bocoes/[id]/download/route.ts',{
    ...mocks,'@/lib/auth':{getSessionUser:async()=>({id:'demo',hasAccess:true,isDemo:true}),jsonError:err},
  })
  const demoResult=await demo.GET(request('/api/bocoes/bocao-1/download'),{params:Promise.resolve({id:'bocao-1'})})
  assert.equal(demoResult.status,403); assert.equal(calls.original,0)
  const paid=loadTs('src/app/api/bocoes/[id]/download/route.ts',{
    ...mocks,'@/lib/auth':{getSessionUser:async()=>({id:'paid',hasAccess:true,isDemo:false,role:'USER'}),jsonError:err},
  })
  const result=await paid.GET(request('/api/bocoes/bocao-1/download'),{params:Promise.resolve({id:'bocao-1'})})
  assert.equal(result.status,200)
  const body=await result.json()
  assert.equal(body.filename,'CG-0145-bocao-bichinho-feliz.png')
  assert.equal(calls.recorded[0].artId,'art-1')
  assert.equal(calls.count,1)
})
test('Contador de visitas v2.2 e menus de BOCÃO permanecem disponíveis', () => {
  const admin=fs.readFileSync(path.join(__dirname,'../src/components/views/AdminView.tsx'),'utf8')
  const portal=fs.readFileSync(path.join(__dirname,'../src/components/views/PortalView.tsx'),'utf8')
  assert.match(admin,/LandingAnalyticsPanel/)
  assert.match(admin,/AdminBocoesSection/)
  assert.match(portal,/BocoesSection/)
  assert.match(portal,/onBocao=\{openBocaoByCode\}/)
  assert.ok(fs.existsSync(path.join(__dirname, '../src/app/api/admin/analytics/route.ts')))
})
