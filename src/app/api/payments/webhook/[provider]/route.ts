import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { checkMercadoPagoPayment, checkAsaasPayment, approvePayment } from '@/lib/payments'

/**
 * Webhook unificado para gateways:
 *  - Mercado Pago: POST /api/payments/webhook/mercadopago  body: { data: { id } }
 *  - Asaas:        POST /api/payments/webhook/asaas        body: { event, payment: { id } }
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params
  const body = await req.json().catch(() => ({}))
  const settings = await getSettings()

  try {
    if (provider === 'mercadopago') {
      const externalId = body?.data?.id ? String(body.data.id) : body?.id ? String(body.id) : null
      if (externalId && (settings.mercadopago_access_token || '').trim()) {
        const status = await checkMercadoPagoPayment(settings.mercadopago_access_token, externalId)
        if (status === 'APPROVED') {
          const payment = await db.payment.findFirst({ where: { externalId, provider: 'MERCADOPAGO' } })
          if (payment) await approvePayment(payment.id)
        }
      }
      return Response.json({ received: true })
    }

    if (provider === 'asaas') {
      const event = body?.event || ''
      const externalId = body?.payment?.id ? String(body.payment.id) : null
      if (externalId && ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED'].includes(event) && (settings.asaas_api_key || '').trim()) {
        const payment = await db.payment.findFirst({ where: { externalId, provider: 'ASAAS' } })
        if (payment) {
          /* Nunca confia no corpo do webhook (qualquer um pode forjar): confirma o status direto na API do Asaas. */
          const status = await checkAsaasPayment(settings.asaas_api_key, settings.asaas_sandbox === 'true', externalId)
          if (status === 'APPROVED') await approvePayment(payment.id)
        }
      }
      return Response.json({ received: true })
    }

    return Response.json({ received: false }, { status: 404 })
  } catch {
    return Response.json({ received: true })
  }
}
