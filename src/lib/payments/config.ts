/** Fonte única do preço: o catálogo pode exibir condições definidas no Admin. */
export const LIFETIME_PRICE_CENTS = 4790
export const LIFETIME_CAMPAIGN_END = '2026-12-31T23:59:59-03:00'
function validCaktoUrl(raw: string | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'pay.cakto.com.br' || url.hostname.endsWith('.pay.cakto.com.br')) ? url.toString() : null
  } catch { return null }
}
export function caktoCheckoutUrl(): string | null {
  return validCaktoUrl(process.env.CAKTO_CHECKOUT_URL)
}
/** Checkout em dólar p/ quem compra de fora do Brasil (ex.: Portugal). */
export function caktoCheckoutUrlIntl(): string | null {
  return validCaktoUrl(process.env.CAKTO_CHECKOUT_URL_INTL)
}
