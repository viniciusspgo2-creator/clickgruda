const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const ReactDOM = require('react-dom/server')

function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(__dirname, '..', file)
  if (cache.has(absolute)) return cache.get(absolute)
  const out = { exports: {} }
  cache.set(absolute, out.exports)
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const localRequire = name => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/')) {
      const base = 'src/' + name.slice(2)
      const filename = [base + '.ts', base + '.tsx', base + '/index.ts'].find(f => fs.existsSync(path.resolve(__dirname, '..', f)))
      return load(filename, mocks, cache)
    }
    return require(name)
  }
  new Function('require', 'module', 'exports', js)(localRequire, out, out.exports)
  cache.set(absolute, out.exports)
  return out.exports
}

test('canonical ignora variável antiga da Vercel; sitemap aponta só para o domínio final', () => {
  const old = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://clickgruda.vercel.app'
  try {
    const sitemap = load('src/app/sitemap.ts').default()
    assert.equal(sitemap.length, 10)
    for (const entry of sitemap) {
      assert.equal(new URL(entry.url).origin, 'https://www.clickgruda.com.br')
      assert.ok(!entry.url.includes('?'))
      for (const url of entry.images || []) assert.equal(new URL(url).origin, 'https://www.clickgruda.com.br')
    }
    assert.equal(new Set(sitemap.map(x => x.url)).size, sitemap.length)
  } finally { if (old === undefined) delete process.env.NEXT_PUBLIC_SITE_URL; else process.env.NEXT_PUBLIC_SITE_URL = old }
})

test('buscadores e crawlers de IA compartilham as restrições de áreas privadas', () => {
  const robots = load('src/app/robots.ts').default()
  for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'GPTBot', 'PerplexityBot']) assert.ok(robots.rules.userAgent.includes(bot))
  for (const area of ['/api/admin/', '/api/auth/', '/api/payments/', '/api/portal/']) assert.ok(robots.rules.disallow.includes(area))
  assert.ok(!robots.rules.disallow.includes('/_next/'))
  assert.equal(robots.sitemap, 'https://www.clickgruda.com.br/sitemap.xml')
})

test('identificadores aceitam meta tag oficial e rejeitam injeção de scripts', () => {
  const { normalizeMarketingValue: normalize, resolveMarketingConfig: resolve } = load('src/lib/marketing-config.ts')
  assert.equal(normalize('gsc_verification', '<meta name="google-site-verification" content="abcdef_123-XYZ" />'), 'abcdef_123-XYZ')
  assert.equal(normalize('ga4_id', 'g-1234567890'), 'G-1234567890')
  for (const [key, value] of [['meta_pixel_id', "123');alert(1)//"], ['ga4_id', '<script>x</script>'], ['official_social_urls', 'javascript:alert(1)'], ['gsc_verification', '<meta name="facebook-domain-verification" content="abcdef" />']]) assert.throws(() => normalize(key, value))
  assert.equal(resolve({ga4_id: ''}, { NEXT_PUBLIC_GA4_ID: 'G-ABCDEF1234' }).ga4Id, '')
  assert.equal(resolve({}, { NEXT_PUBLIC_GA4_ID: 'G-ABCDEF1234' }).ga4Id, 'G-ABCDEF1234')
})

test('apenas master altera integração; valor inválido nunca é salvo', async () => {
  let session = null, writes = 0, revalidations = 0
  const mocks = {
    '@/lib/auth': { getSessionUser: async () => session, jsonError: (error, status) => Response.json({error}, {status}) },
    '@/lib/settings': { getSettings: async () => ({}), setSettings: async () => { writes++ }, SETTING_KEYS: ['ga4_id','meta_pixel_id'], resolveProvider: () => null },
    'next/cache': { revalidateTag: () => revalidations++, revalidatePath: () => revalidations++ },
  }
  const route = load('src/app/api/admin/settings/route.ts', mocks)
  const request = body => new Request('https://www.clickgruda.com.br/api/admin/settings', { method:'PUT', body: JSON.stringify(body) })
  assert.equal((await route.PUT(request({meta_pixel_id:'12345678'}))).status, 401)
  session = { role:'USER' }
  assert.equal((await route.PUT(request({meta_pixel_id:'12345678'}))).status, 401)
  session = { role:'ADMIN' }
  assert.equal((await route.PUT(request({meta_pixel_id:'<script>alert(1)</script>'}))).status, 400)
  assert.equal(writes,0)
  assert.equal((await route.PUT(request({meta_pixel_id:'123456789012345',ga4_id:'G-ABCDEFG123'}))).status, 200)
  assert.equal(writes,1)
  assert.equal(revalidations,2)
})

