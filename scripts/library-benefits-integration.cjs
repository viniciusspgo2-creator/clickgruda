/* PostgreSQL local e descartável. Nunca usa DATABASE_URL externa.
 * STUDIO_SOURCE=/checkout/clickteste node scripts/library-benefits-integration.cjs
 * --browser também compila e verifica o formulário real em Chromium. */
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  net = require('node:net')
const { promisify } = require('node:util'),
  { execFile, spawn } = require('node:child_process'),
  run = promisify(execFile)
const { randomBytes, randomUUID } = require('node:crypto'),
  assert = require('node:assert/strict'),
  ts = require('typescript')
const root = path.resolve(__dirname, '..'),
  studioRoot = process.env.STUDIO_SOURCE
if (
  !studioRoot ||
  !fs.existsSync(path.join(studioRoot, 'prisma/schema.prisma'))
)
  throw Error(
    'STUDIO_SOURCE deve apontar para o checkout do CLICKTESTE revisado.',
  )
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'library-benefits-'))
const load = (file, mocks, base = root, cache = new Map()) => {
  const absolute = path.resolve(base, file)
  if (cache.has(absolute)) return cache.get(absolute)
  const module = { exports: {} }
  cache.set(absolute, module.exports)
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const localRequire = (name) => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/') || name.startsWith('.')) {
      const target = name.startsWith('@/')
        ? path.join(base, 'src', name.slice(2))
        : path.resolve(path.dirname(absolute), name)
      const resolved = [
        target + '.ts',
        target + '.tsx',
        target + '/index.ts',
      ].find(fs.existsSync)
      return load(resolved, mocks, base, cache)
    }
    return require(name)
  }
  new Function('require', 'module', 'exports', js)(
    localRequire,
    module,
    module.exports,
  )
  cache.set(absolute, module.exports)
  return module.exports
}
async function freePort() {
  const s = net.createServer()
  await new Promise((r) => s.listen(0, '127.0.0.1', r))
  const p = s.address().port
  await new Promise((r) => s.close(r))
  return p
}
const request = (
  url,
  body,
  method = 'POST',
  origin = 'https://www.clickgruda.com.br',
) =>
  new Request('https://www.clickgruda.com.br' + url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      'x-forwarded-for': '203.0.113.54',
      'user-agent': 'Chromium QA',
    },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body ?? {}) }),
  })
let db,
  studioDb,
  pg,
  server,
  checks = 0
