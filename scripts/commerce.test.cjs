const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { createHmac } = require('node:crypto')
function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(__dirname, '..', file)
  if (cache.has(absolute)) return cache.get(absolute)
  const module = { exports: {} }; cache.set(absolute, module.exports)
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const localRequire = name => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/')) { const base = 'src/' + name.slice(2); return load([base+'.ts',base+'.tsx',base+'/index.ts'].find(p=>fs.existsSync(path.resolve(__dirname,'..',p))),mocks,cache) }
    return require(name)
  }
  new Function('require','module','exports',js)(localRequire,module,module.exports)
  cache.set(absolute,module.exports); return module.exports
}
function memoryDb() {
  const settings = new Map(), payments = new Map(), users = new Map()
  let counter = 0, grants = 0
  const db = {
    setting: {
      findUnique: async ({where}) => settings.has(where.key) ? {key:where.key,value:settings.get(where.key)} : null,
      findMany: async args => [...settings].filter(([key])=>!args?.where || (args.where.key.in ? args.where.key.in.includes(key) : key.startsWith(args.where.key.startsWith))).map(([key,value])=>({key,value})),
      create: async ({data}) => { if(settings.has(data.key)) throw Object.assign(new Error('duplicate'),{code:'P2002'}); settings.set(data.key,data.value); return data },
      update: async ({where,data}) => { settings.set(where.key,data.value);return {key:where.key,...data} },
      upsert: async ({where,update,create}) => {const data=settings.has(where.key)?update:create;settings.set(where.key,data.value);return data},
    },
    payment: {
      create: async ({data}) => { const p={id:`order-${++counter}`,externalId:null,createdAt:new Date(),approvedAt:null,...data};payments.set(p.id,p);return {...p} },
      findUnique: async ({where}) => payments.has(where.id) ? {...payments.get(where.id)} : null,
      findFirst: async ({where}) => [...payments.values()].find(p=>p.provider===where.provider && (where.OR ? where.OR.some(c=>Object.entries(c).every(([k,v])=>p[k]===v)) : p.userId===where.userId && p.status===where.status)) || null,
      findMany: async ({where}) => [...payments.values()].filter(p=>where.id.in.includes(p.id)&&p.status===where.status),
      update: async ({where,data}) => {Object.assign(payments.get(where.id),data);return {...payments.get(where.id)}},
      updateMany: async ({where,data}) => { const p=payments.get(where.id); if(!p || (typeof where.status==='string' ? p.status!==where.status : where.status?.not===p.status))return {count:0};Object.assign(p,data);return {count:1} },
    },
    user: { update:async ({where,data})=>{grants++;const user={...users.get(where.id),...data};users.set(where.id,user);return user} },
    $transaction: async action => typeof action==='function'?action(db):Promise.all(action),
  }
  settings.set('price_cents','4790');settings.set('mercadopago_access_token','test-access-token');settings.set('payment_provider','MERCADOPAGO')
  return {db,settings,payments,users,get grants(){return grants}}
}
function setup(role='USER') {
  const store=memoryDb()
  const user={id:'member-1',email:'payer@example.test',name:'Cliente Teste',role,hasAccess:false,isDemo:false}
  const mocks={'@/lib/db':{db:store.db},'@/lib/auth':{getSessionUser:async()=>user,jsonError:(error,status)=>Response.json({error},{status})}}
  const cache=new Map()
  return {store,user,mocks,load:file=>load(file,mocks,cache)}
}
const request=(url,body,method='POST',headers={})=>new Request('https://www.clickgruda.com.br'+url,{method,headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)})
const coupon=overrides=>({code:'REAL10',type:'PERCENT',value:10,active:true,minSubtotalCents:0,expiresAt:null,createdAt:'2026-10-26T12:00:00Z',updatedAt:'2026-10-26T12:00:00Z',...overrides})
const snapshot=overrides=>({id:'12345',status:'APPROVED',amountCents:4311,currency:'BRL',reference:'order-1',...overrides})

