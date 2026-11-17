import { timingSafeEqual } from 'node:crypto'
import type { PaymentProvider, NormalizedPaymentEvent, PaymentEventKind } from './provider'

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function equalSafe(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8'); const b = Buffer.from(right, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
function kindOf(eventType: string, orderStatus: string): PaymentEventKind {
  const evt = eventType.trim().toLowerCase()
  const status = orderStatus.trim().toLowerCase()
  if (evt === 'order_approved' && status === 'paid') return 'PAGO'
  if (evt === 'order_refunded' || status === 'refunded') return 'REEMBOLSADO'
  if (evt === 'order_chargedback' || status === 'chargedback') return 'CHARGEBACK'
  return 'IGNORADO'
}

export class InvalidKiwifyWebhook extends Error {}

/**
 * Webhook da Kiwify (Apps → Webhooks).
 * Verificação: a Kiwify gera um token ao criar o webhook e o envia DENTRO do
 * payload. O nome exato do campo varia conforme a versão do painel, por isso
 * aceitamos `token`, `webhook_token` ou `secret` — a segurança está no valor,
 * comparado com timingSafeEqual contra KIWIFY_WEBHOOK_TOKEN (nunca no código).
 * Em caso de falha, o log registra só os NOMES dos campos recebidos (nunca
 * valores) para diagnosticar o campo correto sem expor o segredo.
 */
export const kiwifyProvider: PaymentProvider = {
  name: 'KIWIFY',
  checkoutUrl(_email: string) {
    // A venda acontece no checkout da Kiwify; não há URL de checkout própria.
    return null
  },
  verify(raw, _headers) {
    const secret = process.env.KIWIFY_WEBHOOK_TOKEN
    if (!secret || secret.length < 8) throw new InvalidKiwifyWebhook('Credencial de webhook ausente')
    let payload: unknown
    try { payload = JSON.parse(raw) } catch { throw new InvalidKiwifyWebhook('JSON inválido') }
    const body = record(payload)
    const candidates = [body.token, body.webhook_token, body.secret]
    const received = candidates.find((value) => typeof value === 'string' && value.length > 0)
    if (typeof received !== 'string' || !equalSafe(received, secret)) {
      console.warn('[kiwify] webhook recusado: token ausente ou inválido', { fields: Object.keys(body).sort() })
      throw new InvalidKiwifyWebhook('Origem inválida')
    }
    return payload
  },
  normalize(payload) {
    const body = record(payload)
    const eventType = typeof body.webhook_event_type === 'string' ? body.webhook_event_type : ''
    const orderStatus = typeof body.order_status === 'string' ? body.order_status : ''
    const kind = kindOf(eventType, orderStatus)
    // A Kiwify usa objetos com inicial maiúscula: Customer, Product, Commissions.
    const customer = record(body.Customer)
    const commissions = record(body.Commissions)
    const email = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : ''
    const orderId = typeof body.order_id === 'string' || typeof body.order_id === 'number'
      ? String(body.order_id).trim() : ''
    // Commissions.charge_amount já vem em centavos.
    const chargeAmount = typeof commissions.charge_amount === 'number' && Number.isSafeInteger(commissions.charge_amount) && commissions.charge_amount >= 0
      ? commissions.charge_amount : null
    const event: NormalizedPaymentEvent = {
      kind: (orderId && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? kind : 'IGNORADO',
      type: eventType || 'unknown',
      externalId: orderId || 'invalid-kiwify',
      reference: orderId || 'invalid-kiwify',
      email,
      finance: {
        amountCents: chargeAmount,
        currency: 'BRL',
        paidAt: null,
        method: typeof body.payment_method === 'string' ? body.payment_method.slice(0, 40) : 'KIWIFY',
      },
    }
    return [event]
  },
}
