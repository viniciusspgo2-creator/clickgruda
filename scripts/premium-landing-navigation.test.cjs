const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
function setup(user = null, freeSignup = true) {
  const calls = []
  const state = {user, setView:v=>calls.push(['view',v]), setAuthMode:v=>calls.push(['mode',v]), setPendingIntent:v=>calls.push(['intent',v])}
  const mocks = {
    react:{useEffect:()=>{}, useState:v=>[v,()=>{}]},
    'framer-motion':{useReducedMotion:()=>false},
    '@tanstack/react-query':{useQueryClient:()=>({})},
    '@/components/landing/sales-content':{SALES:{defaultPriceCents:4790,promoEndsAt:'2099-12-31'}},
    '@/components/landing/PremiumLanding':{PremiumLanding:()=>null},
    '@/lib/demo-client':{leaveDemoForAccount:async(...args)=>calls.push(['demo',args[1],args[2]])},
    sonner:{toast:{error:message=>calls.push(['error',message])}},
    '@/lib/analytics':{track:()=>{}},
    '@/lib/store':{useStore:selector=>selector(state)},
    '@/lib/types':{formatBRL:()=> 'R$ 47,90'},
    '@/hooks/use-free-signup':{useFreeSignup:()=>freeSignup},
  }
  global.window={location:{assign:url=>calls.push(['url',url])}}
  const source=fs.readFileSync(path.join(__dirname,'../src/components/views/LandingView.tsx'),'utf8')
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText
  const mod={exports:{}}
  new Function('require','module','exports',code)(id=>mocks[id]??require(id),mod,mod.exports)
  return {props:mod.exports.LandingView().props,calls}
}
test('visitante começa cadastro grátis sem intenção de cobrança',async()=>{
 const {props,calls}=setup();await props.goStart('test')
 assert.deepEqual(calls,[['mode','register'],['intent',null],['view','auth']])
 assert.equal(props.canStartTrial,true)
})
test('compra do visitante conserva intenção de checkout',async()=>{
 const {props,calls}=setup();await props.goPurchase('test')
 assert.deepEqual(calls,[['mode','register'],['intent','checkout'],['view','auth']])
})
test('membro completo volta ao hub e usuário sem acesso vai ao checkout',async()=>{
 for(const [user,expected] of [[{hasAccess:true},['view','hub']],[{hasAccess:false},['url','/comprar']],[{hasAccess:true,isTrial:true},['url','/comprar']]]){
  const {props,calls}=setup(user);await props.goPurchase('test');assert.deepEqual(calls,[expected])
 }
})
test('usuário em teste continua no hub ao começar',async()=>{
 const {props,calls}=setup({hasAccess:true,isTrial:true});await props.goStart('test')
 assert.deepEqual(calls,[['view','hub']]);assert.equal(props.hasFullAccess,false)
})
test('demo limpa identidade antes de cadastro ou login',async()=>{
 const {props,calls}=setup({hasAccess:true,isDemo:true})
 await props.goStart('test');await props.goPurchase('test');await props.goLogin()
 assert.deepEqual(calls,[['demo','register',false],['demo','register',undefined],['demo','login',false]])
})
test('oferta grátis desativada não aparece como teste grátis',()=>{
 const {props}=setup(null,false);assert.equal(props.canStartTrial,false);assert.doesNotMatch(props.startLabel,/grátis/)
})
