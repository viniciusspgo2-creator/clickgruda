/** Fonte única do preço: o catálogo pode exibir condições definidas no Admin. */
export const LIFETIME_PRICE_CENTS = 4790
export const LIFETIME_CAMPAIGN_END = '2026-12-31T23:59:59-03:00'
export function caktoCheckoutUrl(): string | null {
  const raw = process.env.CAKTO_CHECKOUT_URL?.trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && (url.hostname === 'pay.cakto.com.br' || url.hostname.endsWith('.pay.cakto.com.br')) ? url.toString() : null
  } catch { return null }
}
