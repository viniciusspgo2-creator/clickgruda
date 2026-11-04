// Testes de concorrência com banco simulado: NÃO substituem o teste em Neon.
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function loadProcessor(db) {
  const source = fs.readFileSync(path.join(__dirname, '../src/lib/payments/processor.ts'), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  })
  assert.deepEqual(output.diagnostics.filter(x => x.category === ts.DiagnosticCategory.Error), [])
  const module = { exports: {} }
  const requireMock = (name) => {
    if (name === '@prisma/client') return { Prisma: { TransactionIsolationLevel: { ReadCommitted: 'ReadCommitted' } } }
    if (name === '@/lib/db') return { db }
    throw new Error('Import inesperado ' + name)
  }
  new Function('require', 'module', 'exports', output.outputText)(requireMock, module, module.exports)
  return module.exports.processPaymentEvent
}

function createFakeDb() {
  const records = new Map()
  const purchases = new Map()
  const locks = new Map()
  const user = {
    id: 'user1', email: 'cliente@example.com', isDemo: false,
    isPreview: false, status: 'ACTIVE', hasAccess: false,
    accessSource: null, activatedAt: null,
    accessProvider: null, accessReference: null,
  }
  let revocations = 0
  let conflictsLeft = 0
  async function acquire(key) {
    const prior = locks.get(key) || Promise.resolve()
    let release
    const pending = new Promise(resolve => { release = resolve })
    locks.set(key, prior.then(() => pending))
    await prior
    return release
  }
  const db = {
    get state() { return { records, purchases, user, revocations } },
    get conflictsLeft() { return conflictsLeft },
    set conflictsLeft(v) { conflictsLeft = v },
    paymentWebhookEvent: {
      async findUnique({ where }) {
        const w = where.provider_externalId_eventType
        return records.get(`${w.provider}:${w.externalId}:${w.eventType}`) || null
      },
    },
    async $transaction(cb, config) {
      assert.equal(config.isolationLevel, 'ReadCommitted')
      if (conflictsLeft > 0) { conflictsLeft--; throw Object.assign(new Error('write conflict'), { code: 'P2034' }) }
      let unlock = null
      const tx = {
        async $queryRaw(_fragments, key) { unlock = await acquire(key); return [{ acquired: 1 }] },
        user: {
          async findUnique({ where }) { return where.email === user.email ? { ...user } : null },
          async update({ data }) { Object.assign(user, data) },
        },
        paymentWebhookEvent: {
          async create({ data }) {
            const key = `${data.provider}:${data.externalId}:${data.eventType}`
            if (records.has(key)) throw Object.assign(new Error('unique key'), { code: 'P2002' })
            records.set(key, { id: 'evt' + records.size, ...data })
          },
        },
        pendingPurchase: {
          async findUnique({ where }) { const w = where.provider_externalId; return purchases.get(`${w.provider}:${w.externalId}`) || null },
          async upsert({ where, create, update }) {
            const w = where.provider_externalId
            const key = `${w.provider}:${w.externalId}`
            purchases.set(key, purchases.has(key) ? { ...purchases.get(key), ...update } : create)
          },
        },
        userSession: { async updateMany() { revocations++ } },
      }
      try { return await cb(tx) } finally { if (unlock) unlock() }
    },
  }
  return db
}

function evt(kind, type) {
  return { kind, type, externalId: 'pedido-123', reference: 'pedido-123', email: 'cliente@example.com' }
}

test('3 tipos de evento simultâneos não geram conflito nem reativam compra revogada', async () => {
  const db = createFakeDb()
  const processor = loadProcessor(db)
  const results = await Promise.all([
    processor('CAKTO', evt('PAGO', 'purchase_approved')),
    processor('CAKTO', evt('REEMBOLSADO', 'refund')),
    processor('CAKTO', evt('CHARGEBACK', 'chargeback')),
  ])
  assert.deepEqual(results, ['processed', 'processed', 'processed'])
  assert.equal(db.state.records.size, 3)
  assert.equal(db.state.purchases.get('CAKTO:pedido-123').status, 'REVOKED')
  assert.equal(db.state.user.hasAccess, false)
})

test('evento repetido é idempotente', async () => {
  const db = createFakeDb()
  const processor = loadProcessor(db)
  assert.equal(await processor('CAKTO', evt('PAGO', 'purchase_approved')), 'processed')
  assert.equal(await processor('CAKTO', evt('PAGO', 'purchase_approved')), 'duplicate')
  assert.equal(db.state.records.size, 1)
  assert.equal(db.state.user.hasAccess, true)
})

test('conflito transitório P2034 é repetido sem duplicar compra', async () => {
  const db = createFakeDb()
  db.conflictsLeft = 1
  const processor = loadProcessor(db)
  assert.equal(await processor('CAKTO', evt('PAGO', 'purchase_approved')), 'processed')
  assert.equal(db.state.records.size, 1)
  assert.equal(db.state.user.hasAccess, true)
})

test('compra aprovada depois de chargeback não reativa conta', async () => {
  const db = createFakeDb()
  const processor = loadProcessor(db)
  await processor('CAKTO', evt('CHARGEBACK', 'chargeback'))
  await processor('CAKTO', evt('PAGO', 'purchase_approved'))
  assert.equal(db.state.user.hasAccess, false)
  assert.equal(db.state.purchases.get('CAKTO:pedido-123').status, 'REVOKED')
})
