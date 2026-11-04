/** Configurações internas de analytics — sem guardar IP nos eventos de visita. */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'

export const ANALYTICS_IGNORE_COOKIE = 'cg_internal_analytics'
export const ANALYTICS_IGNORE_IPS_KEY = 'analytics:ignored-ips'
export const ANALYTICS_IGNORE_VISITORS_KEY = 'analytics:ignored-visitors'

export function visitorHash(visitorId: string) {
  return createHash('sha256').update(visitorId).digest('hex')
}

export function validVisitorId(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f-]{20,50}$/i.test(value)
}

export function readStringList(value: string | undefined | null): string[] {
  if (!value) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch { return [] }
}

function signingKey() {
  return process.env.AUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'click-gruda-dev-only-secret')
}

export function signedInternalCookie() {
  const key = signingKey()
  if (!key) throw new Error('AUTH_SECRET necessário para assinar o cookie interno.')
  const signature = createHmac('sha256', key).update('analytics-internal-v1').digest('hex')
  return `v1.${signature}`
}

export function isInternalCookie(value: string | undefined) {
  if (!value) return false
  const key = signingKey()
  if (!key) return false
  const expected = Buffer.from(signedInternalCookie())
  const actual = Buffer.from(value)
  return expected.length === actual.length && timingSafeEqual(actual, expected)
}

export function getClientIp(headers: Headers): string | null {
  // Vercel sobrescreve este cabeçalho na borda; não confie em IP enviado pelo corpo da requisição.
  const raw = headers.get('x-vercel-forwarded-for') || headers.get('x-forwarded-for') || headers.get('x-real-ip')
  const ip = raw?.split(',')[0]?.trim() ?? ''
  return isIP(ip) ? ip : null
}

export function validIgnoredIps(values: unknown): string[] | null {
  if (!Array.isArray(values) || values.length > 30) return null
  const ips = values.map(value => typeof value === 'string' ? value.trim() : '')
  if (ips.some(ip => !isIP(ip))) return null
  return [...new Set(ips)]
}
