import { createHash } from 'node:crypto'
import { db } from '@/lib/db'

function ipOf(req: Request) {
  return (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown').slice(0, 64)
}
function hashed(text: string) { return createHash('sha256').update(text).digest('hex') }
export function throttleKey(kind: string, input: string): string { return `${kind}:${hashed(input)}` }
export function requestIp(req: Request): string { return ipOf(req) }

export function isSafeOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false // não aceitar POST cross-site sem Origin
  try {
    const actual = new URL(origin)
    const own = new URL(req.url)
    return actual.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && actual.protocol === 'http:')
      ? actual.host === own.host || actual.origin === process.env.NEXT_PUBLIC_SITE_URL
      : false
  } catch { return false }
}

/** Rate limit persistente, não depende de memória local da função serverless. */
export async function isThrottled(key: string): Promise<boolean> {
  const current = await db.securityThrottle.findUnique({ where: { key } })
  return Boolean(current?.blockedUntil && current.blockedUntil > new Date())
}
export async function countAttempt(key: string, max: number, periodMinutes: number): Promise<void> {
  const now = new Date()
  const old = await db.securityThrottle.findUnique({ where: { key } })
  const expired = !old || old.updatedAt.getTime() < now.getTime() - periodMinutes * 60000
  const attempts = expired ? 1 : old.attempts + 1
  const blockedUntil = attempts >= max ? new Date(now.getTime() + periodMinutes * 60000) : null
  await db.securityThrottle.upsert({
    where: { key }, create: { key, attempts, blockedUntil },
    update: expired ? { attempts, blockedUntil } : { attempts: { increment: 1 }, ...(blockedUntil ? { blockedUntil } : {}) },
  })
}
export async function resetAttempt(key: string) { await db.securityThrottle.deleteMany({ where: { key } }) }

export async function verifyTurnstile(token: unknown, req: Request): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  // Em produção: falha fechada até ambas as credenciais serem configuradas.
  if (!secret) return process.env.NODE_ENV !== 'production'
  if (typeof token !== 'string' || token.length < 10 || token.length > 2048) return false
  const payload = new URLSearchParams({ secret, response: token, remoteip: ipOf(req) })
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: payload, signal: AbortSignal.timeout(6000), cache: 'no-store',
    })
    if (!response.ok) return false
    const data: { success?: boolean } = await response.json()
    return data.success === true
  } catch { return false }
}
