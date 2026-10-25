/** Run with: node --test scripts/analytics-dashboard.test.cjs (requires devDependency typescript) */
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function loadTs(file, mocks = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
  const code = ts.transpileModule(source, {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText
  const mod = { exports: {} }
  const inject = spec => Object.hasOwn(mocks, spec) ? mocks[spec] : require(spec)
  new Function('require', 'module', 'exports', code)(inject, mod, mod.exports)
  return mod.exports
}

function fakeDb() {
  const settings = new Map()
  const events = []
  const db = {
    setting: {
      findUnique: async ({ where }) => settings.has(where.key) ? { value: settings.get(where.key) } : null,
      upsert: async ({ create, update }) => { settings.set(create.key, update.value); return { key: create.key, value: update.value } },
    },
    siteEvent: {
      count: async () => 0,
      create: async ({ data }) => { events.push(data); return data },
    },
    $queryRaw: async (strings) => {
      const sql = strings.join('?')
      if (sql.includes('AS "uniqueVisitors"') && !sql.includes('to_char')) return [{ views: 7n, uniqueVisitors: 3n, clicks: 2n, faq: 1n, scrolls: 0n }]
      if (sql.includes('to_char')) return [{ day: '2026-10-24', views: 7n, uniqueVisitors: 3n, clicks: 2n }]
      return [{ location: 'header', count: 2n }]
    },
  }
  return { settings, events, db }
}
function fakeCookies() {
  const values = new Map()
  return { values, get: key => values.has(key) ? { value: values.get(key) } : undefined, has: key => values.has(key), set: (key, value) => values.set(key, value), delete: key => values.delete(key) }
}

const privacy = loadTs('src/lib/analytics-privacy.ts')
const admin = { id: 'test', role: 'ADMIN' }
const req = (url, body, extras = {}) => new Request(url, { method: 'POST', headers: { origin: new URL(url).origin, 'content-type': 'application/json', ...extras }, body: JSON.stringify(body) })

// Testa uma sequência real das rotas sem conectar ao Neon.
test('Admin ativa e desativa exclusão do navegador, com histórico corretamente filtrável', async () => {
  const { db, settings } = fakeDb()
  const cookieStore = fakeCookies()
  const { POST } = loadTs('src/app/api/admin/analytics/ignore/route.ts', {
    'next/headers': { cookies: async () => cookieStore }, '@/lib/db': { db },
    '@/lib/auth': { getSessionUser: async () => admin, jsonError: (e, code) => Response.json({ error: e }, { status: code }) },
    '@/lib/analytics-privacy': privacy,
  })
  const visitorId = '550e8400-e29b-41d4-a716-446655440000'
  const url = 'https://example.com/api/admin/analytics/ignore'
  const a = await POST(req(url, { action: 'browser', enabled: true, visitorId }))
  assert.equal(a.status, 200)
  assert.equal(privacy.isInternalCookie(cookieStore.values.get(privacy.ANALYTICS_IGNORE_COOKIE)), true)
  assert.ok(JSON.parse(settings.get(privacy.ANALYTICS_IGNORE_VISITORS_KEY)).includes(privacy.visitorHash(visitorId)))
  const b = await POST(req(url, { action: 'browser', enabled: false, visitorId }))
  assert.equal(b.status, 200)
  assert.equal(cookieStore.values.has(privacy.ANALYTICS_IGNORE_COOKIE), false)
  assert.equal(JSON.parse(settings.get(privacy.ANALYTICS_IGNORE_VISITORS_KEY)).length, 0)
})

test('Eventos de navegador interno e usuário admin não são contabilizados', async () => {
  const { db, events } = fakeDb()
  const cookieStore = fakeCookies()
  const visitorId = '550e8400-e29b-41d4-a716-446655440000'
  const { POST } = loadTs('src/app/api/analytics/track/route.ts', {
    'next/headers': { cookies: async () => cookieStore }, '@/lib/db': { db },
    '@/lib/auth': { getSessionUser: async () => admin }, '@/lib/analytics-privacy': privacy,
  })
  const url = 'https://example.com/api/analytics/track'
  cookieStore.set(privacy.ANALYTICS_IGNORE_COOKIE, privacy.signedInternalCookie())
  assert.equal((await POST(req(url, { event: 'landing_view', visitorId }))).status, 200)
  cookieStore.delete(privacy.ANALYTICS_IGNORE_COOKIE)
  cookieStore.set('cg_session', 'mock')
  assert.equal((await POST(req(url, { event: 'landing_view', visitorId }))).status, 200)
  assert.equal(events.length, 0)
})

test('IP manualmente ignorado não gera nova visita', async () => {
  const { db, settings, events } = fakeDb()
  const cookieStore = fakeCookies()
  const { POST } = loadTs('src/app/api/analytics/track/route.ts', {
    'next/headers': { cookies: async () => cookieStore }, '@/lib/db': { db },
    '@/lib/auth': { getSessionUser: async () => null }, '@/lib/analytics-privacy': privacy,
  })
  settings.set(privacy.ANALYTICS_IGNORE_IPS_KEY, JSON.stringify(['203.0.113.10']))
  const url = 'https://example.com/api/analytics/track'
  const event = { event: 'landing_view', visitorId: '550e8400-e29b-41d4-a716-446655440000' }
  await POST(req(url, event, { 'x-vercel-forwarded-for': '203.0.113.10' }))
  assert.equal(events.length, 0)
})

test('API de relatório responde filtros e preserva números agregados', async () => {
  const { db } = fakeDb()
  const cookieStore = fakeCookies()
  const { GET } = loadTs('src/app/api/admin/analytics/route.ts', {
    'next/headers': { cookies: async () => cookieStore }, '@/lib/db': { db },
    '@/lib/auth': { getSessionUser: async () => admin, jsonError: (e, code) => Response.json({ error: e }, { status: code }) },
    '@/lib/analytics-privacy': privacy,
  })
  const custom = await GET(new Request('https://example.com/api/admin/analytics?range=custom&start=2026-10-23&end=2026-10-24'))
  assert.equal(custom.status, 200)
  const result = await custom.json()
  assert.equal(result.views, 7)
  assert.equal(result.uniqueVisitors, 3)
  assert.equal(result.clicks, 2)
  assert.equal(result.trend.length, 2)
  assert.equal(result.trend[1].day, '2026-10-24')
  assert.equal(result.clickRate, 28.6)
  const invalid = await GET(new Request('https://example.com/api/admin/analytics?range=custom&start=2026-13-50&end=2026-10-24'))
  assert.equal(invalid.status, 400)
  const tooLong = await GET(new Request('https://example.com/api/admin/analytics?range=custom&start=2024-01-01&end=2026-10-24'))
  assert.equal(tooLong.status, 400)
})

test('Somente ADMIN consegue mudar exclusões', async () => {
  const { db, settings } = fakeDb()
  const { POST } = loadTs('src/app/api/admin/analytics/ignore/route.ts', {
    'next/headers': { cookies: async () => fakeCookies() }, '@/lib/db': { db },
    '@/lib/auth': { getSessionUser: async () => ({ role: 'USER' }), jsonError: (e, code) => Response.json({ error: e }, { status: code }) },
    '@/lib/analytics-privacy': privacy,
  })
  const response = await POST(req('https://example.com/api/admin/analytics/ignore', { action: 'ips', ips: ['203.0.113.10'] }))
  assert.equal(response.status, 401)
  assert.equal(settings.size, 0)
})
