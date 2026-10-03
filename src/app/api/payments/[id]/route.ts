import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { checkMercadoPagoPayment, checkAsaasPayment, approvePayment } from '@/lib/payments'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSessionUser()
  if (!session) return jsonError('Não autorizado', 401)

  const payment = await db.payment.findUnique({ where: { id }, include: { user: true } })
  if (!payment) return jsonError('Pagamento não encontrado', 404)
  if (payment.userId !== session.id && session.role !== 'ADMIN') return jsonError('Não autorizado', 403)

  // Live status check for pending gateway payments
  if (payment.status === 'PENDING' && payment.externalId) {
    const settings = await getSettings()
    try {
      if (payment.provider === 'MERCADOPAGO' && (settings.mercadopago_access_token || '').trim()) {
        const status = await checkMercadoPagoPayment(settings.mercadopago_access_token, payment.externalId)
        if (status === 'APPROVED') await approvePayment(payment.id)
        else if (status === 'FAILED') await db.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
      } else if (payment.provider === 'ASAAS' && (settings.asaas_api_key || '').trim()) {
        const status = await checkAsaasPayment(
          settings.asaas_api_key,
          settings.asaas_sandbox === 'true',
          payment.externalId
        )
        if (status === 'APPROVED') await approvePayment(payment.id)
        else if (status === 'EXPIRED') await db.payment.update({ where: { id: payment.id }, data: { status: 'EXPIRED' } })
      }
    } catch {
      /* keep pending on transient errors */
    }
  }

  const fresh = await db.payment.findUnique({ where: { id } })
  const user = await db.user.findUnique({ where: { id: payment.userId } })

  return Response.json({
    id,
    status: fresh?.status || payment.status,
    provider: payment.provider,
    amountCents: payment.amountCents,
    approvedAt: fresh?.approvedAt,
    createdAt: payment.createdAt,
    hasAccess: user?.hasAccess || false,
  })
}
