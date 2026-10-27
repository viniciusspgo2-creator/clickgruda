const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { createHash } = require('node:crypto')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
const origin = 'https://www.clickgruda.com.br'
function load(file, mocks = {}) {
  const module = { exports: {} }
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const localRequire = name => {
    if (name in mocks) return mocks[name]
    if (name === '@/lib/site') return { SITE_URL: origin }
    if (name === './upload-limits') return load('src/lib/upload-limits.ts')
    return require(name)
  }
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports)
  return module.exports
}
const cfg = { endpoint: 'https://test.r2.cloudflarestorage.com', accessKeyId: 'test-only', secretAccessKey: 'not-a-real-secret', originalsBucket: 'originais', previewsBucket: 'previas', publicUrl: 'https://images.test.invalid' }
const saved = { fetch: global.fetch, Image: global.Image, document: global.document }
test.afterEach(() => { global.fetch = saved.fetch; global.Image = saved.Image; global.document = saved.document })
const allowed = () => new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, PUT, HEAD', 'Access-Control-Allow-Headers': 'content-type' } })
const missing = () => new Response(null, { status: 403 })
function cors(storage) { return load('src/lib/r2-cors.ts', { '@/lib/storage': { presignPut: async (cfg, bucket) => 'https://r2.test.invalid/' + bucket, ...storage } }) }

test('origens incluem www e domínio sem www; produção não aceita domínio arbitrário nem localhost', () => {
  const lib = cors({})
  const origins = lib.uploadOrigins({ NODE_ENV: 'production', VERCEL_URL: 'project-123.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'attacker.invalid' })
  assert.ok(origins.includes(origin)); assert.ok(origins.includes('https://clickgruda.com.br')); assert.ok(origins.includes('https://project-123.vercel.app'))
  assert.equal(origins.some(value => value.includes('attacker') || value.includes('localhost') || value === '*'), false)
})

test('completar CORS preserva outras regras e permissões anteriores; operação é idempotente', () => {
  const lib = cors({})
  const old = [{ ID: 'other-service', AllowedOrigins: ['https://other.invalid'], AllowedMethods: ['POST'] }, { ID: 'clickgruda-browser-upload', AllowedOrigins: ['https://old.invalid'], AllowedMethods: ['DELETE'], ExposeHeaders: ['X-Other'] }]
  const merged = lib.mergeUploadCorsRules(old, [origin])
  assert.deepEqual(merged[0], old[0]); assert.ok(merged[1].AllowedOrigins.includes('https://old.invalid'))
  assert.ok(merged[1].AllowedMethods.includes('DELETE')); assert.ok(merged[1].AllowedMethods.includes('PUT')); assert.ok(merged[1].ExposeHeaders.includes('X-Other'))
  assert.deepEqual(lib.mergeUploadCorsRules(merged, [origin]), merged)
})

test('CORS válido é confirmado por OPTIONS sem exigir permissão administrativa do bucket', async () => {
  let requests = 0
  global.fetch = async (url, options) => { requests++; assert.equal(options.method, 'OPTIONS'); assert.equal(options.headers.Origin, origin); return allowed() }
  const result = await cors({ makeR2Client: async () => { throw Error('Não deve consultar configuração') } }).diagnoseR2Cors(cfg, origin, true)
  assert.equal(result.ok, true); assert.equal(requests, 2); assert.ok(result.buckets.every(bucket => !bucket.repaired))
  assert.equal(JSON.stringify(result).includes(cfg.secretAccessKey), false)
})

test('modo check não modifica o bucket e testa uma vez quando ambos usam o mesmo nome', async () => {
  let requests = 0
  global.fetch = async () => { requests++; return missing() }
  const result = await cors({ makeR2Client: async () => { throw Error('Não deve modificar') } }).diagnoseR2Cors({ ...cfg, previewsBucket: cfg.originalsBucket }, origin, false)
  assert.equal(result.ok, false); assert.equal(requests, 1); assert.equal(result.buckets.length, 1)
})

test('permissão negada ao consultar CORS nunca apaga regras nem afirma que corrigiu', async () => {
  let writes = 0
  global.fetch = async () => missing()
  const result = await cors({ makeR2Client: async () => ({ send: async command => { if (command.constructor.name === 'PutBucketCorsCommand') writes++; throw Object.assign(new Error('sensitive server detail'), { name: 'AccessDenied' }) } }) }).diagnoseR2Cors(cfg, origin, true)
  assert.equal(result.ok, false); assert.equal(writes, 0); assert.ok(result.buckets.every(bucket => bucket.code === 'AccessDenied' && !bucket.repaired))
  assert.equal(JSON.stringify(result).includes('sensitive server detail'), false)
})

test('reparo mantém regras existentes, grava só CORS e confirma preflight após gravar', async () => {
  const done = new Set(), writes = []
  global.fetch = async url => done.has(url.split('/').pop()) ? allowed() : missing()
  const oldRule = { ID: 'another-application', AllowedMethods: ['GET'], AllowedOrigins: ['https://legacy.invalid'] }
  const result = await cors({ makeR2Client: async () => ({ send: async command => {
    if (command.constructor.name === 'GetBucketCorsCommand') return { CORSRules: [oldRule] }
    assert.equal(command.constructor.name, 'PutBucketCorsCommand'); writes.push(command.input); done.add(command.input.Bucket); return {}
  } }) }).diagnoseR2Cors(cfg, origin, true)
  assert.equal(result.ok, true); assert.equal(writes.length, 2)
  for (const write of writes) { assert.deepEqual(write.CORSConfiguration.CORSRules[0], oldRule); assert.ok(write.CORSConfiguration.CORSRules[1].AllowedOrigins.includes(origin)) }
})

test('falha de rede não é declarada como CORS nem altera configurações', async () => {
  global.fetch = async () => { throw new TypeError('network failed') }
  const result = await cors({ makeR2Client: async () => { throw Error('Não deve escrever') } }).diagnoseR2Cors(cfg, origin, true)
  assert.equal(result.ok, false); assert.ok(result.buckets.every(bucket => bucket.code === 'R2Unavailable'))
})

test('API restringe administração, origem e entrada; não usa configurações enviadas no corpo', async () => {
  let role = 'USER', calls = 0
  const { POST } = load('src/app/api/admin/upload/cors/route.ts', {
    '@/lib/auth': { getSessionUser: async () => ({ role }), jsonError: (error, status) => Response.json({ error }, { status }) },
    '@/lib/storage': { getR2Config: async () => cfg },
    '@/lib/r2-cors': { uploadOrigins: () => [origin], diagnoseR2Cors: async (actualCfg, actualOrigin, repair) => { calls++; assert.equal(actualCfg, cfg); assert.equal(actualOrigin, origin); assert.equal(repair, true); return { ok: true } } },
  })
  const request = (requestOrigin = origin, body = { mode: 'repair', endpoint: 'https://attacker.invalid' }) => new Request(origin + '/api/admin/upload/cors', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: requestOrigin }, body: JSON.stringify(body) })
  assert.equal((await POST(request())).status, 401); role = 'ADMIN'
  assert.equal((await POST(request('https://attacker.invalid'))).status, 403)
  assert.equal((await POST(request(origin, { mode: 'unknown' }))).status, 400)
  assert.equal((await POST(request())).status, 200); assert.equal(calls, 1)
})

