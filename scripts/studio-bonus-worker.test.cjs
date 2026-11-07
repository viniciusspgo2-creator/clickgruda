/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner CJS, como os testes existentes. */
const { test, before } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } = require('jose')
const source = fs.readFileSync(path.join(__dirname, '../src/lib/studio-bonus-worker-auth.ts'), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText
const loaded = { exports: {} }
new Function('require', 'module', 'exports', compiled)(require, loaded, loaded.exports)
const { verifyBonusWorkflowToken, validBonusGithubAction } = loaded.exports
let privateKey, otherKey, keys
const repository = 'viniciusspgo2-creator/clickgruda'
before(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  otherKey = (await generateKeyPair('RS256')).privateKey
  keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'test', alg: 'RS256' }] })
})
async function token(changes = {}, signer = privateKey) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    iss: 'https://token.actions.githubusercontent.com',
    aud: 'https://www.clickgruda.com.br/api/integrations/studio/retry',
    sub: `repo:${repository}:ref:refs/heads/main`,
    repository,
    repository_id: '1402578509',
    repository_owner_id: '327950105',
    ref: 'refs/heads/main',
    workflow_ref: `${repository}/.github/workflows/studio-bonus-retry.yml@refs/heads/main`,
    runner_environment: 'github-hosted',
    event_name: 'schedule',
    iat: now,
    exp: now + 300,
    ...changes,
  }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).sign(signer)
}
test('aceita workflow agendado com assinatura e identidade corretas', async () => {
  assert.equal(await verifyBonusWorkflowToken(await token(), keys), true)
})
test('aceita execução manual somente da main', async () => {
  assert.equal(await verifyBonusWorkflowToken(await token({ event_name: 'workflow_dispatch' }), keys), true)
})
for (const [name, changes] of [
  ['outro emissor', { iss: 'https://example.com' }],
  ['outro destinatário', { aud: 'https://example.com' }],
  ['fork', { repository: 'outro/clickgruda' }],
  ['repositório recriado com mesmo nome', { repository_id: '1' }],
  ['outro proprietário', { repository_owner_id: '1' }],
  ['outra branch', { ref: 'refs/heads/feature' }],
  ['outro workflow', { workflow_ref: `${repository}/.github/workflows/other.yml@refs/heads/main` }],
  ['subject de pull request', { sub: `repo:${repository}:pull_request` }],
  ['evento de pull request', { event_name: 'pull_request' }],
  ['runner externo', { runner_environment: 'self-hosted' }],
  ['token expirado', { iat: 1, exp: 2 }],
  ['token antigo apesar de validade futura', { iat: Math.floor(Date.now() / 1000) - 3600 }],
  ['token futuro', { iat: Math.floor(Date.now() / 1000) + 3600 }],
  ['sem expiração', { exp: undefined }],
  ['sem emissão', { iat: undefined }],
  ['sem identidade do workflow', { workflow_ref: undefined }],
]) test(`recusa ${name}`, async () => {
  assert.equal(await verifyBonusWorkflowToken(await token(changes), keys), false)
})
test('recusa assinatura de outra chave', async () => {
  assert.equal(await verifyBonusWorkflowToken(await token({}, otherKey), keys), false)
})
test('recusa JWT malformado', async () => {
  assert.equal(await verifyBonusWorkflowToken('invalid', keys), false)
})
test('OIDC fica fechado por padrão; limita o cabeçalho antes de buscar chaves', async () => {
  const prior = process.env.STUDIO_BONUS_GITHUB_OIDC_ENABLED
  try {
    delete process.env.STUDIO_BONUS_GITHUB_OIDC_ENABLED
    assert.equal(await validBonusGithubAction(new Request('https://local')), false)
    process.env.STUDIO_BONUS_GITHUB_OIDC_ENABLED = '1'
    assert.equal(await validBonusGithubAction(new Request('https://local')), false)
    assert.equal(await validBonusGithubAction(new Request('https://local', { headers: { authorization: 'Bearer ' + 'a'.repeat(16400) } })), false)
  } finally {
    if (prior === undefined) delete process.env.STUDIO_BONUS_GITHUB_OIDC_ENABLED
    else process.env.STUDIO_BONUS_GITHUB_OIDC_ENABLED = prior
  }
})
