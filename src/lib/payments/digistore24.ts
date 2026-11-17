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
 * os parâmetros com SHA512. Algoritmo OFICIAL (ds24-appkit, lib/digistore/
 * ipn.ts — per the official DS24 example sha_sign.php):
 *   1. Remove `sha_sign` e `SHASIGN`.
 *   2. Ordena as chaves por ordem de bytes (SORT_STRING, como o ksort do PHP).
 *   3. PULA valores vazios (undefined/null/"") — NÃO entram na assinatura.
 *   4. Concatena `CHAVE=VALOR` + frase-secreta para cada parâmetro.
 *   5. SHA512, hex maiúsculo. Compara sem diferenciar maiúsculas/minúsculas.
 * A verificação aceita as duas convenções de caixa das chaves (original e
 * maiúscula), como o verifyIpnSignature oficial — as duas exigem a
 * frase-secreta, então aceitar as duas não custa segurança. A frase-secreta
 * é a "IPN password" definida na conexão IPN (Settings → Integrations → IPN)
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

export function digistore24Signature(params: Map<string, string>, passphrase: string, uppercaseKeys = false): string {
  const entries = [...params.entries()]
    .filter(([key]) => {
      const up = key.toUpperCase()
      return up !== 'SHA_SIGN' && up !== 'SHASIGN'
    })
    .map(([key, value]) => ({ key: uppercaseKeys ? key.toUpperCase() : key, value }))
    // SORT_STRING: ordem de bytes, como o ksort(SORT_STRING) do PHP.
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
  let input = ''
  for (const { key, value } of entries) {
    if (value === undefined || value === null || value === '') continue
    input += `${key}=${value}${passphrase}`
  }
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
    const received = params.get('sha_sign') ?? params.get('SHASIGN')
    if (!received) throw new InvalidDigistore24Webhook('Assinatura ausente')
    const ok = [false, true].some((uppercaseKeys) => equalSafe(received.toUpperCase(), digistore24Signature(params, secret, uppercaseKeys)))
    if (!ok) {
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