test('conta ativa baixa 550 artes sem limite diário; login e acesso continuam exigidos', async () => {
  let session = { id:'member', role:'USER', hasAccess:true, isDemo:false }
  let count = 0
  const mocks = {
    '@/lib/auth': { getSessionUser: async () => session, jsonError: (error,status) => Response.json({error},{status}) },
    '@/lib/db': { db: { art: { findUnique: async () => ({code:1,title:'Arte teste',imageUrl:'/uploads/test.png'}), update: async () => {} }, download: { create: async () => { count++ } }, $transaction: async ops => Promise.all(ops) } },
    '@/lib/storage': { readLocalFile: async () => Buffer.from('png-test'), extToMime: () => 'image/png', slugify: () => 'arte-teste', getR2Config: async () => null },
    '@/lib/download-quota': { downloadQuota: async () => ({limit:500,used:600,today:new Set()}) },
  }
  const route = load('src/app/api/arts/[id]/download/route.ts',mocks)
  const request = new Request('https://www.clickgruda.com.br/api/arts/art/download')
  for (let i=0;i<550;i++) assert.equal((await route.GET(request,{params:Promise.resolve({id:String(i)})})).status,200)
  assert.equal(count,550)
  session = null
  assert.equal((await route.GET(request,{params:Promise.resolve({id:'1'})})).status,401)
  session = {id:'demo',role:'USER',hasAccess:true,isDemo:true}
  assert.equal((await route.GET(request,{params:Promise.resolve({id:'1'})})).status,403)
})

test('backup lista mais de 6000 artes e retorna ausência de limite', async () => {
  const route = load('src/app/api/arts/ids/route.ts', {
    '@/lib/auth': {getSessionUser:async()=>({id:'member',hasAccess:true,role:'USER'}),jsonError:()=>{}},
    '@/lib/db': {db:{art:{findMany:async query=>{
      assert.equal(query.take,undefined)
      return Array.from({length:8200},(_,i)=>({id:String(i),code:i+1,title:'Arte'}))
    },count:async()=>0}}},
  })
  const res = await route.GET(new Request('https://www.clickgruda.com.br/api/arts/ids?scope=all'))
  const data = await res.json()
  assert.equal(data.total,8200)
  assert.equal(data.limit,0)
  assert.equal(data.remaining,null)
})

test('Frases substitui Religião; estado nunca acumula categorias', () => {
  const {useStore} = load('src/lib/store.ts')
  useStore.getState().setFilter({categoryIds:['religiao']})
  useStore.getState().setFilter({categoryIds:['frases']})
  assert.deepEqual(useStore.getState().categoryIds,['frases'])
  useStore.getState().setFilter({categoryIds:['religiao','frases']})
  assert.deepEqual(useStore.getState().categoryIds,['frases'])
  useStore.getState().resetFilters()
  assert.deepEqual(useStore.getState().categoryIds,[])
})

test('rotas de compartilhamento descontinuadas devolvem 410 sem consultar banco', async () => {
  for (const [file,method] of [['src/app/api/portal/share-links/route.ts','GET'],['src/app/api/portal/share-links/route.ts','POST'],['src/app/api/portal/share-links/[id]/route.ts','DELETE'],['src/app/api/public/catalog/[token]/route.ts','GET']]) {
    const res = await load(file)[method]()
    assert.equal(res.status,410)
    assert.match(res.headers.get('X-Robots-Tag'),/noindex/)
  }
})

test('schemas refletem FAQ da página e não declaram preço antigo se o plano mudar', () => {
  const {HomeSchema} = load('src/components/geo/HomeSchema.tsx')
  const parse = price => JSON.parse(ReactDOM.renderToStaticMarkup(HomeSchema({priceCents:price})).match(/<script[^>]*>([\s\S]*)<\/script>/)[1])
  const data = parse(4790)
  assert.equal(data['@graph'].find(n=>n['@type']==='FAQPage').mainEntity.length,11)
  assert.ok(data['@graph'].find(n=>n['@type']==='FAQPage').mainEntity.some(item => item.name.includes('antes de comprar')))
  assert.equal(data['@graph'].find(n=>n['@type']==='HowTo'),undefined)
  assert.equal(parse(9900)['@graph'].find(n=>n['@type']==='Service').offers,undefined)
})