function browserUpload() {
  global.Image = class { width = 1200; height = 600; set src(value) { queueMicrotask(() => this.onload()) } }
  global.document = { createElement: () => ({ getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob(['preview'], { type: 'image/webp' })) }) }
  return load('src/lib/art-upload.ts').uploadArtFile
}
const sign = { r2: true, originalKey: 'originals/test.png', originalType: 'image/png', originalPutUrl: 'https://r2.test.invalid/original', previewPutUrl: 'https://r2.test.invalid/preview', previewUrl: cfg.publicUrl + '/preview.webp' }
const file = () => new File(['original'], 'arte.png', { type: 'image/png' })

test('envio normal permanece direto aos dois buckets, sem reparo ou proxy da imagem pela Vercel', async () => {
  const upload = browserUpload(), sent = []
  global.fetch = async (url, options) => { sent.push(url); if (url === '/api/admin/upload/sign') return Response.json(sign); assert.equal(options.method, 'PUT'); assert.ok(options.body instanceof Blob); return new Response(null, { status: 200 }) }
  assert.deepEqual(await upload(file()), { imageUrl: sign.previewUrl, originalKey: sign.originalKey, r2: true })
  assert.equal(sent.length, 3); assert.equal(sent.includes('/api/admin/upload/cors'), false)
})

test('falha em apenas uma parte é reparada e repetida uma vez; parte já enviada não é reenviada', async () => {
  const upload = browserUpload(); let original = 0, preview = 0, fixes = 0
  global.fetch = async url => {
    if (url === '/api/admin/upload/sign') return Response.json(sign)
    if (url === '/api/admin/upload/cors') { fixes++; return Response.json({ ok: true }) }
    if (url === sign.originalPutUrl) original++
    if (url === sign.previewPutUrl && ++preview === 1) throw new TypeError('Failed to fetch')
    return new Response(null, { status: 200 })
  }
  assert.equal((await upload(file())).r2, true); assert.equal(fixes, 1); assert.equal(original, 1); assert.equal(preview, 2)
})

