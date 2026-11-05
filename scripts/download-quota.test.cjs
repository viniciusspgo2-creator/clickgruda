const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

/** Small dependency-free test harness for quota logic; real PostgreSQL row locking
 * requires integration tests against the deployment database. */
function makeQuotaModule(limit, initialDownloads = 0) {
  let used = initialDownloads
  let artUpdates = 0
  const profile = { downloadLimit: limit }
  const tx = {
    $queryRaw: async () => [{ id: 'user-1' }],
    download: { count: async () => used, create: async () => { used++; return {} } },
    art: { update: async () => { artUpdates++; return {} } },
  }
  const db = { $transaction: async callback => callback(tx), download: tx.download }
  const source = fs.readFileSync('src/lib/download-quota.ts', 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  const context = { exports, require(name) { if (name === '@/lib/db') return { db }; if (name === '@/lib/member-profile') return { getMemberProfile: async () => profile }; throw Error(name) } }
  vm.runInNewContext(compiled, context)
  return { exports, getUsed: () => used, getArtUpdates: () => artUpdates }
}
const user = { id: 'user-1', role: 'USER', isDemo: false }
test('unlimited accounts never report a quota', async () => {
  const app = makeQuotaModule(null)
  assert.equal(await app.exports.getDownloadQuota(user), null)
  await app.exports.recordSuccessfulDownload(user, 'art1', false)
  assert.equal(app.getUsed(), 1)
})
test('capped account reaches limit after X downloads and then denies another', async () => {
  const app = makeQuotaModule(2)
  assert.deepEqual(JSON.parse(JSON.stringify(await app.exports.getDownloadQuota(user))), { used: 0, limit: 2, remaining: 2, exhausted: false })
  await app.exports.recordSuccessfulDownload(user, 'art1', false)
  await app.exports.recordSuccessfulDownload(user, 'art1', false)
  await assert.rejects(app.exports.recordSuccessfulDownload(user, 'art1', false), /limite de downloads de teste terminou/i)
  assert.equal(app.getUsed(), 2)
  assert.equal(app.getArtUpdates(), 2)
  assert.equal((await app.exports.getDownloadQuota(user)).exhausted, true)
})
test('zero-download trial starts protected, existing downloads count toward cap', async () => {
  assert.equal((await makeQuotaModule(0).exports.getDownloadQuota(user)).exhausted, true)
  assert.equal((await makeQuotaModule(3, 3).exports.getDownloadQuota(user)).remaining, 0)
})