test('cupom percentual e valor fixo calculam centavos sem arredondar o total incorretamente',()=>{
 const {calculateCouponQuote:q}=load('src/lib/coupons.ts',{'@/lib/db':{db:{}}})
 assert.deepEqual(q(4790,coupon()).amountCents,4311)
 assert.equal(q(4790,coupon({type:'FIXED',value:1000})).amountCents,3790)
 assert.equal(q(1999,coupon({value:15})).discountCents,300)
 assert.equal(q(4790,null).amountCents,4790)
})
test('cupom expirado, desativado, abaixo do mínimo e desconto excessivo são recusados',()=>{
 const {calculateCouponQuote:q}=load('src/lib/coupons.ts',{'@/lib/db':{db:{}}})
 for(const c of [coupon({active:false}),coupon({expiresAt:'2020-01-01'}),coupon({minSubtotalCents:5000}),coupon({type:'FIXED',value:4790})])assert.throws(()=>q(4790,c))
})
test('gerador cria código válido e valida percentual, código e datas',()=>{
 const {validateCouponInput:v}=load('src/lib/coupons.ts',{'@/lib/db':{db:{}}})
 assert.match(v({type:'PERCENT',value:10}).code,/^CG-[A-F0-9]{8}$/)
 assert.equal(v({code:' bemvindo10 ',type:'FIXED',value:1000}).code,'BEMVINDO10')
 for(const data of [{code:'<script>',value:10},{value:100},{value:1.5},{value:10,expiresAt:'invalid'}])assert.throws(()=>v(data))
})
test('apenas master cria, lista e desativa cupons; duplicado recebe 409',async()=>{
 const app=setup();const route=app.load('src/app/api/admin/coupons/route.ts')
 assert.equal((await route.POST(request('/api/admin/coupons',{code:'REAL10',value:10}))).status,401)
 app.user.role='ADMIN'
 assert.equal((await route.POST(request('/api/admin/coupons',{code:'REAL10',value:10}))).status,201)
 assert.equal((await route.POST(request('/api/admin/coupons',{code:'REAL10',value:10}))).status,409)
 const patch=app.load('src/app/api/admin/coupons/[code]/route.ts')
 assert.equal((await patch.PATCH(request('/api/admin/coupons/REAL10',{active:false},'PATCH'),{params:Promise.resolve({code:'REAL10'})})).status,200)
 assert.equal(JSON.parse(app.store.settings.get('coupon:REAL10')).active,false)
})
test('cotação usa o preço do banco e ignora total fraudado do navegador',async()=>{
 const app=setup();app.store.settings.set('coupon:REAL10',JSON.stringify(coupon()))
 const route=app.load('src/app/api/payments/quote/route.ts')
 const result=await(await route.POST(request('/api/payments/quote',{couponCode:'real10',amountCents:1,subtotalCents:1}))).json()
 assert.equal(result.subtotalCents,4790);assert.equal(result.amountCents,4311)
 app.store.settings.set('price_cents','6000')
 const fresh=await(await route.POST(request('/api/payments/quote',{couponCode:'REAL10'}))).json()
 assert.equal(fresh.amountCents,5400)
})
test('checkout recalcula cupom, registra pedido antes do gateway e envia total correto ao Mercado Pago',async()=>{
 const app=setup();app.store.settings.set('coupon:REAL10',JSON.stringify(coupon()))
 const oldFetch=global.fetch;let body,headers
 global.fetch=async(url,options)=>{assert.equal(app.store.payments.size,1);assert.ok(app.store.settings.has('checkout:order-1'));body=JSON.parse(options.body);headers=options.headers;return Response.json({id:12345,point_of_interaction:{transaction_data:{qr_code:'pix-payload',qr_code_base64:'cGl4'}}})}
 try{
  const res=await app.load('src/app/api/payments/checkout/route.ts').POST(request('/api/payments/checkout',{provider:'MERCADOPAGO',couponCode:'REAL10',amountCents:1}))
  assert.equal(res.status,200);assert.equal((await res.json()).amountCents,4311)
  assert.equal(body.transaction_amount,43.11);assert.equal(body.external_reference,'order-1')
  assert.equal(body.notification_url,'https://www.clickgruda.com.br/api/payments/webhook/mercadopago')
  assert.equal(headers['X-Idempotency-Key'],'order-1');assert.equal(app.store.payments.get('order-1').status,'PENDING');assert.equal(app.store.grants,0)
 }finally{global.fetch=oldFetch}
})
test('cupom desativado depois da cotação é recusado antes de cobrar',async()=>{
 const app=setup();app.store.settings.set('coupon:REAL10',JSON.stringify(coupon({active:false})))
 const res=await app.load('src/app/api/payments/checkout/route.ts').POST(request('/api/payments/checkout',{couponCode:'REAL10'}))
 assert.equal(res.status,400);assert.equal(app.store.payments.size,0)
})
test('pagamento com valor, referência, moeda ou ID incorretos não libera acesso',async()=>{
 const app=setup();const verification=app.load('src/lib/payment-verification.ts')
 const p={id:'order-1',externalId:'12345',amountCents:4311,provider:'MERCADOPAGO',userId:'member-1',status:'PENDING'};app.store.payments.set(p.id,p)
 for(const s of [snapshot({amountCents:1}),snapshot({reference:'another-order'}),snapshot({currency:'USD'}),snapshot({id:'99999'})])await assert.rejects(verification.synchronizePayment(p,{},s))
 assert.equal(app.store.grants,0);assert.equal(p.status,'PENDING')
})
test('aprovação é idempotente e libera a conta só uma vez',async()=>{
 const app=setup();const p={id:'order-1',externalId:'12345',amountCents:4311,provider:'MERCADOPAGO',userId:'member-1',status:'PENDING'};app.store.payments.set(p.id,p)
 const {synchronizePayment}=app.load('src/lib/payment-verification.ts')
 await Promise.all([synchronizePayment({...p},{},snapshot()),synchronizePayment({...p},{},snapshot())])
 assert.equal(p.status,'APPROVED');assert.equal(app.store.users.get('member-1').hasAccess,true);assert.equal(app.store.grants,1)
})
test('assinatura de webhook válida é aceita; assinatura falsa é rejeitada',()=>{
 const {validMercadoPagoSignature:valid}=load('src/lib/payment-verification.ts',{'@/lib/db':{db:{}},'@/lib/payments':{}})
 const secret='test-webhook-secret',ts='1793000000',id='12345',rid='request-1'
 const signature=createHmac('sha256',secret).update(`id:${id};request-id:${rid};ts:${ts};`).digest('hex')
 const req=new Request('https://example.test',{headers:{'x-request-id':rid,'x-signature':`ts=${ts},v1=${signature}`}})
 assert.equal(valid(req,id,secret),true);assert.equal(valid(req,'99999',secret),false);assert.equal(valid(new Request('https://example.test'),id,secret),false)
})
test('webhook consulta o gateway e não confia no status aprovado do body',async()=>{
 const app=setup();const p={id:'order-1',externalId:'12345',amountCents:4311,provider:'MERCADOPAGO',userId:'member-1',status:'PENDING'};app.store.payments.set(p.id,p)
 const oldFetch=global.fetch;global.fetch=async()=>Response.json({id:12345,status:'pending',transaction_amount:43.11,currency_id:'BRL',external_reference:'order-1'})
 try{
  const res=await app.load('src/app/api/payments/webhook/[provider]/route.ts').POST(request('/api/payments/webhook/mercadopago?data.id=12345',{data:{id:'12345'},status:'approved'}),{params:Promise.resolve({provider:'mercadopago'})})
  assert.equal(res.status,200);assert.equal(app.store.grants,0)
 }finally{global.fetch=oldFetch}
})
test('webhook chega antes do retorno da criação e ainda encontra o pedido por referência',async()=>{
 const app=setup();const p={id:'order-1',externalId:null,amountCents:4311,provider:'MERCADOPAGO',userId:'member-1',status:'PENDING'};app.store.payments.set(p.id,p)
 const oldFetch=global.fetch;global.fetch=async()=>Response.json({id:12345,status:'approved',transaction_amount:43.11,currency_id:'BRL',external_reference:'order-1'})
 try{const res=await app.load('src/app/api/payments/webhook/[provider]/route.ts').POST(request('/api/payments/webhook/mercadopago?data.id=12345',{data:{id:'12345'}}),{params:Promise.resolve({provider:'mercadopago'})});assert.equal(res.status,200);assert.equal(app.store.grants,1)}finally{global.fetch=oldFetch}
})
test('falha temporária do gateway devolve 503 para permitir nova notificação',async()=>{
 const app=setup();const oldFetch=global.fetch;global.fetch=async()=>{throw Error('temporary')}
 try{const res=await app.load('src/app/api/payments/webhook/[provider]/route.ts').POST(request('/api/payments/webhook/mercadopago?data.id=12345',{data:{id:'12345'}}),{params:Promise.resolve({provider:'mercadopago'})});assert.equal(res.status,503)}finally{global.fetch=oldFetch}
})
test('PIX manual registra o desconto e fica pendente de conferência',async()=>{
 const app=setup();app.store.settings.set('pix_manual_enabled','true');app.store.settings.set('pix_key','example@test.invalid');app.store.settings.set('coupon:REAL10',JSON.stringify(coupon()))
 const res=await app.load('src/app/api/payments/manual-pix/route.ts').POST(request('/api/payments/manual-pix',{couponCode:'REAL10',amountCents:1}))
 assert.equal(res.status,201);assert.equal((await res.json()).amountCents,4311);assert.equal(app.store.payments.get('order-1').status,'PENDING');assert.equal(app.store.users.get('member-1').hasAccess,undefined)
})
test('API pública de artes usa somente a última categoria, mesmo se um cliente antigo enviar duas',async()=>{
 let received
 const route=load('src/app/api/arts/route.ts',{'@/lib/auth':{getSessionUser:async()=>({id:'member',hasAccess:true}),jsonError:()=>{}},'@/lib/arts':{queryArts:async args=>{received=args;return {arts:[],total:0}}},'@/lib/search-miss':{recordSearchMiss:async()=>{}}})
 await route.GET(new Request('https://www.clickgruda.com.br/api/arts?categories=religiao,frases'))
 assert.deepEqual(received.categoryIds,['frases'])
})
test('seleção de categoria troca o filtro e limpa tags, sazonal e busca anteriores',()=>{
 const {useStore}=load('src/lib/store.ts');useStore.getState().setFilter({q:'teste',tagIds:['tag'],seasonalEventId:'natal'})
 useStore.getState().selectCategory('religiao');useStore.getState().selectCategory('frases')
 const state=useStore.getState();assert.deepEqual(state.categoryIds,['frases']);assert.deepEqual(state.tagIds,[]);assert.equal(state.q,'');assert.equal(state.seasonalEventId,null)
})
