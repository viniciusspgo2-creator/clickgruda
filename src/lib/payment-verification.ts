import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Payment } from '@prisma/client'
import { db } from '@/lib/db'
import { approvePayment } from '@/lib/payments'

export type GatewaySnapshot = {
  id: string; status: 'APPROVED' | 'PENDING' | 'FAILED' | 'EXPIRED'
  amountCents: number; currency: string; reference: string | null
}

export async function fetchGatewayPayment(provider: string, externalId: string, settings: Record<string, string>): Promise<GatewaySnapshot> {
  const isMP = provider === 'MERCADOPAGO'
  const base = settings.asaas_sandbox === 'true' ? 'https://api-sandbox.asaas.com' : 'https://api.asaas.com'
  const url = isMP ? `https://api.mercadopago.com/v1/payments/${encodeURIComponent(externalId)}` : `${base}/v3/payments/${encodeURIComponent(externalId)}`
  const headers: Record<string, string> = isMP ? { Authorization: `Bearer ${settings.mercadopago_access_token}` } : { access_token: settings.asaas_api_key }
  const response = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Não foi possível consultar o pagamento no gateway.')
  const data = await response.json()
  if (String(data.id) !== externalId) throw new Error('Identificador inesperado na consulta do pagamento.')
  const approved = isMP ? data.status === 'approved' : ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(data.status)
  const failed = isMP ? ['cancelled', 'rejected', 'refunded', 'charged_back'].includes(data.status) : ['REFUNDED', 'DELETED'].includes(data.status)
  const expired = !isMP && data.status === 'OVERDUE'
  return {
    id: String(data.id), status: approved ? 'APPROVED' : failed ? 'FAILED' : expired ? 'EXPIRED' : 'PENDING',
    amountCents: Math.round(Number(isMP ? data.transaction_amount : data.value) * 100),
    currency: isMP ? String(data.currency_id) : 'BRL',
    reference: isMP ? data.external_reference || null : data.externalReference || null,
  }
}

export function paymentMatches(payment: Pick<Payment, 'id' | 'externalId' | 'amountCents'>, snapshot: GatewaySnapshot): boolean {
  // Pedidos antigos não tinham external_reference; o ID externo exato ainda é aceito.
  const linked = snapshot.reference ? snapshot.reference === payment.id : Boolean(payment.externalId && snapshot.id === payment.externalId)
  return linked && (!payment.externalId || payment.externalId === snapshot.id) && snapshot.currency === 'BRL'
    && Number.isSafeInteger(snapshot.amountCents) && snapshot.amountCents === payment.amountCents
}

export async function synchronizePayment(payment: Payment, settings: Record<string, string>, snapshot?: GatewaySnapshot) {
  if (!snapshot && !payment.externalId) return
  const verified = snapshot || await fetchGatewayPayment(payment.provider, payment.externalId!, settings)
  if (!paymentMatches(payment, verified)) throw new Error('O pagamento consultado não corresponde ao pedido.')
  if (verified.status === 'APPROVED') await approvePayment(payment.id)
  else if (verified.status === 'FAILED' || verified.status === 'EXPIRED') await db.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: verified.status } })
}

export function validMercadoPagoSignature(req: Request, dataId: string, secret: string): boolean {
  if (!secret) return true // Sem chave: a aprovação ainda exige confirmação autenticada na API e valores iguais.
  const signature = req.headers.get('x-signature') || ''
  const requestId = req.headers.get('x-request-id') || ''
  const parts = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')))
  if (!requestId || !/^\d+$/.test(parts.ts || '') || !/^[a-f0-9]{64}$/i.test(parts.v1 || '')) return false
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(parts.v1, 'hex'))
}
