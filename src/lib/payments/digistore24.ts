import { createHash, timingSafeEqual } from 'node:crypto'
import { moneyCents } from './cakto'
import type { PaymentProvider, NormalizedPaymentEvent, PaymentEventKind } from './provider'

function equalSafe(left: string, right: string): boolean {
  const a = Buffer.from(left, 'utf8'); const b = Buffer.from(right, 'utf8')
  return a.length === b.length && timingSafeEqual(a, b)
}
function kindOf(event: string): PaymentEventKind {
  const evt = event.trim().toLowerCase()
  if (evt === 'on_payment') return 'PAGO'
  if (evt === 'on_refund') return 'REEMBOLSADO'
  if (evt === 'on_chargeback') return 'CHARGEBACK'
  // on_payment_missed, on_rebill_cancelled, last_paid_day e payment_denial
  // só existem para assinaturas/parcelas. O produto é pagamento único
  // vitalício, então não revogam nada: o estorno tem evento próprio
  // (on_refund / on_chargeback) e é ele que revoga o acesso.
  return 'IGNORADO'
}

export class InvalidDigistore24Webhook extends Error {}

/**
 * Webhook da Digistore24 (IPN — Instant Payment Notification).
 * Verificação: a Digistore24 envia o POST como form-urlencoded e assina
 * TODOS os parâmetros (exceto o próprio `sha_sign`) com SHA512: ordena os
 * nomes sem diferenciar maiúsculas/minúsculas e concatena
 * `nome=valor` + frase-secreta para cada parâmetro, inclusive o último.
 * A assinatura chega em `sha_sign` (hex maiúsculo). A frase-secreta é a
 * "IPN password" definida na conexão IPN (Settings → Integrations → IPN)
 * e vai para a env DIGISTORE24_IPN_PASSPHRASE (nunca no código).
 * O teste de conexão ("Test connection") faz um GET na URL e exige HTTP
 * 200 — por isso a rota responde GET com "OK" — e também envia um POST
 * com event=connection_test, que é registrado como IGNORADO.
 */
function parseForm(raw: string): Map<string, string> {
  const params = new URLSearchParams(raw)
  const out = new Map<string, string>()
  for (const [key, value] of params.entries()) {
    if (!out.has(key)) out.set(key, value)
  }
  return out
}

export function digistore24Signature(params: Map<string, string>, passphrase: string): string {
  const names = [...params.keys()].filter((name) => name !== 'sha_sign')
  names.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  let input = ''
  for (const name of names) input += `${name}=${params.get(name) ?? ''}${passphrase}`
  return createHash('sha512').update(input, 'utf8').digest('hex').toUpperCase()
}

export const digistore24Provider: PaymentProvider = {
  name: 'DIGISTORE24',
  checkoutUrl(_email: string) {
    // A venda acontece no checkout da Digistore24; não há URL de checkout própria.
    return null
  },
  verify(raw, _headers) {
    const secret = process.env.DIGISTORE24_IPN_PASSPHRASE
    if (!secret || secret.length < 8) throw new InvalidDigistore24Webhook('Credencial de webhook ausente')
    const params = parseForm(raw)
    const received = params.get('sha_sign')
    if (!received) throw new InvalidDigistore24Webhook('Assinatura ausente')
    const expected = digistore24Signature(params, secret)
    if (!equalSafe(received.toUpperCase(), expected)) {
      console.warn('[digistore24] webhook recusado: assinatura inválida', { fields: [...params.keys()].sort() })
      throw new InvalidDigistore24Webhook('Origem inválida')
    }
    return params
  },
  normalize(payload) {
    const params = payload instanceof Map ? payload as Map<string, string> : new Map<string, string>()
    const get = (name: string): string => params.get(name) ?? ''
    const event = get('event').trim()
    const kind = kindOf(event)
    const email = get('email').trim().toLowerCase()
    const paymentId = get('payment_id').trim()
    const orderId = get('order_id').trim()
    const externalId = paymentId || orderId || 'invalid-digistore24'
    const currency = get('transaction_currency').trim().toUpperCase() || get('currency').trim().toUpperCase() || null
    const event2: NormalizedPaymentEvent = {
      kind: (externalId !== 'invalid-digistore24' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ? kind : 'IGNORADO',
      type: event || 'unknown',
      externalId,
      reference: externalId,
      email,
      finance: {
        amountCents: moneyCents(get('transaction_amount')),
        currency,
        paidAt: null,
        method: get('pay_method') ? get('pay_method').slice(0, 40) : 'DIGISTORE24',
      },
    }
    return [event2]
  },
}
