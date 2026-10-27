/* Integração com PostgreSQL temporário real; não usa DATABASE_URL de produção.
 * node scripts/e2e-member-flow.cjs (binários embedded-postgres já instalados). */
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { randomBytes } = require('node:crypto')
const { spawnSync, spawn } = require('node:child_process')
const assert = require('node:assert/strict')
const net = require('node:net')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
if (process.argv.includes('--prisma-dev')) process.env.CLICKGRUDA_TEST_PRISMA_DEV = '1'

if (process.getuid?.() === 0 && !process.env.CLICKGRUDA_TEST_DIRECTORY && process.env.CLICKGRUDA_TEST_PRISMA_DEV !== '1') {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'clickgruda-member-test-'))
  const uid = Number(spawnSync('id', ['-u', 'nobody'], { encoding: 'utf8' }).stdout.trim())
  const gid = Number(spawnSync('id', ['-g', 'nobody'], { encoding: 'utf8' }).stdout.trim())
  if (!uid || !gid) throw new Error('Usuário local de testes indisponível; não altere usuários do sistema.')
  fs.chownSync(folder, uid, gid)
  const result = spawnSync(process.execPath, [__filename], { cwd: root, uid, gid, env: { ...process.env, CLICKGRUDA_TEST_DIRECTORY: folder }, stdio: 'inherit' })
  process.exit(result.status ?? 1)
}

function load(file, mocks, cache = new Map()) {
  const absolute = path.resolve(root, file)
  if (cache.has(absolute)) return cache.get(absolute)
  const module = { exports: {} }; cache.set(absolute, module.exports)
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const localRequire = name => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/')) { const base = 'src/' + name.slice(2); return load([base + '.ts', base + '.tsx', base + '/index.ts'].find(p => fs.existsSync(path.join(root, p))), mocks, cache) }
    return require(name)
  }
  new Function('require', 'module', 'exports', js)(localRequire, module, module.exports)
  cache.set(absolute, module.exports); return module.exports
}
async function freePort() {
  const server = net.createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}
