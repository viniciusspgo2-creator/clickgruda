import { isCaktoTestEmail } from '@/lib/payments/payment-classification'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (user?.role !== 'ADMIN') return jsonError('Não autorizado', 403)
  const [events, purchases] = await Promise.all([
    db.paymentWebhookEvent.findMany({ where: { provider: 'CAKTO' }, orderBy: { receivedAt: 'desc' }, take: 50, select: { id: true, provider: true, eventType: true, customerEmail: true, outcome: true, receivedAt: true } }),
    db.pendingPurchase.findMany({ where: { provider: 'CAKTO', status: 'APPROVED', claimedUserId: null }, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, email: true, externalId: true, createdAt: true } }),
  ])
  return Response.json({ events: events.map(e => ({ ...e, isTest: e.provider === 'CAKTO' && isCaktoTestEmail(e.customerEmail) })), purchases: purchases.filter(p => !isCaktoTestEmail(p.email)) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
