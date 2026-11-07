import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

const issuer = 'https://token.actions.githubusercontent.com'
const audience = 'https://www.clickgruda.com.br/api/integrations/studio/retry'
const repository = 'viniciusspgo2-creator/clickgruda'
const ref = 'refs/heads/main'
const workflow = `${repository}/.github/workflows/studio-bonus-retry.yml@${ref}`
const githubKeys = createRemoteJWKSet(new URL(issuer + '/.well-known/jwks'), {
  timeoutDuration: 5000,
  cooldownDuration: 30000,
  cacheMaxAge: 600000,
})

/** A chave é injetável para verificar assinaturas reais em testes isolados. */
export async function verifyBonusWorkflowToken(
  token: string,
  verificationKey: JWTVerifyGetKey,
) {
  try {
    const { payload } = await jwtVerify(token, verificationKey, {
      issuer,
      audience,
      algorithms: ['RS256'],
      maxTokenAge: '5m',
      clockTolerance: 5,
    })
    const claims = {
      exp: typeof payload.exp === 'number',
      repository: payload.repository === repository,
      repository_id: payload.repository_id === '1402578509',
      repository_owner_id: payload.repository_owner_id === '327950105',
      ref: payload.ref === ref,
      workflow_ref: payload.workflow_ref === workflow,
      // O GitHub permite personalizar o formato de sub. A autorização permanece
      // vinculada aos IDs imutáveis + repositório/workflow/ref assinados acima.
      sub: typeof payload.sub === 'string' && payload.sub.trim().length > 0 && payload.sub.length <= 2048,
      runner_environment: payload.runner_environment === 'github-hosted',
      event_name: (payload.event_name === 'schedule' ||
        payload.event_name === 'workflow_dispatch' ||
        payload.event_name === 'push'),
    }
    const rejected = Object.entries(claims).filter(([, valid]) => !valid)
    if (rejected.length)
      console.warn('Studio retry identity rejected: claims', rejected.map(([key]) => key).join(','))
    return rejected.length === 0
  } catch (error) {
    // Apenas categoria fixa do erro; nunca registrar token, assinatura ou claims recebidos.
    if (token.split('.').length === 3) {
      const claim = error && typeof error === 'object' && 'claim' in error &&
        typeof error.claim === 'string' && ['aud', 'iss', 'iat', 'exp', 'nbf'].includes(error.claim)
        ? error.claim : ''
      console.warn('Studio retry identity rejected: verification', error instanceof Error ? error.name : 'unknown', claim)
    }
    return false
  }
}

/** Nunca aceita um token de outro workflow, fork, branch ou destinatário. */
export async function validBonusGithubAction(req: Request) {
  if (process.env.STUDIO_BONUS_GITHUB_OIDC_ENABLED !== '1') return false
  const bearer = req.headers.get('authorization') ?? ''
  if (bearer.length > 16400 || !bearer.startsWith('Bearer ')) return false
  return verifyBonusWorkflowToken(bearer.slice(7), githubKeys)
}
