const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const React = require('react')
const ReactDOM = require('react-dom/server')
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query')
function load(file, mocks = {}, cache = new Map()) {
  const absolute = path.resolve(__dirname, '..', file)
  if (cache.has(absolute)) return cache.get(absolute)
  const module = { exports: {} }; cache.set(absolute, module.exports)
  const js = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
  const localRequire = name => {
    if (name in mocks) return mocks[name]
    if (name.startsWith('@/')) { const base = 'src/' + name.slice(2); return load([base + '.ts', base + '.tsx', base + '/index.ts'].find(p => fs.existsSync(path.resolve(__dirname, '..', p))), mocks, cache) }
    return require(name)
  }
  new Function('require', 'module', 'exports', js)(localRequire, module, module.exports)
  cache.set(absolute, module.exports); return module.exports
}
const baseState = { user: null, authMode: 'register', pendingIntent: null, setView() {}, setUser() {}, setAuthMode() {}, setPendingIntent() {} }
function ui(file, name, state, props = {}, prepare) {
  const useStore = Object.assign(selector => selector(state), { getState: () => state })
  const Component = load(file, { '@/lib/store': { useStore } })[name]
  const query = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60000 } } })
  if (prepare) prepare(query)
  const html = ReactDOM.renderToStaticMarkup(React.createElement(QueryClientProvider, { client: query }, React.createElement(Component, props)))
  query.clear(); return html
}
test('cadastro informa ativação pendente, exige WhatsApp e oferece demo sem submeter o formulário', () => {
  const html = ui('src/components/views/AuthView.tsx', 'AuthView', baseState)
  assert.match(html, /Cadastro não libera o acesso automaticamente/)
  assert.match(html, /id="whatsapp"[^>]*required/)
  assert.match(html.match(/<input\b[^>]*id="password"[^>]*>/)[0], /type="password"/)
  assert.match(html, /aria-label="Mostrar senha"/)
  assert.match(html, /Conhecer por dentro/)
  assert.match(html, /Prefiro cadastrar com a equipe pelo WhatsApp/)
  const formEnd = html.indexOf('</form>')
  assert.ok(html.indexOf('Conhecer por dentro') > formEnd)
  assert.ok(!html.includes('PIX automático libera na hora'))
})
test('landing mantém a demo e não anuncia Loja Online nem usa a ilustração da loja', () => {
  const html = ui('src/components/views/LandingView.tsx', 'LandingView', { ...baseState, authMode: 'login' })
  assert.match(html, /Conhecer por dentro/)
  assert.match(html, /cg-sales-page/)
  assert.ok(!/Loja Online|ecossistema-completo/.test(html))
})
test('ativação manual mostra atendimento antes do pagamento e não mostra chave PIX ou promessa de liberação imediata', () => {
  const user = { id: 'member-test', name: 'Maria Teste', email: 'maria@test.invalid', hasAccess: false, isDemo: false }
  const html = ui('src/components/checkout/AssistedActivationView.tsx', 'AssistedActivationView', { ...baseState, user }, { subtotalCents: 4790 }, query => query.setQueryData(['activation-order', user.id], { paymentId: null }))
  assert.match(html, /ativação pendente/)
  assert.match(html, /Conversar e solicitar minha ativação/)
  assert.match(html, /antes de pagar/)
  assert.ok(!html.includes('Copiar chave'))
  assert.ok(!html.includes('chave abaixo'))
  assert.ok(!html.includes('qrCodeImage'))
})
test('paginação alcança primeira, última e páginas próximas sem enumerar milhares de botões', () => {
  const { paginationPages, NumberedPagination } = load('src/components/admin/NumberedPagination.tsx')
  assert.deepEqual(paginationPages(1, 1), [1])
  assert.deepEqual(paginationPages(1, 100), [1, 2, 3, 'gap-right', 100])
  assert.ok(paginationPages(50, 100).includes(1)); assert.ok(paginationPages(50, 100).includes(100))
  let chosen
  const element = NumberedPagination({ page: 1, totalPages: 100, onChange: value => { chosen = value } })
  const buttons = element.props.children.flat().filter(child => child?.type === 'button')
  const last = buttons.find(button => button.props['aria-label'] === 'Ir para a página 100')
  assert.ok(last); last.props.onClick(); assert.equal(chosen, 100)
  assert.equal(buttons[0].props.disabled, true)
})
test('troca entre demo e conta própria limpa artes da sessão anterior e só sai após logout confirmado', async () => {
  const cache = new Map()
  const { useStore } = load('src/lib/store.ts', {}, cache)
  const api = load('src/lib/demo-client.ts', {}, cache)
  const query = new QueryClient()
  query.setQueryData(['arts'], { imageUrl: 'url-da-sessao-anterior' })
  const oldFetch = global.fetch
  try {
    global.fetch = async () => Response.json({ user: { id: 'demo_test', hasAccess: true, isDemo: true } })
    await api.enterPublicDemo(query, 'test')
    assert.equal(query.getQueryData(['arts']), undefined); assert.equal(useStore.getState().view, 'portal')
    global.fetch = async () => Response.json({ error: 'falha' }, { status: 503 })
    await assert.rejects(api.leaveDemoForAccount(query, 'register'))
    assert.equal(useStore.getState().user.isDemo, true)
    global.fetch = async () => Response.json({ ok: true })
    await api.leaveDemoForAccount(query, 'register')
    assert.equal(useStore.getState().user, null); assert.equal(useStore.getState().view, 'auth'); assert.equal(useStore.getState().pendingIntent, 'checkout')
  } finally { global.fetch = oldFetch; query.clear() }
})
test('conflito serializável refaz a transação; só emite token após aplicar a revogação', async () => {
  let attempts = 0, revoked = false
  const tx = { userSession: { findMany: async () => [{ id: 'old-device' }], updateMany: async ({ data }) => { assert.equal(data.revokedReason, 'LIMIT'); revoked = true; return { count: 1 } }, create: async () => ({ id: 'new-device' }) } }
  const db = { $transaction: async (action, options) => { assert.equal(options.isolationLevel, 'Serializable'); attempts++; if (attempts === 1) throw Object.assign(new Error('conflict'), { code: 'P2034' }); return action(tx) }, userSession: { count: async () => 0, findMany: async () => [] }, accountAlert: { findFirst: async () => null } }
  const { startSession } = load('src/lib/sessions.ts', { '@/lib/db': { db }, '@/lib/member-profile': { getMemberProfile: async () => ({ extraDevices: 0 }) }, '@/lib/auth': { getCurrentSessionId: async () => null, createSessionToken: async (id, sid) => { assert.equal(revoked, true); assert.equal(sid, 'new-device'); return 'signed-token' } } })
  const result = await startSession({ id: 'member', role: 'USER', isDemo: false }, new Request('https://www.clickgruda.com.br/api/auth/login'))
  assert.equal(attempts, 2); assert.equal(result.displaced, true); assert.equal(result.limit, 1); assert.equal(result.token, 'signed-token')
})
