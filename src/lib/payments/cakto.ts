import { createHmac, timingSafeEqual } from 'node:crypto'
import { caktoCheckoutUrl } from './config'
import type { PaymentProvider, NormalizedPaymentEvent, PaymentEventKind } from './provider'

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function equalSafe(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8'); const b = Buffer.from(right, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
function kindOf(value: string): PaymentEventKind {
  const evt = value.toLowerCase()
  if (evt === 'purchase_approved' || evt === 'payment_approved') return 'PAGO'
  if (evt.includes('refund') || evt.includes('reembols')) return 'REEMBOLSADO'
  if (evt.includes('chargeback')) return 'CHARGEBACK'
  return 'IGNORADO'
}

export class InvalidCaktoWebhook extends Error {}

export const caktoProvider: PaymentProvider = {
  name: 'CAKTO',
  checkoutUrl(_email: string) {
    // Não pressupõe prefill; checkout solicita e-mail igual ao da conta.
    return caktoCheckoutUrl()
  },
  verify(raw, headers) {
    const secret = process.env.CAKTO_WEBHOOK_SECRET
    if (!secret || secret.length < 16) throw new InvalidCaktoWebhook('Credencial de webhook ausente')
    let payload: unknown
    try { payload = JSON.parse(raw) } catch { throw new InvalidCaktoWebhook('JSON inválido') }
    const body = record(payload)
    if (typeof body.secret !== 'string' || !equalSafe(body.secret, secret)) throw new InvalidCaktoWebhook('Origem inválida')
    const stamp = headers.get('x-cakto-timestamp')
    const signature = headers.get('x-cakto-signature')
    // Caso a Cakto passe ambos os cabeçalhos, valida a assinatura adicionalmente.
    if (Boolean(stamp) !== Boolean(signature)) throw new InvalidCaktoWebhook('Assinatura incompleta')
    if (stamp && signature) {
      if (!/^\d{10,13}$/.test(stamp)) throw new InvalidCaktoWebhook('Timestamp inválido')
      const numeric = Number(stamp)
      const millis = stamp.length === 10 ? numeric * 1000 : numeric
      if (!Number.isFinite(millis) || Math.abs(Date.now() - millis) > 5 * 60 * 1000) throw new InvalidCaktoWebhook('Assinatura expirada')
      const expected = 'v1=' + createHmac('sha256', secret).update(`${stamp}.${raw}`).digest('hex')
      if (!equalSafe(signature.toLowerCase(), expected)) throw new InvalidCaktoWebhook('Assinatura inválida')
    }
    return payload
  },
  normalize(payload) {
    const body = record(payload)
    const type = typeof body.event === 'string' ? body.event.trim().toLowerCase() : ''
    const kind = kindOf(type)
    const items: unknown[] = Array.isArray(body.data) ? body.data : [body.data]
    return items.map((item, index): NormalizedPaymentEvent => {
      const data = record(item)
      const customer = record(data.customer)
      const email = typeof customer.email === 'string' ? customer.email.trim().toLowerCase() : ''
      const id = typeof data.id === 'string' || typeof data.id === 'number' ? String(data.id).trim() : ''
      const reference = typeof data.refId === 'string' ? data.refId.trim() : id
      // Sem identificador externo, não processar aprovação/revogação: impossível garantir idempotência.
      return { kind: (id && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? kind : 'IGNORADO', type: type || 'unknown', externalId: id || `invalid-${index}`, reference, email }
    })
  },
}
