import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { synchronizePayment } from '@/lib/payment-verification'
import { getCheckoutContext } from '@/lib/coupons'

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
      if ((payment.provider === 'MERCADOPAGO' && settings.mercadopago_access_token) || (payment.provider === 'ASAAS' && settings.asaas_api_key)) await synchronizePayment(payment, settings)
    } catch {
      /* keep pending on transient errors */
    }
  }

  const fresh = await db.payment.findUnique({ where: { id } })
  const user = await db.user.findUnique({ where: { id: payment.userId } })

  const context = await getCheckoutContext(id)
  return Response.json({
    ...(context ? { subtotalCents: context.subtotalCents, discountCents: context.discountCents, coupon: context.coupon } : {}),
    id,
    status: fresh?.status || payment.status,
    provider: payment.provider,
    amountCents: payment.amountCents,
    approvedAt: fresh?.approvedAt,
    createdAt: payment.createdAt,
    hasAccess: user?.hasAccess || false,
  })
}
