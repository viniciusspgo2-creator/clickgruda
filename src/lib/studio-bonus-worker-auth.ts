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
    return (
      typeof payload.exp === 'number' &&
      payload.repository === repository &&
      payload.repository_id === '1402578509' &&
      payload.repository_owner_id === '327950105' &&
      payload.ref === ref &&
      payload.workflow_ref === workflow &&
      payload.sub === `repo:${repository}:ref:${ref}` &&
      payload.runner_environment === 'github-hosted' &&
      (payload.event_name === 'schedule' ||
        payload.event_name === 'workflow_dispatch' ||
        payload.event_name === 'push')
    )
  } catch {
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