test('a plataforma é descrita como serviço digital com imagem, marca e oferta coerentes, sem dados fictícios de mercadoria', () => {
  const {HomeSchema} = load('src/components/geo/HomeSchema.tsx')
  const html = ReactDOM.renderToStaticMarkup(HomeSchema({priceCents:4790}))
  const data = JSON.parse(html.match(/<script[^>]*>([\s\S]*)<\/script>/)[1])
  assert.equal(data['@graph'].some(node => node['@type'] === 'Product'), false)
  const services = data['@graph'].filter(node => node['@type'] === 'Service')
  assert.equal(services.length, 1)
  const service = services[0]
  assert.equal(service.brand['@type'], 'Brand'); assert.equal(service.brand.name, 'Click & Gruda')
  assert.equal(service.image['@type'], 'ImageObject'); assert.ok(service.image.url.startsWith('https://www.clickgruda.com.br/uploads/'))
  assert.equal(service.image.width, 1122); assert.equal(service.image.height, 1402)
  assert.equal(service.audience['@type'], 'Audience'); assert.equal(service.availableChannel['@type'], 'ServiceChannel')
  assert.equal(service.offers.price, '47.90'); assert.equal(service.offers.priceCurrency, 'BRL')
  assert.equal(service.offers.itemOffered['@id'], service['@id'])
  assert.equal(data['@graph'].find(node => node['@type'] === 'WebPage').mainEntity['@id'], service['@id'])
  for (const field of ['aggregateRating', 'review', 'shippingDetails', 'hasMerchantReturnPolicy', 'validFrom']) assert.equal(html.includes('"' + field + '"'), false)
})

test('oferta vitalícia não reaparece no schema depois do fim da campanha', () => {
  const old = Date.now
  Date.now = () => new Date('2027-01-01T12:00:00-03:00').getTime()
  try {
    const {HomeSchema} = load('src/components/geo/HomeSchema.tsx')
    const html = ReactDOM.renderToStaticMarkup(HomeSchema({priceCents:4790}))
    const data = JSON.parse(html.match(/<script[^>]*>([\s\S]*)<\/script>/)[1])
    const service = data['@graph'].find(node => node['@type'] === 'Service')
    assert.equal(service.offers, undefined); assert.equal(service.name, 'Acesso à plataforma Click & Gruda')
  } finally { Date.now = old }
})

test('GEO publica downloads ilimitados e links atuais para guia e artigos', () => {
  const {llmsContent} = load('src/lib/llms-content.ts')
  const content = llmsContent(true)
  assert.match(content,/Downloads ilimitados/)
  assert.ok(!content.includes('vercel.app'))
  assert.ok(!content.includes('/#conhecimento'))
  assert.ok(!content.includes('/#glossario'))
  assert.match(content,/\/guia#glossario/)
})

test('tags de marketing não são renderizadas antes da autorização', () => {
  const {AnalyticsScripts} = load('src/components/geo/AnalyticsScripts.tsx', { 'next/navigation': {usePathname:()=>'/'} })
  const config = load('src/lib/marketing-config.ts').resolveMarketingConfig({meta_pixel_id:'123456789012345',ga4_id:'G-ABCDEF1234'})
  const html = ReactDOM.renderToStaticMarkup(require('react').createElement(AnalyticsScripts,{config}))
  assert.ok(!html.includes('fbevents'))
  assert.ok(!html.includes('googletagmanager'))
})

test('eventos GA4 não são enviados em dobro; cadastro e compra usam eventos corretos da Meta', () => {
  const originalWindow = global.window
  const ga = [], fb = [], dataLayer = []
  global.window = {
    localStorage:{getItem:()=>null},
    dataLayer,gtag:(...args)=>ga.push(args),fbq:(...args)=>fb.push(args),
    cgTracking:{enabled:true,mode:'ga4',pixelId:'123456789012345'},
  }
  try {
    const {track} = load('src/lib/analytics.ts')
    track('auth_submit',{method:'login',success:true})
    assert.equal(fb.length,0)
    track('auth_submit',{method:'register',success:true})
    assert.deepEqual(fb[0],['track','CompleteRegistration'])
    track('purchase',{transaction_id:'payment-123',value:47.9})
    assert.deepEqual(fb[1],['track','Purchase',{currency:'BRL',value:47.9},{eventID:'payment-123'}])
    assert.equal(ga.length,3)
    assert.equal(dataLayer.length,0)
    global.window.cgTracking.mode='gtm'
    track('begin_checkout',{value:47.9})
    assert.equal(dataLayer.length,1)
    assert.equal(ga.length,3)
  } finally { global.window=originalWindow }
})
