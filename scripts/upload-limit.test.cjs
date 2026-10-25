const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
function loadTS(relative, replacements = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8')
  const { outputText, diagnostics } = ts.transpileModule(source, {
    fileName: relative,
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  assert.equal(diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, `TS transpile: ${relative}`)
  const mod = { exports: {} }
  const fakeRequire = (name) => {
    if (name in replacements) return replacements[name]
    if (name === './upload-limits' || name === '@/lib/upload-limits') return loadTS('src/lib/upload-limits.ts')
    throw Error(`Unknown test dependency: ${name}`)
  }
  new Function('require', 'module', 'exports', outputText)(fakeRequire, mod, mod.exports)
  return mod.exports
}

const { MAX_ART_SIZE, MAX_ART_SIZE_LABEL } = loadTS('src/lib/upload-limits.ts')
const auth = { getSessionUser: async () => ({ role: 'ADMIN' }), jsonError: (error, status) => Response.json({ error }, { status }) }
const savedFetch = globalThis.fetch

function testFile(bytes) {
  const file = new File(['tiny'], 'design.png', { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: bytes, configurable: true })
  return file
}

test('limite de imagem é de 15 MiB (rotulado 15 MB)', () => {
  assert.equal(MAX_ART_SIZE, 15 * 1024 * 1024)
  assert.equal(MAX_ART_SIZE_LABEL, '15 MB')
})

test('formulário de arte aceita exatamente 15 MB no fallback local', async () => {
  const { uploadArtFile } = loadTS('src/lib/art-upload.ts')
  let signedSize
  globalThis.fetch = async (url, request) => {
    if (url === '/api/admin/upload/sign') {
      signedSize = JSON.parse(request.body).fileSize
      return { ok: true, json: async () => ({ r2: false, requiresR2ForLargeFiles: false }) }
    }
    assert.equal(url, '/api/admin/upload')
    return { ok: true, json: async () => ({ url: '/uploads/arts/design.png' }) }
  }
  try {
    assert.deepEqual(await uploadArtFile(testFile(MAX_ART_SIZE)), {
      imageUrl: '/uploads/arts/design.png', originalKey: undefined, r2: false,
    })
    assert.equal(signedSize, MAX_ART_SIZE)
  } finally { globalThis.fetch = savedFetch }
})

test('formulário bloqueia 15 MB + 1 byte antes de chamar a API', async () => {
  const { uploadArtFile } = loadTS('src/lib/art-upload.ts')
  let called = false
  globalThis.fetch = async () => { called = true; throw Error('No API calls expected') }
  try {
    await assert.rejects(uploadArtFile(testFile(MAX_ART_SIZE + 1)), /Máximo: 15 MB/)
    assert.equal(called, false)
  } finally { globalThis.fetch = savedFetch }
})

test('sem R2 na Vercel, upload grande dá orientação clara', async () => {
  const { uploadArtFile } = loadTS('src/lib/art-upload.ts')
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ r2: false, requiresR2ForLargeFiles: true }) })
  try { await assert.rejects(uploadArtFile(testFile(12 * 1024 * 1024)), /ative o Cloudflare R2/) }
  finally { globalThis.fetch = savedFetch }
})

test('API de assinatura valida 15 MB e recusa arquivo maior', async () => {
  const { POST } = loadTS('src/app/api/admin/upload/sign/route.ts', {
    '@/lib/auth': auth,
    '@/lib/storage': { getR2Config: async () => null },
    crypto: require('node:crypto'),
  })
  const accepted = await POST({ json: async () => ({ originalExt: 'png', fileSize: MAX_ART_SIZE }) })
  assert.equal(accepted.status, 200)
  const denied = await POST({ json: async () => ({ originalExt: 'png', fileSize: MAX_ART_SIZE + 1 }) })
  assert.equal(denied.status, 400)
  assert.match((await denied.json()).error, /15 MB/)
})

test('API multipart de desenvolvimento aceita 15 MB e bloqueia 15 MB + 1 byte', async () => {
  let uploadCalls = 0
  const { POST } = loadTS('src/app/api/admin/upload/route.ts', {
    '@/lib/auth': auth,
    '@/lib/storage': { isAllowedImageExt: (ext) => ext === 'png', putImage: async () => { uploadCalls++; return '/uploads/arts/art.png' } },
  })
  const request = (size) => ({ formData: async () => ({ get: () => testFile(size) }) })
  assert.equal((await POST(request(MAX_ART_SIZE))).status, 200)
  assert.equal(uploadCalls, 1)
  const denied = await POST(request(MAX_ART_SIZE + 1))
  assert.equal(denied.status, 400)
  assert.equal(uploadCalls, 1)
})

test('interface em lote e de bocões informa 15 MB', () => {
  for (const name of ['src/components/admin/BulkUploadDialog.tsx', 'src/components/views/AdminBocoesSection.tsx', 'src/components/views/AdminSections.tsx']) {
    const content = fs.readFileSync(path.join(root, name), 'utf8')
    assert.match(content, /15 MB/, name)
  }
})

test('prévia demo aceita leitura até o mesmo limite nas duas bibliotecas', () => {
  for (const name of ['src/app/api/arts/[id]/preview/route.ts', 'src/app/api/bocoes/[id]/preview/route.ts']) {
    const content = fs.readFileSync(path.join(root, name), 'utf8')
    assert.match(content, /size > MAX_ART_SIZE/, name)
    assert.match(content, /buffer.length > MAX_ART_SIZE/, name)
  }
})
