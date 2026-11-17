import { timingSafeEqual } from 'node:crypto'
import { moneyCents } from './cakto'
import type { PaymentProvider, NormalizedPaymentEvent, PaymentEventKind } from './provider'

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function equalSafe(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8'); const b = Buffer.from(right, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
function kindOf(value: string): PaymentEventKind {
  const evt = value.trim().toUpperCase()
  if (evt === 'PURCHASE_APPROVED' || evt === 'PURCHASE_COMPLETE') return 'PAGO'
  if (evt === 'PURCHASE_REFUNDED') return 'REEMBOLSADO'
  if (evt === 'PURCHASE_CHARGEBACK') return 'CHARGEBACK'
  // Cancelamento após aprovação revoga o acesso; se nunca houve pagamento,
  // o processador só registra a compra como REVOKED e nada é revogado.
  if (evt === 'PURCHASE_CANCELED') return 'REEMBOLSADO'
  return 'IGNORADO'
}

export class InvalidHotmartWebhook extends Error {}

/**
 * Webhook da Hotmart (Postback 2.0.0).
 * Verificação: a Hotmart envia o `hottok` no cabeçalho `x-hotmart-hottok` em
 * cada evento real. O disparo de teste do painel vem SEM o hottok e é
 * recusado — isso é o comportamento esperado, a venda real vem com o token.
 * O hottok é gerado pela Hotmart ao criar o webhook e vai para a env
 * HOTMART_HOTTOK (nunca no código).
 */
export const hotmartProvider: PaymentProvider = {
  name: 'HOTMART',
  checkoutUrl(_email: string) {
    // A venda acontece no checkout da Hotmart; não há URL de checkout própria.
    return null
  },
  verify(raw, headers) {
    const secret = process.env.HOTMART_HOTTOK
    if (!secret || secret.length < 8) throw new InvalidHotmartWebhook('Credencial de webhook ausente')
    let payload: unknown
    try { payload = JSON.parse(raw) } catch { throw new InvalidHotmartWebhook('JSON inválido') }
    const hottok = headers.get('x-hotmart-hottok')
    if (!hottok || !equalSafe(hottok, secret)) throw new InvalidHotmartWebhook('Origem inválida')
    return payload
  },
  normalize(payload) {
    const body = record(payload)
    const type = typeof body.event === 'string' ? body.event.trim() : ''
    const kind = kindOf(type)
    const data = record(body.data)
    const buyer = record(data.buyer)
    const purchase = record(data.purchase)
    const price = record(purchase.price)
    const email = typeof buyer.email === 'string' ? buyer.email.trim().toLowerCase() : ''
    const transaction = typeof purchase.transaction === 'string' || typeof purchase.transaction === 'number'
      ? String(purchase.transaction).trim() : ''
    const currency = typeof price.currency_value === 'string' ? price.currency_value.toUpperCase() : null
    const event: NormalizedPaymentEvent = {
      kind: (transaction && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? kind : 'IGNORADO',
      type: type || 'unknown',
      externalId: transaction || 'invalid-hotmart',
      reference: transaction || 'invalid-hotmart',
      email,
      finance: {
        amountCents: currency === 'BRL' ? moneyCents(price.value) : null,
        currency,
        paidAt: null,
        method: 'HOTMART',
      },
    }
    return [event]
  },
}
