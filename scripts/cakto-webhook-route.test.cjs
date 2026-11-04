const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

function makeHandler({ verify, normalize, countAttempt = async () => {}, isThrottled = async () => false, processPaymentEvent = async () => {} }) {
  const code = fs.readFileSync(path.join(__dirname, '../src/app/api/webhooks/cakto/route.ts'), 'utf8')
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  })
  assert.equal(transpiled.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0)
  const mod = { exports: {} }
  function mock(name) {
    if (name === '@/lib/payments/cakto') return {
      caktoProvider: { name: 'CAKTO', verify, normalize },
      InvalidCaktoWebhook: class InvalidCaktoWebhook extends Error {},
    }
    if (name === '@/lib/payments/processor') return { processPaymentEvent }
    if (name === '@/lib/security-guards') return {
      isThrottled, countAttempt, requestIp: () => '127.0.0.1', throttleKey: () => 'throttle',
    }
    throw new Error(`Import inesperado: ${name}`)
  }
  new Function('require', 'module', 'exports', transpiled.outputText)(mock, mod, mod.exports)
  return mod.exports.POST
}
function request() { return new Request('https://www.clickgruda.com.br/api/webhooks/cakto', { method: 'POST', body: '{"test":true}' }) }
const evt = { kind: 'PAGO', type: 'purchase_approved', externalId: '123', email: 'cliente@example.com' }

test('evento autenticado não vira erro 500 se contador acessório falhar', async () => {
  let processed = 0
  const handler = makeHandler({
    verify: () => ({}), normalize: () => [evt],
    countAttempt: async () => { throw Object.assign(new Error('concurrent update'), { code: 'P2034' }) },
    processPaymentEvent: async () => { processed++ },
  })
  const previousWarn = console.warn; console.warn = () => {}
  try {
    const response = await handler(request())
    assert.equal(response.status, 200)
    assert.equal(processed, 1)
  } finally { console.warn = previousWarn }
})

test('eventos autenticados são processados todos, na ordem recebida', async () => {
  const kinds = []
  const handler = makeHandler({
    verify: () => ({}), normalize: () => [evt, { ...evt, kind: 'REEMBOLSADO', type: 'refund' }, { ...evt, kind: 'CHARGEBACK', type: 'chargeback' }],
    processPaymentEvent: async (_, event) => { kinds.push(event.kind) },
  })
  const response = await handler(request())
  assert.equal(response.status, 200)
  assert.deepEqual(kinds, ['PAGO', 'REEMBOLSADO', 'CHARGEBACK'])
})

test('falha ao persistir um pagamento não é confirmada como sucesso', async () => {
  const handler = makeHandler({
    verify: () => ({}), normalize: () => [evt],
    processPaymentEvent: async () => { throw Object.assign(new Error('database down'), { code: 'P1001' }) },
  })
  const previousError = console.error; console.error = () => {}
  try {
    const response = await handler(request())
    assert.equal(response.status, 500)
  } finally { console.error = previousError }
})