test('reparo sem permissão identifica o bucket e orienta o master; não oculta a falha', async () => {
  const upload = browserUpload()
  global.fetch = async url => {
    if (url === '/api/admin/upload/sign') return Response.json(sign)
    if (url === '/api/admin/upload/cors') return Response.json({ ok: false, buckets: [{ configured: false, label: 'Prévias', message: 'A chave não pode editar CORS.' }] })
    throw new TypeError('Failed to fetch')
  }
  await assert.rejects(upload(file()), /Prévias: A chave não pode editar CORS.*Verificar e corrigir upload/)
})

test('rede continua falhando após CORS confirmado: não acusa CORS e não entra em loop', async () => {
  const upload = browserUpload(); let sends = 0, fixes = 0
  global.fetch = async url => {
    if (url === '/api/admin/upload/sign') return Response.json(sign)
    if (url === '/api/admin/upload/cors') { fixes++; return Response.json({ ok: true }) }
    sends++; throw new TypeError('offline')
  }
  await assert.rejects(upload(file()), /CORS foi confirmada.*ainda falhou/); assert.equal(fixes, 1); assert.equal(sends, 4)
})

test('recusa explícita do R2 preserva o status, código e bucket em vez de acusar CORS', async () => {
  const upload = browserUpload()
  global.fetch = async url => url === '/api/admin/upload/sign' ? Response.json(sign) : new Response('<Error><Code>SignatureDoesNotMatch</Code></Error>', { status: 403 })
  await assert.rejects(upload(file()), /403 · SignatureDoesNotMatch.*bucket dos originais/)
})

test('SDK S3 real consulta e grava política via HTTP; preflight passa sem gravar objetos ou ACL', async () => {
  const writes = [], configured = new Set()
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost'), bucket = url.pathname.split('/')[1]
    if (req.method === 'OPTIONS') {
      if (!configured.has(bucket)) { res.writeHead(403); res.end(); return }
      res.writeHead(204, { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'PUT, GET, HEAD', 'Access-Control-Allow-Headers': 'content-type' }); res.end(); return
    }
    assert.ok(url.searchParams.has('cors'), 'Não deve gravar objeto nem mudar ACL')
    if (req.method === 'GET') { res.writeHead(404, { 'Content-Type': 'application/xml' }); res.end('<Error><Code>NoSuchCORSConfiguration</Code><Message>No CORS</Message></Error>'); return }
    assert.equal(req.method, 'PUT'); assert.equal(req.headers['x-amz-sdk-checksum-algorithm'], undefined)
    let body = ''; for await (const chunk of req) body += chunk
    assert.equal(req.headers['content-md5'], createHash('md5').update(body).digest('base64'))
    assert.match(req.headers.authorization, /SignedHeaders=[^ ]*content-md5/)
    assert.match(body, /<AllowedOrigin>https:\/\/www.clickgruda.com.br<\/AllowedOrigin>/)
    assert.match(body, /<AllowedMethod>PUT<\/AllowedMethod>/)
    writes.push(bucket); configured.add(bucket); res.writeHead(200); res.end()
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const localCfg = { ...cfg, endpoint: 'http://127.0.0.1:' + server.address().port }
    const storage = load('src/lib/storage.ts', { '@/lib/settings': {} })
    const result = await cors(storage).diagnoseR2Cors(localCfg, origin, true)
    assert.equal(result.ok, true); assert.deepEqual(writes.sort(), ['originais', 'previas'])
  } finally { await new Promise(resolve => server.close(resolve)) }
})

test('URLs assinadas reais de upload não levam checksum de um arquivo vazio e mantêm validade de dez minutos', async () => {
  const storage = load('src/lib/storage.ts', { '@/lib/settings': {} })
  const url = new URL(await storage.presignPut(cfg, cfg.originalsBucket, 'originals/arte.png', 'image/png'))
  assert.equal(url.searchParams.get('X-Amz-Expires'), '600')
  assert.equal(url.searchParams.has('x-amz-checksum-crc32'), false)
  assert.equal(url.searchParams.has('x-amz-sdk-checksum-algorithm'), false)
  assert.ok(url.pathname.includes('originals/arte.png'))
})
