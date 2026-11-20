import { requestIp } from '@/lib/security-guards'
import { caktoCheckoutUrl, caktoCheckoutUrlIntl } from './config'

/**
 * Roteamento do checkout Cakto por país do comprador.
 * Brasil -> checkout em real (R$ 47,90). Qualquer outro país detectado ->
 * checkout em dólar (US$ 17,50, ~€15 em Portugal). Na dúvida (IP privado,
 * geolocalização indisponível, sem sinal de Portugal) o padrão é o Brasil,
 * ou seja, o comportamento atual não muda para ninguém.
 */

const GEO_TTL_MS = 24 * 60 * 60 * 1000
const GEO_CACHE_MAX = 1000
const geoCache = new Map<string, { cc: string | null; exp: number }>()

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return true
  if (ip === '::1' || ip === '127.0.0.1') return true
  if (/^10\./.test(ip) || /^192\.168\./.test(ip) || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true
  if (/^(fc|fd)/i.test(ip) || /^fe80:/i.test(ip)) return true
  return false
}

function countryFromAcceptLanguage(req: Request): string | null {
  const al = req.headers.get('accept-language') || ''
  // pt-PT (Portugal). Qualquer outra variante cai no padrão Brasil.
  return /(^|,)\s*pt-PT/i.test(al) ? 'PT' : null
}

async function countryFromIp(ip: string): Promise<string | null> {
  const now = Date.now()
  const hit = geoCache.get(ip)
  if (hit && hit.exp > now) return hit.cc
  let cc: string | null = null
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(1500) })
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { country_code?: unknown } | null
      if (data && typeof data.country_code === 'string' && /^[A-Za-z]{2}$/.test(data.country_code)) cc = data.country_code.toUpperCase()
    }
  } catch {
    // Sem geolocalização: cai no padrão Brasil.
  }
  if (geoCache.size >= GEO_CACHE_MAX) geoCache.clear()
  geoCache.set(ip, { cc, exp: now + GEO_TTL_MS })
  return cc
}

export async function resolveBuyerCountry(req: Request): Promise<string | null> {
  const ip = requestIp(req)
  if (!isPrivateIp(ip)) {
    const cc = await countryFromIp(ip)
    if (cc) return cc
  }
  return countryFromAcceptLanguage(req)
}

export async function resolveCaktoCheckout(req: Request): Promise<{ url: string | null; country: string | null; currency: 'BRL' | 'USD' }> {
  const country = await resolveBuyerCountry(req)
  const intl = country !== null && country !== 'BR' ? caktoCheckoutUrlIntl() : null
  if (intl) return { url: intl, country, currency: 'USD' }
  return { url: caktoCheckoutUrl(), country, currency: 'BRL' }
}