const check = async (name, callback) => {
  await callback()
  checks++
  console.log('PASS ' + name)
}
async function main() {
  process.env.NODE_ENV = 'test'
  const { default: EmbeddedPostgres } = await import('embedded-postgres')
  const password = randomBytes(24).toString('hex'),
    port = await freePort()
  pg = new EmbeddedPostgres({
    databaseDir: path.join(folder, 'postgres'),
    port,
    user: 'postgres',
    password,
    persistent: false,
    createPostgresUser: false,
    onLog: () => {},
    onError: () => {},
  })
  await pg.initialise()
  await pg.start()
  await pg.createDatabase('library_qa')
  await pg.createDatabase('studio_qa')
  const url = `postgresql://postgres:${password}@127.0.0.1:${port}/library_qa`,
    studioUrl = `postgresql://postgres:${password}@127.0.0.1:${port}/studio_qa`
  process.env.DATABASE_URL = url
  process.env.AUTH_SECRET = randomBytes(32).toString('hex')
  process.env.XDG_CACHE_HOME = path.join(folder, 'cache')
  process.env.STUDIO_LIBRARY_WEBHOOK_SECRET = randomBytes(32).toString('hex')
  process.env.STUDIO_API_ORIGIN = 'https://studio.test.invalid'
  process.env.LIBRARY_FREE_SIGNUP_ENABLED = '0'
  process.env.LIBRARY_STUDIO_INTEGRATION_ENABLED = '0'
  process.env.STUDIO_LIBRARY_INTEGRATION_ENABLED = '1'
  const cli = require.resolve('prisma/build/index.js')
  await run(process.execPath, [cli, 'db', 'push', '--skip-generate'], {
    cwd: root,
    env: process.env,
  })
  const studioSchema = fs
    .readFileSync(path.join(studioRoot, 'prisma/schema.prisma'), 'utf8')
    .replace(
      'generator client {',
      'generator client {\n output = ' +
        JSON.stringify(path.join(root, 'node_modules/.studio-qa-client')),
    )
  fs.writeFileSync(
    path.join(folder, 'package.json'),
    JSON.stringify({ name: 'isolated-studio-qa', private: true }),
  )
  fs.symlinkSync(
    path.join(root, 'node_modules'),
    path.join(folder, 'node_modules'),
    'dir',
  )
  const studioFile = path.join(folder, 'studio.prisma')
  fs.writeFileSync(studioFile, studioSchema)
  await run(process.execPath, [cli, 'generate', '--schema', studioFile], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: studioUrl },
  })
  await run(
    process.execPath,
    [cli, 'db', 'push', '--skip-generate', '--schema', studioFile],
    { cwd: root, env: { ...process.env, DATABASE_URL: studioUrl } },
  )
  const { PrismaClient } = require('@prisma/client'),
    { PrismaClient: StudioClient } = require(
      path.join(root, 'node_modules/.studio-qa-client'),
    )
  db = new PrismaClient({ datasources: { db: { url } } })
  studioDb = new StudioClient({ datasources: { db: { url: studioUrl } } })
  const sessionClient = () => {
    const jar = new Map(),
      cache = new Map(),
      mocks = {
        '@/lib/db': { db },
        'next/headers': {
          cookies: async () => ({
            get: (key) => (jar.has(key) ? { value: jar.get(key) } : undefined),
            set: (key, value) => jar.set(key, value),
            delete: (key) => jar.delete(key),
          }),
        },
      }
    return {
      jar,
      load: (file) => load(file, mocks, root, cache),
      route: (name) =>
        load('src/app/api/' + name + '/route.ts', mocks, root, cache),
    }
  }
  const admin = sessionClient(),
    guest = sessionClient()
  const auth = admin.load('src/lib/auth.ts')
  const owner = await db.user.create({
    data: {
      name: 'Master QA',
      email: 'master@qa.invalid',
      role: 'ADMIN',
      password: await auth.hashPassword('qa-password-123'),
    },
  })
  await auth.setSessionCookie(await auth.createSessionToken(owner.id))
  await db.setting.create({
    data: { key: 'qa-preserve-master-setting', value: 'keep' },
  })
  const masterBefore = await db.user.findUnique({ where: { id: owner.id } })
  const customer = await db.user.create({
    data: {
      name: 'Cliente Manual QA',
      email: 'manual@qa.invalid',
      password: await auth.hashPassword('qa-password-123'),
      hasAccess: true,
      accessSource: 'ADMIN_GRANT',
      accessType: 'MANUAL',
    },
  })
  const baseline = await db.user.create({
    data: {
      name: 'Cliente Cakto QA',
      email: 'cakto@qa.invalid',
      password: 'qa-hash',
    },
  })
  await db.payment.create({
    data: {
      userId: baseline.id,
      provider: 'CAKTO',
      amountCents: 4790,
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  })
  const payload = {
    requestId: randomUUID(),
    userId: customer.id,
    amountCents: 4790,
    paidAt: new Date(Date.now() - 3600000).toISOString(),
    method: 'PIX',
    reference: 'PIX-QA-001',
    note: 'Recebimento conferido',
    activateAccess: false,
    confirmedOutsideGateway: true,
  }
  const manual = admin.route('admin/payments/manual'),
    anonymousManual = guest.route('admin/payments/manual')
  await check(
    'admin obrigatório e origem conferida no lançamento',
    async () => {
      assert.equal(
        (
          await anonymousManual.POST(
            request('/api/admin/payments/manual', payload),
          )
        ).status,
        401,
      )
      assert.equal(
        (
          await manual.POST(
            request(
              '/api/admin/payments/manual',
              payload,
              'POST',
              'https://outro.invalid',
            ),
          )
        ).status,
        403,
      )
    },
  )
  await check(
    'rejeita valores inválidos, privilégios extras e data futura',
    async () => {
      for (const extra of [
        { amountCents: -1 },
        { amountCents: 1.5 },
        { confirmedOutsideGateway: false },
        { role: 'ADMIN' },
        { paidAt: new Date(Date.now() + 86400000).toISOString() },
      ])
        assert.equal(
          (
            await manual.POST(
              request('/api/admin/payments/manual', { ...payload, ...extra }),
            )
          ).status,
          400,
        )
    },
  )
  let paymentId
  await check(
    '6 envios simultâneos contam um único recebimento e somam com Cakto',
    async () => {
      const replies = await Promise.all(
        Array.from({ length: 6 }, () =>
          manual.POST(request('/api/admin/payments/manual', payload)),
        ),
      )
      assert.equal(replies.filter((r) => r.status === 201).length, 1)
      assert.equal(replies.filter((r) => r.status === 200).length, 5)
      paymentId = (await replies[0].json()).paymentId
      assert.equal(
        await db.payment.count({ where: { provider: 'ADMIN_MANUAL' } }),
        1,
      )
      const stats = await (await admin.route('admin/stats').GET()).json()
      assert.equal(stats.stats.revenueCents, 9580)
      assert.equal(stats.stats.approvedPayments, 2)
      const receipt = JSON.parse(
        (
          await db.setting.findUnique({
            where: { key: 'manual-receipt:' + payload.requestId },
          })
        ).value,
      )
      assert.equal(receipt.adminId, owner.id)
      assert.equal(receipt.paymentId, paymentId)
    },
  )
  await check(
    'bloqueia novo lançamento do mesmo cliente/comprovante e requestId alterado',
    async () => {
      for (const extra of [
        { requestId: randomUUID(), reference: 'QA-OUTRA' },
        { requestId: randomUUID(), userId: baseline.id },
        { amountCents: 5000 },
      ])
        assert.equal(
          (
            await manual.POST(
              request('/api/admin/payments/manual', { ...payload, ...extra }),
            )
          ).status,
          409,
        )
    },
  )
  await check(
    'anula sem apagar histórico nem revogar acesso e não permite reaprovação genérica',
    async () => {
      const route = admin.route('admin/payments/manual/[id]')
      for (let i = 0; i < 2; i++)
        assert.equal(
          (
            await route.PATCH(
              request('/api/admin/payments/manual/' + paymentId, {
                reason: 'Valor conferido incorretamente',
              }),
              { params: Promise.resolve({ id: paymentId }) },
            )
          ).status,
          200,
        )
      assert.equal(
        (await db.payment.findUnique({ where: { id: paymentId } })).status,
        'VOIDED',
      )
      assert.equal(
        (await db.user.findUnique({ where: { id: customer.id } })).hasAccess,
        true,
      )
      assert.equal(
        (
          await admin
            .route('admin/payments/[id]')
            .PATCH(request('/api/admin/payments/' + paymentId, {}), {
              params: Promise.resolve({ id: paymentId }),
            })
        ).status,
        400,
      )
      assert.equal(
        (await (await admin.route('admin/stats').GET()).json()).stats
          .revenueCents,
        4790,
      )
    },
  )
  await check(
    'corrige recebimento anulado preservando ambos os lançamentos',
    async () => {
      const r = await manual.POST(
        request('/api/admin/payments/manual', {
          ...payload,
          requestId: randomUUID(),
          amountCents: 4500,
        }),
      )
      assert.equal(r.status, 201)
      assert.equal(
        await db.payment.count({ where: { userId: customer.id } }),
        2,
      )
      assert.equal(
        (await (await admin.route('admin/stats').GET()).json()).stats
          .revenueCents,
        9290,
      )
    },
  )
  await check(
    'cadastro com recurso desligado mantém comportamento anterior',
    async () => {
      const r = await guest
        .route('auth/register')
        .POST(
          request('/api/auth/register', {
            name: 'Legado QA',
            email: 'legacy@qa.invalid',
            password: 'qa-password-123',
            whatsapp: '62988887777',
          }),
        )
      assert.equal(r.status, 200)
      const u = (await r.json()).user
      assert.equal(u.hasAccess, false)
      assert.equal(
        await db.setting.count({ where: { key: 'studio-bonus:' + u.id } }),
        0,
      )
    },
  )
  const studioRoute = load(
    'src/app/api/integrations/library/entitlements/route.ts',
    { '@/lib/db': { db: studioDb } },
    studioRoot,
  )
  const originalFetch = global.fetch
  let offline = false,
    dropAfterCommit = false
  global.fetch = async (input, init) => {
    if (String(input).startsWith('https://studio.test.invalid/')) {
      if (offline) throw Error('qa-offline')
      const r = await studioRoute.POST(new Request(input, init))
      if (dropAfterCommit) {
        dropAfterCommit = false
        throw Error('qa-response-lost')
      }
      return r
    }
    return originalFetch(input, init)
  }
  process.env.LIBRARY_FREE_SIGNUP_ENABLED = '1'
  process.env.LIBRARY_STUDIO_INTEGRATION_ENABLED = '1'
  const learner = sessionClient()
  let trial
  await check(
    'cadastro grátis concede 20/24h e recebe código real do Studio por 7 dias',
    async () => {
      const r = await learner
        .route('auth/register')
        .POST(
          request('/api/auth/register', {
            name: 'Teste Gratis QA',
            email: 'trial@qa.invalid',
            password: 'qa-password-123',
            whatsapp: '62977776666',
            hasAccess: true,
            role: 'ADMIN',
          }),
        )
      assert.equal(r.status, 200)
      trial = (await r.json()).user
      assert.equal(trial.role, 'USER')
      assert.equal(trial.isTrial, true)
      const u = await db.user.findUnique({ where: { id: trial.id } }),
        profile = await learner
          .load('src/lib/member-profile.ts')
          .getMemberProfile(trial.id)
      assert.equal(profile.downloadLimit, 20)
      assert.equal(
        Date.parse(profile.downloadExpiresAt) - u.createdAt.getTime(),
        86400000,
      )
      const link = await studioDb.studioLibraryLink.findUnique({
        where: { externalUserId: trial.id },
        include: { code: true },
      })
      assert.equal(link.state, 'TRIAL')
      assert.equal(
        link.code.expiresAt.getTime() - u.createdAt.getTime(),
        7 * 86400000,
      )
      const bonus = await (await learner.route('account/studio').GET()).json()
      assert.equal(bonus.bonus.code, link.code.code)
      assert.equal(bonus.bonus.state, 'ready')
    },
  )
  await check(
    'teste pode comprar e não é tratado como pagamento confirmado',
    async () => {
      process.env.CAKTO_CHECKOUT_URL = 'https://pay.cakto.com.br/test'
      assert.equal(
        (await learner.route('payments/cakto-checkout').GET()).status,
        200,
      )
      assert.equal(
        (
          await (
            await learner
              .route('access/status')
              .GET(request('/api/access/status', null, 'GET'))
          ).json()
        ).active,
        false,
      )
    },
  )
  const art = await db.art.create({
      data: { title: 'Arte QA', imageUrl: '/uploads/qa.png' },
    }),
    quota = learner.load('src/lib/download-quota.ts')
  await check(
    '31 downloads concorrentes respeitam exatamente 20, incluindo repetições',
    async () => {
      const outcomes = await Promise.allSettled(
        Array.from({ length: 31 }, () =>
          quota.recordSuccessfulDownload(trial, art.id, false),
        ),
      )
      assert.equal(outcomes.filter((x) => x.status === 'fulfilled').length, 20)
      assert.equal(await db.download.count({ where: { userId: trial.id } }), 20)
      assert.equal((await quota.getDownloadQuota(trial)).exhausted, true)
      assert.equal(
        (
          await studioDb.studioLibraryLink.findUnique({
            where: { externalUserId: trial.id },
            include: { code: true },
          })
        ).code.active,
        true,
      )
    },
  )
  const old = await db.user.create({
    data: {
      name: 'Dois Dias QA',
      email: 'twodays@qa.invalid',
      password: 'qa-hash',
      hasAccess: true,
      accessType: 'TRIAL',
      accessSource: 'FREE_TRIAL',
      createdAt: new Date(Date.now() - 2 * 86400000),
    },
  })
  const profileApi = learner.load('src/lib/member-profile.ts'),
    bonusApi = learner.load('src/lib/studio-bonus.ts')
  await profileApi.saveMemberProfile(old.id, {
    whatsapp: '5562988887777',
    extraDevices: 0,
    downloadLimit: 20,
    downloadExpiresAt: new Date(
      old.createdAt.getTime() + 86400000,
    ).toISOString(),
  })
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id=${old.id} FOR UPDATE`
    await bonusApi.queueStudioEntitlement(tx, old, 'TRIAL')
  })
  await bonusApi.deliverStudioBonus(old.id)
  await check(
    '24h encerram downloads sem revogar os 5 dias restantes do Studio',
    async () => {
      const u = { ...old, isDemo: false }
      assert.equal((await quota.getDownloadQuota(u)).expired, true)
      await assert.rejects(
        quota.recordSuccessfulDownload(u, art.id, false),
        /prazo de teste terminou/,
      )
      const link = await studioDb.studioLibraryLink.findUnique({
        where: { externalUserId: old.id },
        include: { code: true },
      })
      assert.ok(link.code.expiresAt > Date.now())
      assert.equal(
        link.code.expiresAt.getTime() - old.createdAt.getTime(),
        7 * 86400000,
      )
    },
  )
  const linkBefore = await studioDb.studioLibraryLink.findUnique({
    where: { externalUserId: trial.id },
    include: { code: true },
  })
  const sessionHash = randomBytes(32).toString('hex'),
    browserHash = randomBytes(32).toString('hex')
  await studioDb.accessCode.update({
    where: { id: linkBefore.codeId },
    data: {
      sessionHash,
      browserHash,
      sessionExpiresAt: new Date(Date.now() + 3600000),
    },
  })
  await check(
    'pagamento Cakto real converte mesmo código e preserva sessão/navegador',
    async () => {
      await learner
        .load('src/lib/payments/processor.ts')
        .processPaymentEvent('CAKTO', {
          kind: 'PAGO',
          type: 'purchase_approved',
          externalId: 'QA-CAKTO-PAID',
          reference: 'QA-CAKTO-PAID',
          email: trial.email,
        })
      await bonusApi.deliverStudioBonus(trial.id)
      const link = await studioDb.studioLibraryLink.findUnique({
        where: { externalUserId: trial.id },
        include: { code: true },
      })
      assert.equal(link.codeId, linkBefore.codeId)
      assert.equal(link.state, 'MEMBER')
      assert.equal(link.code.expiresAt, null)
      assert.equal(link.code.sessionHash, sessionHash)
      assert.equal(link.code.browserHash, browserHash)
      assert.equal(await quota.getDownloadQuota(trial), null)
      assert.equal(
        (await db.user.findUnique({ where: { id: trial.id } })).accessType,
        'VITALICIO',
      )
    },
  )
  await check(
    'Cakto paga já registrada não vira recebimento manual duplicado',
    async () => {
      assert.equal(
        (
          await manual.POST(
            request('/api/admin/payments/manual', {
              ...payload,
              requestId: randomUUID(),
              userId: trial.id,
              reference: 'QA-CAKTO-DUP',
            }),
          )
        ).status,
        409,
      )
    },
  )
  await check(
    'pagamento manual pode ativar teste vencido e atualizar mesmo bônus',
    async () => {
      const before = await studioDb.studioLibraryLink.findUnique({
        where: { externalUserId: old.id },
      })
      const r = await manual.POST(
        request('/api/admin/payments/manual', {
          ...payload,
          requestId: randomUUID(),
          userId: old.id,
          reference: 'QA-TWO-DAYS',
          activateAccess: true,
        }),
      )
      assert.equal(r.status, 201)
      const after = await studioDb.studioLibraryLink.findUnique({
        where: { externalUserId: old.id },
        include: { code: true },
      })
      assert.equal(before.codeId, after.codeId)
      assert.equal(after.state, 'MEMBER')
      assert.equal(after.code.expiresAt, null)
      assert.equal(
        await quota.getDownloadQuota({ ...old, isDemo: false }),
        null,
      )
    },
  )
  await check(
    'falha de resposta mantém fila; repetição entrega o mesmo evento sem duplicar código',
    async () => {
      const lost = await db.user.create({
        data: {
          name: 'Resposta Perdida QA',
          email: 'lost@qa.invalid',
          password: 'qa-hash',
          hasAccess: true,
        },
      })
      await db.$transaction((tx) =>
        bonusApi.queueStudioEntitlement(tx, lost, 'MEMBER'),
      )
      dropAfterCommit = true
      await bonusApi.deliverStudioBonus(lost.id)
      const key = 'studio-bonus:' + lost.id
      let row = JSON.parse(
          (await db.setting.findUnique({ where: { key } })).value,
        ),
        id = row.event.eventId
      assert.equal(row.deliveredVersion, 0)
      row.nextAttemptAt = new Date(0).toISOString()
      await db.setting.update({
        where: { key },
        data: { value: JSON.stringify(row) },
      })
      await bonusApi.deliverStudioBonus(lost.id)
      row = JSON.parse((await db.setting.findUnique({ where: { key } })).value)
      assert.equal(row.event.eventId, id)
      assert.equal(row.deliveredVersion, 1)
      assert.equal(
        await studioDb.studioLibraryLink.count({
          where: { externalUserId: lost.id },
        }),
        1,
      )
      assert.equal(
        await studioDb.studioIntegrationEvent.count({
          where: { externalUserId: lost.id },
        }),
        1,
      )
    },
  )
  await check(
    'Studio fora do ar não desfaz cadastro nem reinicia prazo',
    async () => {
      offline = true
      const c = sessionClient(),
        r = await c
          .route('auth/register')
          .POST(
            request('/api/auth/register', {
              name: 'Offline QA',
              email: 'offline@qa.invalid',
              password: 'qa-password-123',
              whatsapp: '62966665555',
            }),
          )
      assert.equal(r.status, 200)
      const u = (await r.json()).user
      assert.ok(await db.user.findUnique({ where: { id: u.id } }))
      assert.equal(
        (await (await c.route('account/studio').GET()).json()).bonus.state,
        'pending',
      )
      offline = false
    },
  )
  await check(
    'bloqueio da Biblioteca revoga o Studio e impede exclusão antes de sincronizar',
    async () => {
      const route = admin.route('admin/users/[id]')
      assert.equal(
        (
          await route.DELETE(
            request('/api/admin/users/' + old.id, {}, 'DELETE'),
            { params: Promise.resolve({ id: old.id }) },
          )
        ).status,
        409,
      )
      assert.equal(
        (
          await route.PATCH(
            request('/api/admin/users/' + old.id, { blocked: true }),
            { params: Promise.resolve({ id: old.id }) },
          )
        ).status,
        200,
      )
      assert.equal(
        (
          await studioDb.studioLibraryLink.findUnique({
            where: { externalUserId: old.id },
            include: { code: true },
          })
        ).code.active,
        false,
      )
    },
  )
  await check('compra de conta bloqueada preserva bloqueio; desbloqueio libera pacote e encerra cota',async()=>{
    const user=await db.user.create({data:{name:'Bloqueada QA',email:'blocked@qa.invalid',password:'qa-hash',hasAccess:true,accessType:'TRIAL',status:'BLOCKED'}})
    await profileApi.saveMemberProfile(user.id,{whatsapp:'5562988887777',extraDevices:0,downloadLimit:20,downloadExpiresAt:new Date(Date.now()-1000).toISOString()})
    await db.$transaction(tx=>bonusApi.queueStudioEntitlement(tx,user,'REVOKED','ACCOUNT_BLOCKED'));await bonusApi.deliverStudioBonus(user.id)
    const before=await studioDb.studioLibraryLink.findUnique({where:{externalUserId:user.id}})
    const payment=await db.payment.create({data:{userId:user.id,provider:'MANUAL_PIX',amountCents:4790,status:'PENDING'}})
    await admin.load('src/lib/payments.ts').approvePayment(payment.id)
    assert.equal((await db.user.findUnique({where:{id:user.id}})).status,'BLOCKED')
    assert.equal((await studioDb.accessCode.findUnique({where:{id:before.codeId}})).active,false)
    const response=await admin.route('admin/users/[id]').PATCH(request('/api/admin/users/'+user.id,{blocked:false}),{params:Promise.resolve({id:user.id})})
    assert.equal(response.status,200);assert.equal(await quota.getDownloadQuota({...user,role:'USER',isDemo:false}),null)
    const after=await studioDb.studioLibraryLink.findUnique({where:{externalUserId:user.id},include:{code:true}});assert.equal(after.codeId,before.codeId);assert.equal(after.state,'MEMBER');assert.equal(after.code.active,true)
  })
  await check('worker exige segredo próprio e recupera fila sem interpretar configurações comuns como JSON', async()=>{
    const worker=guest.route('integrations/studio/retry')
    assert.equal((await worker.POST(request('/api/integrations/studio/retry',{}))).status,401)
    process.env.STUDIO_BONUS_CRON_SECRET=randomBytes(32).toString('hex')
    const row=await db.setting.findFirst({where:{key:{startsWith:'studio-bonus:'},value:{contains:'HTTP_'}}})
    const pending=await db.setting.findMany({where:{key:{startsWith:'studio-bonus:'}}})
    let target
    for(const item of pending){const d=JSON.parse(item.value);if(d.deliveredVersion<d.event.version){d.nextAttemptAt=new Date(0).toISOString();await db.setting.update({where:{key:item.key},data:{value:JSON.stringify(d)}});target=item.key;break}}
    assert.ok(target)
    const response=await worker.POST(new Request('https://www.clickgruda.com.br/api/integrations/studio/retry',{method:'POST',headers:{Authorization:'Bearer '+process.env.STUDIO_BONUS_CRON_SECRET}}))
    assert.equal(response.status,200);assert.ok((await response.json()).attempted>=1)
    const result=JSON.parse((await db.setting.findUnique({where:{key:target}})).value);assert.equal(result.deliveredVersion,result.event.version)
    assert.equal((await db.setting.findUnique({where:{key:'qa-preserve-master-setting'}})).value,'keep')
  })
  const ledgerApi = admin.load('src/lib/payments/financial-ledger.ts')
  const cakto = admin.load('src/lib/payments/cakto.ts').caktoProvider
  const processor = admin.load('src/lib/payments/processor.ts').processPaymentEvent
  const normalized = (id, amount, currency = 'BRL', type = 'purchase_approved', email = 'finance@qa.invalid') => cakto.normalize({ event: type, data: { id, refId: 'ref-' + id, customer: { email }, amount, currency, paidAt: '2026-11-01T12:00:00-03:00', paymentMethod: 'pix' } })[0]
  await check('normalização usa total cobrado BRL e rejeita valores ambíguos', async () => {
    for (const [value, expected] of [[47.9,4790],['34.35',3435],[0,0],[0.29,29],['0.01',1],[1.234,null],['47,90',null],[-1,null],[null,null],['',null],[true,null],[Infinity,null]]) assert.equal(normalized('units',value).finance.amountCents,expected)
    assert.equal(normalized('foreign',47.9,'USD').finance.amountCents,null)
    assert.equal(normalized('absent',47.9,null).finance.amountCents,null)
  })
  process.env.LIBRARY_STUDIO_INTEGRATION_ENABLED = '0'
  const initialFinance = await ledgerApi.financialLedger()
  await check('compra Cakto sem conta soma valor real e reenvios não duplicam', async () => {
    await Promise.all(Array.from({length:5},()=>processor('CAKTO',normalized('finance-1',34.35))))
    const current = await ledgerApi.financialLedger()
    assert.equal(current.stats.revenueCents,initialFinance.stats.revenueCents+3435)
    assert.equal(current.payments.filter(p=>p.externalId==='finance-1').length,1)
    assert.equal(await db.user.count({where:{email:'finance@qa.invalid'}}),0)
    await processor('CAKTO',normalized('finance-1',99))
    assert.equal((await ledgerApi.financialLedger()).stats.revenueCents,current.stats.revenueCents)
  })
  await check('compra histórica sem valor aparece e reenvio recupera só financeiro',async()=>{
    await processor('CAKTO',{kind:'PAGO',type:'purchase_approved',externalId:'finance-legacy',reference:'ref-finance-legacy',email:trial.email})
    const beforeUser=await db.user.findUnique({where:{id:trial.id}})
    const beforeEvents=await db.paymentWebhookEvent.count()
    let current=await ledgerApi.financialLedger()
    assert.equal(current.payments.find(p=>p.externalId==='finance-legacy').amountCents,null)
    const beforeAmount=current.stats.revenueCents
    await processor('CAKTO',normalized('finance-legacy',45.3,'BRL','purchase_approved',trial.email))
    current=await ledgerApi.financialLedger()
    assert.equal(current.stats.revenueCents,beforeAmount+4530)
    assert.equal(await db.paymentWebhookEvent.count(),beforeEvents)
    assert.deepEqual(await db.user.findUnique({where:{id:trial.id}}),beforeUser)
  })
  await check('estorno exclui receita mesmo com aprovação atrasada e lançamento legado', async()=>{
    const before=(await ledgerApi.financialLedger()).stats.revenueCents
    await db.payment.create({data:{userId:baseline.id,provider:'CAKTO',externalId:'ref-finance-1',amountCents:3435,status:'APPROVED'}})
    assert.equal((await ledgerApi.financialLedger()).stats.revenueCents,before)
    await processor('CAKTO',normalized('finance-1',34.35,'BRL','refund'))
    await processor('CAKTO',normalized('finance-1',34.35,'BRL','payment_approved'))
    assert.equal((await ledgerApi.financialLedger()).stats.revenueCents,before-3435)
    assert.equal((await ledgerApi.financialLedger()).payments.filter(p=>p.externalId==='ref-finance-1')[0].status,'REVOKED')
  })
  await check('conciliação exige admin/origem, valor real, é auditada e idempotente',async()=>{
    const e={kind:'PAGO',type:'purchase_approved',externalId:'finance-missing',reference:'finance-missing',email:'missing@qa.invalid'}
    await processor('CAKTO',e)
    const purchase=await db.pendingPurchase.findUnique({where:{provider_externalId:{provider:'CAKTO',externalId:e.externalId}}})
    const body={purchaseId:purchase.id,amountCents:3890,paidAt:'2026-11-02T03:00:00.000Z',evidence:'Cakto-comprovante-QA',confirmedCakto:true}
    const route=admin.route('admin/payments/cakto'),api='/api/admin/payments/cakto'
    assert.equal((await guest.route('admin/payments/cakto').POST(request(api,body))).status,401)
    assert.equal((await route.POST(request(api,body,'POST','https://evil.invalid'))).status,403)
    assert.equal((await route.POST(request(api,{...body,confirmedCakto:false}))).status,400)
    assert.equal((await route.POST(request(api,{...body,amountCents:0}))).status,400)
    const before=(await ledgerApi.financialLedger()).stats.revenueCents
    const responses=await Promise.all(Array.from({length:5},()=>route.POST(request(api,body))))
    assert.ok(responses.every(r=>r.status===200))
    assert.equal((await ledgerApi.financialLedger()).stats.revenueCents,before+3890)
    assert.equal((await route.POST(request(api,{...body,amountCents:9999}))).status,409)
    const receipt=JSON.parse((await db.setting.findUnique({where:{key:'cakto-finance:'+purchase.id}})).value)
    assert.equal(receipt.adminId,owner.id);assert.equal(receipt.evidence,body.evidence)
    await processor('CAKTO',normalized(e.externalId,50,'BRL','purchase_approved',e.email))
    assert.equal((await ledgerApi.financialLedger()).stats.revenueCents,before+3890)
    await processor('CAKTO',{...e,kind:'CHARGEBACK',type:'chargeback'})
    assert.equal((await ledgerApi.financialLedger()).stats.revenueCents,before)
    assert.equal((await route.POST(request(api,body))).status,409)
  })
  await check('resumo e lista concordam, cortesias não viram receita',async()=>{
    const before=(await ledgerApi.financialLedger()).stats.revenueCents
    await db.user.create({data:{name:'Cortesia financeira',email:'courtesy-finance@qa.invalid',password:'qa',hasAccess:true,accessSource:'ADMIN_GRANT'}})
    const stats=await (await admin.route('admin/stats').GET()).json()
    const list=await (await admin.route('admin/payments').GET()).json()
    assert.equal(stats.stats.revenueCents,before)
    assert.equal(list.payments.filter(p=>p.status==='APPROVED').reduce((s,p)=>s+(p.amountCents??0),0),before)
    assert.ok(stats.stats.missingCaktoAmounts>0)
    assert.equal(stats.stats.missingCaktoAmounts,list.missingCaktoAmounts)
    assert.equal(list.payments.some(p=>p.userEmail==='courtesy-finance@qa.invalid'),false)
  })
  await check(
    'admin mestre e configuração original permanecem intactos',
    async () => {
      assert.deepEqual(
        await db.user.findUnique({ where: { id: owner.id } }),
        masterBefore,
      )
      assert.equal(
        (
          await db.setting.findUnique({
            where: { key: 'qa-preserve-master-setting' },
          })
        ).value,
        'keep',
      )
      assert.equal((await auth.getSessionUser()).role, 'ADMIN')
      assert.equal(
        (
          await admin
            .route('admin/users/[id]')
            .DELETE(request('/api/admin/users/' + owner.id, {}, 'DELETE'), {
              params: Promise.resolve({ id: owner.id }),
            })
        ).status,
        400,
      )
    },
  )
  global.fetch = originalFetch
  if (process.argv.includes('--browser')) {
    console.log(
      process.argv.includes('--reuse-build')
        ? 'Verificando build existente em Chromium…'
        : 'Compilando aplicação para verificação em Chromium…',
    )
    if (!process.argv.includes('--reuse-build')) {
      const built = await run('npm', ['run', 'build'], {
        cwd: root,
        env: { ...process.env, NODE_ENV: 'production' },
        maxBuffer: 10 * 1024 * 1024,
      })
      fs.writeFileSync(
        path.join(folder, 'build.log'),
        built.stdout + built.stderr,
      )
    }
    const browserPurchase = await db.pendingPurchase.create({data:{provider:'CAKTO',externalId:'QA-BROWSER-CAKTO',email:'browser-cakto@qa.invalid',status:'APPROVED'}})
    const httpPort = await freePort()
    server = spawn(
      process.execPath,
      [
        path.join(root, 'node_modules/next/dist/bin/next'),
        'start',
        '-p',
        String(httpPort),
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          NEXT_PUBLIC_SITE_URL: 'https://www.clickgruda.com.br',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    server.stdout.on('data', (c) =>
      fs.appendFileSync(path.join(folder, 'server.log'), c),
    )
    server.stderr.on('data', (c) =>
      fs.appendFileSync(path.join(folder, 'server.log'), c),
    )
    const base = 'http://localhost:' + httpPort
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch(base + '/api/auth/options')).ok) break
      } catch {}
      await new Promise((r) => setTimeout(r, 200))
    }
    const { chromium } = require(
      process.env.PLAYWRIGHT_MODULE ||
        '/workspace/work/test-tools/node_modules/playwright',
    )
    const browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
    try {
      const ctx = await browser.newContext({
        viewport: { width: 1600, height: 1100 },
      })
      await ctx.addInitScript(() => {
        try {
          sessionStorage.setItem('cg_view', 'admin')
        } catch {}
      })
      await ctx.route('**/api/admin/payments/*', async (route) => {
        if (route.request().method() === 'POST') {
          const response = await route.fetch({
            headers: {
              ...route.request().headers(),
              origin: 'https://www.clickgruda.com.br',
            },
          })
          await route.fulfill({ response })
        } else await route.continue()
      })
      await ctx.addCookies([
        {
          name: 'cg_session',
          value: admin.jar.get('cg_session'),
          url: base,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ])
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('response', async (r) => {
        if (r.url().endsWith('/api/auth/me')) {
          const d = await r.json().catch(() => ({}))
          console.log(
            'QA browser auth:',
            r.status(),
            d.user?.role || 'sem sessão',
          )
        }
      })
      await page.goto(base, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)
      fs.mkdirSync(path.join(folder, 'browser'), { recursive: true })
      await page.screenshot({
        path: path.join(folder, 'browser', 'antes-formulario.png'),
        fullPage: true,
      })
      await page
        .getByRole('button', { name: 'Pagamentos', exact: true })
        .click()
      await page
        .getByRole('button', { name: 'Registrar pagamento', exact: true })
        .click()
      const dialog = page.getByRole('dialog')
      await dialog
        .getByLabel('Buscar cliente pelo nome ou e-mail')
        .fill('Cliente Browser QA')
      const browserCustomer = await db.user.create({
        data: {
          name: 'Cliente Browser QA',
          email: 'browser@qa.invalid',
          password: 'qa-hash',
        },
      })
      await dialog
        .getByLabel('Buscar cliente pelo nome ou e-mail')
        .fill('browser@qa.invalid')
      await dialog
        .getByLabel('Cliente', { exact: true })
        .selectOption(browserCustomer.id)
      await dialog.getByLabel('Valor recebido (R$)').fill('47,90')
      await dialog
        .getByLabel('Identificador do comprovante')
        .fill('QA-BROWSER-PIX')
      await dialog.getByText('Conferi o recebimento', { exact: false }).click()
      await dialog
        .getByRole('button', { name: 'Confirmar pagamento recebido' })
        .click()
      await page.waitForTimeout(1000)
      if (await dialog.isVisible())
        console.log(
          'QA formulário:',
          await dialog.innerText(),
          await dialog
            .locator('form')
            .evaluate((f) =>
              Array.from(f.querySelectorAll(':invalid')).map((i) => ({
                id: i.id,
                value: i.value,
                message: i.validationMessage,
              })),
            ),
        )
      await dialog.waitFor({ state: 'hidden' })
      await page.getByText('Cliente Browser QA', { exact: true }).waitFor()
      assert.equal(
        await db.payment.count({
          where: { userId: browserCustomer.id, status: 'APPROVED' },
        }),
        1,
      )
      fs.mkdirSync(path.join(folder, 'browser'), { recursive: true })
      await page.screenshot({
        path: path.join(folder, 'browser', 'pagamento-manual.png'),
        fullPage: true,
      })
      const caktoRow=page.getByRole('row').filter({hasText:'browser-cakto@qa.invalid'})
      await caktoRow.getByText('Valor a confirmar',{exact:true}).waitFor()
      await caktoRow.getByRole('button',{name:'Conferir valor Cakto'}).click()
      await dialog.getByLabel('Valor cobrado (R$)').fill('39,90')
      await dialog.getByLabel('Data do pagamento').fill('2026-11-02')
      await dialog.getByLabel('Referência do comprovante conferido').fill('Cakto-QA-comprovante-001')
      await dialog.getByText('Conferi este pedido na Cakto',{exact:false}).click()
      await dialog.getByRole('button',{name:'Confirmar conciliação',exact:true}).click()
      await dialog.waitFor({state:'hidden'})
      await caktoRow.getByText(/39,90/).waitFor()
      assert.equal(JSON.parse((await db.setting.findUnique({where:{key:'cakto-finance:'+browserPurchase.id}})).value).amountCents,3990)
      assert.equal(await db.payment.count({where:{externalId:'QA-BROWSER-CAKTO'}}),0)
      await page.screenshot({path:path.join(folder,'browser','cakto-conciliado.png'),fullPage:true})
      assert.deepEqual(errors, [])
      console.log(
        'PASS Chromium: formulários reais manual e Cakto atualizam o faturamento sem duplicar compra',
      )
      checks++
    } finally {
      await browser.close()
    }
  }
  console.log(
    `PASS ${checks} cenários de integração com DOIS bancos PostgreSQL isolados. Artefatos: ${folder}`,
  )
}
let failed = false
main()
  .catch((e) => {
    failed = true
    process.exitCode = 1
    if (e.stdout || e.stderr) {
      fs.writeFileSync(
        path.join(folder, 'failure.log'),
        String(e.stdout || '') + String(e.stderr || ''),
      )
      console.error(
        'Falha da ferramenta; diagnóstico em ' +
          path.join(folder, 'failure.log'),
      )
    } else console.error(e)
  })
  .finally(async () => {
    if (server) server.kill('SIGTERM')
    if (db) await db.$disconnect()
    if (studioDb) await studioDb.$disconnect()
    if (pg) await pg.stop()
    fs.rmSync(path.join(root, 'node_modules/.studio-qa-client'), {
      recursive: true,
      force: true,
    })
    if (failed) process.exitCode = 1
  })