const req = (url, body, method = 'POST', ip = '203.0.113.1') => new Request('https://www.clickgruda.com.br' + url, { method, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, 'user-agent': 'Chrome Test' }, ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}) })

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres')
  const folder = process.env.CLICKGRUDA_TEST_DIRECTORY || fs.mkdtempSync(path.join(os.tmpdir(), 'clickgruda-member-test-'))
  const password = randomBytes(18).toString('hex')
  const port = await freePort()
  let pg = new EmbeddedPostgres({ databaseDir: path.join(folder, 'pg'), port, user: 'postgres', password, persistent: false, createPostgresUser: false, onLog: () => {}, onError: () => {} })
  let devUrl
  if (process.env.CLICKGRUDA_TEST_PRISMA_DEV === '1') {
    const apiPort = await freePort(), shadowPort = await freePort()
    // O teste precisa apenas de loopback; alguns runtimes não oferecem enumeração de interfaces.
    const loopbackHelper = path.join(folder, 'loopback-only.cjs')
    fs.writeFileSync(loopbackHelper, `const os = require('node:os'); const original = os.networkInterfaces; os.networkInterfaces = () => { try { return original() } catch { return { lo: [{ address: '127.0.0.1', netmask: '255.0.0.0', family: 'IPv4', mac: '00:00:00:00:00:00', internal: true, cidr: '127.0.0.1/8' }] } } }; require('node:module').syncBuiltinESMExports();`)
    let child
    pg = {
      initialise: async () => {}, createDatabase: async () => {},
      start: async () => {
        child = spawn(process.execPath, ['--require', loopbackHelper, require.resolve('prisma/build/index.js'), 'dev', '--name', 'clickgruda-test-' + randomBytes(6).toString('hex'), '--db-port', String(port), '--port', String(apiPort), '--shadow-db-port', String(shadowPort)], { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
        await new Promise((resolve, reject) => {
          let log = ''
          const timer = setTimeout(() => reject(new Error('Servidor local de teste não iniciou no prazo.')), 45000)
          const read = chunk => {
            log += chunk.toString().replace(/\x1b\[[0-9;]*m/g, '')
            const match = log.match(/postgres(?:ql)?:\/\/[^\s\x1b]+/)
            if (match) { devUrl = match[0].replace(/["')]+$/, ''); clearTimeout(timer); resolve() }
          }
          child.stdout.on('data', read); child.stderr.on('data', read)
          child.once('exit', code => { clearTimeout(timer); fs.writeFileSync(path.join(folder, 'prisma-dev.log'), log); reject(new Error(`Servidor de teste encerrou antes de iniciar (${code}). Diagnóstico local: ${path.join(folder, 'prisma-dev.log')}`)) })
        })
      },
      stop: async () => { if (child && child.exitCode === null) { child.kill('SIGTERM'); await new Promise(resolve => { child.once('exit', resolve); setTimeout(() => { child.kill('SIGKILL'); resolve() }, 5000).unref() }) } },
    }
  }
  let db
  let checks = 0
  const check = async (name, callback) => { await callback(); checks++; console.log('✔ ' + name) }
  try {
    await pg.initialise(); await pg.start(); await pg.createDatabase('clickgruda_test')
    if (devUrl) {
      // Prisma dev compartilha um backend local entre conexões. Evita que clientes
      // distintos reutilizem nomes de prepared statements durante o teste HTTP.
      const localUrl = new URL(devUrl)
      localUrl.searchParams.set('pgbouncer', 'true')
      localUrl.searchParams.set('connection_limit', '1')
      process.env.DATABASE_URL = localUrl.toString()
    } else process.env.DATABASE_URL = `postgresql://postgres:${password}@127.0.0.1:${port}/clickgruda_test?schema=public`
    process.env.AUTH_SECRET = randomBytes(32).toString('hex')
    const push = spawnSync(process.execPath, [require.resolve('prisma/build/index.js'), 'db', 'push', '--skip-generate'], { cwd: root, env: process.env, encoding: 'utf8' })
    assert.equal(push.status, 0, push.stderr || push.stdout)
    const { PrismaClient } = require('@prisma/client')
    db = new PrismaClient()
    const client = () => {
      const jar = new Map(), cookieOptions = new Map()
      const cache = new Map()
      const mocks = { '@/lib/db': { db }, 'next/headers': { cookies: async () => ({ get: name => jar.has(name) ? { value: jar.get(name) } : undefined, set: (name, value, options) => { jar.set(name, value); cookieOptions.set(name, options) }, delete: name => jar.delete(name) }) } }
      return { jar, cookieOptions, load: file => load(file, mocks, cache), route: file => load('src/app/api/' + file + '/route.ts', mocks, cache), auth: () => load('src/lib/auth.ts', mocks, cache) }
    }
    const admin = client()
    const owner = await db.user.create({ data: { name: 'Master Teste', email: 'master@test.invalid', role: 'ADMIN', password: await admin.auth().hashPassword('test-password') } })
    await admin.auth().setSessionCookie(await admin.auth().createSessionToken(owner.id))
    await db.setting.create({ data: { key: 'price_cents', value: '4790' } })
    const category = await db.category.create({ data: { name: 'Religião teste' } })
    const otherCategory = await db.category.create({ data: { name: 'Frases teste' } })
    const art = await db.art.create({ data: { title: 'Arte de fé teste', imageUrl: '/uploads/showcase/arte-paz-espirito.webp', originalKey: 'private/original.png', categoryId: category.id, isSelected: true } })
    await db.art.create({ data: { title: 'Frase teste', imageUrl: '/uploads/showcase/arte-flork-casal-nesmo.webp', categoryId: otherCategory.id, isLaunch: true } })
    const demo = client(), secondDemo = client()
    await check('demo cria sessão assinada e independente, sem criar usuários ou aparelhos no banco', async () => {
      const before = await db.user.count()
      const a = await (await demo.route('auth/demo').POST(req('/api/auth/demo', { role: 'ADMIN', hasAccess: true }))).json()
      const b = await (await secondDemo.route('auth/demo').POST(req('/api/auth/demo', {}))).json()
      assert.equal(a.user.role, 'USER'); assert.equal(a.user.isDemo, true); assert.equal(a.user.isPublicDemo, true)
      assert.notEqual(a.user.id, b.user.id)
      assert.equal((await demo.auth().getSessionUser()).id, a.user.id)
      assert.equal(await db.user.count(), before); assert.equal(await db.userSession.count(), 0)
      assert.equal(demo.cookieOptions.get('cg_session').httpOnly, true); assert.equal(demo.cookieOptions.get('cg_session').maxAge, 7200)
    })
    await check('demo rejeita cookie adulterado e entrada enviada de outra origem', async () => {
      const token = secondDemo.jar.get('cg_session'); secondDemo.jar.set('cg_session', token.slice(0, -5) + 'XXXXX')
      assert.equal(await secondDemo.auth().getSessionUser(), null)
      const foreign = new Request('https://www.clickgruda.com.br/api/auth/demo', { method: 'POST', headers: { Origin: 'https://outro.invalid' } })
      assert.equal((await secondDemo.route('auth/demo').POST(foreign)).status, 403)
    })
    await check('busca e categoria da demo retornam somente URLs protegidas, sem chave de original', async () => {
      const response = await demo.route('arts').GET(req(`/api/arts?categories=${category.id}&q=fé`, {}, 'GET'))
      const data = await response.json(); assert.equal(data.arts.length, 1); assert.equal(data.arts[0].id, art.id)
      assert.equal(data.arts[0].imageUrl, `/api/arts/${art.id}/preview`); assert.ok(!JSON.stringify(data).includes('private/original'))
      const next = await (await demo.route('arts').GET(req(`/api/arts?categories=${category.id},${otherCategory.id}`, {}, 'GET'))).json()
      assert.equal(next.arts.length, 1); assert.equal(next.arts[0].category.id, otherCategory.id)
    })
    await check('prévia entregue é WebP reduzido e processado; download direto e gravações da demo são recusados', async () => {
      const preview = await demo.route('arts/[id]/preview').GET(req(`/api/arts/${art.id}/preview`, {}, 'GET'), { params: Promise.resolve({ id: art.id }) })
      assert.equal(preview.status, 200); assert.equal(preview.headers.get('Content-Type'), 'image/webp')
      const bytes = Buffer.from(await preview.arrayBuffer()); const sharp = require('sharp')
      const meta = await sharp(bytes).metadata(); assert.equal(meta.width, 900); assert.equal(meta.height, 420)
      assert.notDeepEqual(bytes, fs.readFileSync(path.join(root, 'public/uploads/showcase/arte-paz-espirito.webp')))
      fs.writeFileSync(path.join(folder, 'protected-preview.webp'), bytes)
      assert.equal((await demo.route('arts/[id]/download').GET(req('/download', {}, 'GET'), { params: Promise.resolve({ id: art.id }) })).status, 403)
      assert.equal((await demo.route('favorites').POST(req('/favorites', { artId: art.id }))).status, 403)
      assert.equal((await demo.route('payments/manual-pix').POST(req('/manual', {}))).status, 403)
      assert.equal((await demo.route('suggestions').POST(req('/suggestions', { message: 'Sugestão de teste' }))).status, 403)
      assert.equal(await db.favorite.count(), 0); assert.equal(await db.payment.count(), 0)
    })
    const member = client()
    let memberId
    const signup = { name: 'Cliente Integração', email: 'cliente@test.invalid', password: 'test-password', whatsapp: '(11) 99999-8888' }
    await check('cadastro exige WhatsApp, salva contato e horário, e mantém acesso bloqueado antes da ativação', async () => {
      const missing = await member.route('auth/register').POST(req('/register', { ...signup, whatsapp: '' })); assert.equal(missing.status, 400)
      const response = await member.route('auth/register').POST(req('/register', signup)); assert.equal(response.status, 200)
      const data = await response.json(); memberId = data.user.id; assert.equal(data.user.hasAccess, false)
      const profile = JSON.parse((await db.setting.findUnique({ where: { key: 'member-profile:' + memberId } })).value)
      assert.equal(profile.whatsapp, '5511999998888'); assert.equal(profile.extraDevices, 0); assert.ok(Number.isFinite(Date.parse(profile.registeredAt)))
      assert.equal((await member.route('arts').GET(req('/arts', {}, 'GET'))).status, 403)
    })
    await check('contato do cliente só aparece no master, junto da data completa de cadastro', async () => {
      assert.equal((await member.route('admin/users').GET()).status, 401)
      const users = await (await admin.route('admin/users').GET()).json()
      const row = users.users.find(user => user.id === memberId)
      assert.equal(row.whatsapp, '5511999998888'); assert.ok(Number.isFinite(Date.parse(row.createdAt)))
    })
    let orderId
    await check('solicitação de atendimento funciona sem chave PIX, respeita cupom e não libera acesso', async () => {
      assert.equal((await admin.route('admin/coupons').POST(req('/coupon', { code: 'SUPORTE10', type: 'FIXED', value: 1000 }))).status, 201)
      const response = await member.route('payments/manual-pix').POST(req('/manual', { couponCode: 'SUPORTE10', amountCents: 1 }))
      assert.equal(response.status, 201); const data = await response.json(); orderId = data.paymentId; assert.equal(data.amountCents, 3790)
      const repeat = await (await member.route('payments/manual-pix').POST(req('/manual', { couponCode: 'SUPORTE10' }))).json()
      assert.equal(repeat.paymentId, orderId); assert.equal(await db.payment.count(), 1)
      assert.equal((await db.user.findUnique({ where: { id: memberId } })).hasAccess, false)
    })
    await check('somente o master aprova pagamento e ativa a conta; cupom passa a contar uma compra', async () => {
      const params = { params: Promise.resolve({ id: orderId }) }
      assert.equal((await member.route('admin/payments/[id]').PATCH(req('/approve', {}, 'PATCH'), params)).status, 401)
      assert.equal((await admin.route('admin/payments/[id]').PATCH(req('/approve', {}, 'PATCH'), params)).status, 200)
      assert.equal((await member.auth().getSessionUser()).hasAccess, true)
      const result = await (await admin.route('admin/coupons').GET()).json(); assert.equal(result.coupons[0].uses, 1)
    })
    const another = client()
    await check('mesmo navegador refaz login sem alerta; outro aparelho encerra a sessão anterior e informa o limite', async () => {
      const same = await (await member.route('auth/login').POST(req('/login', signup))).json(); assert.equal(same.sessionNotice, null)
      const other = await (await another.route('auth/login').POST(req('/login', signup, 'POST', '198.51.100.2'))).json()
      assert.equal(other.sessionNotice, 'NEW_LOGIN'); assert.equal(other.deviceLimit, 1)
      const expired = await (await member.route('auth/me').GET()).json(); assert.equal(expired.user, null); assert.equal(expired.reason, 'SESSION_REVOKED')
      assert.equal(await db.userSession.count({ where: { userId: memberId, revokedAt: null } }), 1)
    })
    await check('adicional autorizado permite duas sessões; reduzir novamente encerra a excedente', async () => {
      const params = { params: Promise.resolve({ id: memberId }) }
      assert.equal((await admin.route('admin/users/[id]').PATCH(req('/user', { extraDevices: 1 }, 'PATCH'), params)).status, 200)
      const login = await (await member.route('auth/login').POST(req('/login', signup))).json(); assert.equal(login.sessionNotice, null)
      assert.equal(await db.userSession.count({ where: { userId: memberId, revokedAt: null } }), 2)
      await admin.route('admin/users/[id]').PATCH(req('/user', { extraDevices: 0 }, 'PATCH'), params)
      assert.equal(await db.userSession.count({ where: { userId: memberId, revokedAt: null } }), 1)
    })
    if (process.env.CLICKGRUDA_TEST_PRISMA_DEV !== '1') await check('logins concorrentes respeitam a regra de uma sessão usando transação serializável real', async () => {
      const a = client(), b = client()
      const responses = await Promise.all([a.route('auth/login').POST(req('/login', signup)), b.route('auth/login').POST(req('/login', signup))])
      assert.deepEqual(responses.map(response => response.status), [200, 200])
      assert.equal(await db.userSession.count({ where: { userId: memberId, revokedAt: null } }), 1)
      const sessions = await Promise.all([a.auth().getSessionUser(), b.auth().getSessionUser()])
      assert.equal(sessions.filter(Boolean).length, 1)
    })
    else console.log('ℹ Concorrência entre backends: executar este caso com PostgreSQL nativo; Prisma dev usa um backend local compartilhado.')
    await check('bloqueio pelo master encerra sessões, impede login e não é desfeito por pagamento', async () => {
      const params = { params: Promise.resolve({ id: memberId }) }
      await admin.route('admin/users/[id]').PATCH(req('/user', { blocked: true }, 'PATCH'), params)
      const data = await (await member.route('auth/me').GET()).json(); assert.equal(data.reason, 'ACCOUNT_BLOCKED')
      assert.equal((await another.route('auth/login').POST(req('/login', signup))).status, 403)
      const late = await db.payment.create({ data: { userId: memberId, provider: 'MANUAL_PIX', amountCents: 4790 } })
      await admin.route('admin/payments/[id]').PATCH(req('/approve', {}, 'PATCH'), { params: Promise.resolve({ id: late.id }) })
      assert.equal((await db.user.findUnique({ where: { id: memberId } })).status, 'BLOCKED')
      await admin.route('admin/users/[id]').PATCH(req('/user', { blocked: false }, 'PATCH'), params)
      assert.equal((await another.route('auth/login').POST(req('/login', signup))).status, 200)
    })
    await check('conta ativa não é substituída ao clicar na demonstração; logout encerra apenas o aparelho atual', async () => {
      const token = another.jar.get('cg_session')
      const data = await (await another.route('auth/demo').POST(req('/demo', {}))).json()
      assert.equal(data.user.id, memberId); assert.equal(another.jar.get('cg_session'), token)
      await another.route('auth/logout').POST()
      assert.equal(await another.auth().getSessionUser(), null)
      assert.equal(await db.userSession.count({ where: { userId: memberId, revokedAt: null } }), 0)
    })
    await check('demo pode sair para criar conta própria, e nenhum cadastro recebeu acesso automático', async () => {
      await demo.route('auth/logout').POST()
      const created = await demo.route('auth/register').POST(req('/register', { ...signup, email: 'ex-demo@test.invalid' }))
      assert.equal(created.status, 200); assert.equal((await created.json()).user.hasAccess, false)
    })
    if (process.env.CLICKGRUDA_TEST_HTTP === '1') await check('servidor de produção aplica cookie seguro, preview protegido, cadastro e ativação manual via HTTP', async () => {
      const webPort = await freePort()
      const web = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-p', String(webPort), '-H', '127.0.0.1'], { cwd: root, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] })
      const base = `http://127.0.0.1:${webPort}`
      let logs = ''
      web.stdout.on('data', chunk => { logs += chunk }); web.stderr.on('data', chunk => { logs += chunk })
      const http = async (url, body, cookie, method = 'POST') => {
        const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(method !== 'GET' ? { body: JSON.stringify(body || {}) } : {}) })
        assert.ok(response.status < 500, `${method} ${url}: HTTP ${response.status}; diagnóstico em ${path.join(folder, 'next-http.log')}`)
        return response
      }
      try {
        let ready = false
        for (let attempt = 0; attempt < 100; attempt++) {
          try { if ((await fetch(base + '/robots.txt')).ok) { ready = true; break } } catch { /* iniciando */ }
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        assert.equal(ready, true, 'Servidor de produção deve iniciar')
        const start = await http('/api/auth/demo', {})
        assert.equal(start.status, 200)
        const cookieHeader = start.headers.get('set-cookie')
        assert.match(cookieHeader, /HttpOnly/i); assert.match(cookieHeader, /Secure/i); assert.match(cookieHeader, /SameSite=lax/i)
        const demoCookie = cookieHeader.split(';')[0]
        const arts = await (await http('/api/arts', null, demoCookie, 'GET')).json()
        assert.equal(arts.arts.length, 2); assert.ok(arts.arts.every(row => row.imageUrl === `/api/arts/${row.id}/preview`))
        const preview = await http(`/api/arts/${art.id}/preview`, null, demoCookie, 'GET'); assert.equal(preview.status, 200); assert.equal(preview.headers.get('Content-Type'), 'image/webp')
        assert.equal((await http(`/api/arts/${art.id}/download`, null, demoCookie, 'GET')).status, 403)
        const signupResponse = await http('/api/auth/register', { ...signup, email: 'http@test.invalid' })
        assert.equal(signupResponse.status, 200)
        const memberCookie = signupResponse.headers.get('set-cookie').split(';')[0]
        assert.equal((await http('/api/arts', null, memberCookie, 'GET')).status, 403)
        const orderResponse = await http('/api/payments/manual-pix', { couponCode: 'SUPORTE10' }, memberCookie)
        assert.equal(orderResponse.status, 201); const requested = await orderResponse.json(); assert.equal(requested.amountCents, 3790)
        const ownerCookie = 'cg_session=' + admin.jar.get('cg_session')
        assert.equal((await http(`/api/admin/payments/${requested.paymentId}`, {}, ownerCookie, 'PATCH')).status, 200)
        const account = await (await http('/api/auth/me', null, memberCookie, 'GET')).json(); assert.equal(account.user.hasAccess, true)
        assert.equal((await http(`/api/arts/${art.id}/download`, null, memberCookie, 'GET')).status, 200)
        const takeover = await (await http('/api/auth/login', { ...signup, email: 'http@test.invalid' })).json(); assert.equal(takeover.sessionNotice, 'NEW_LOGIN')
        const old = await (await http('/api/auth/me', null, memberCookie, 'GET')).json(); assert.equal(old.reason, 'SESSION_REVOKED')
      } finally {
        web.kill('SIGTERM'); await new Promise(resolve => { web.once('exit', resolve); setTimeout(() => { web.kill('SIGKILL'); resolve() }, 5000).unref() })
        fs.writeFileSync(path.join(folder, 'next-http.log'), logs)
      }
    })
    console.log(`E2E_REAL_POSTGRES: ${checks} fluxos aprovados. Prévia de teste: ${path.join(folder, 'protected-preview.webp')}`)
  } finally {
    if (db) await db.$disconnect()
    await pg.stop().catch(() => {})
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
