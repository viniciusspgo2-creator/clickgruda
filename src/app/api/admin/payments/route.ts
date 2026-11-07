import { MANUAL_PROVIDER, RECEIPT_PREFIX } from '@/lib/manual-receipts'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const payments = await db.payment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: { user: { select: { name: true, email: true } } },
  })
  const receipts = await db.setting.findMany({where:{key:{in:payments.filter(p=>p.provider===MANUAL_PROVIDER&&p.externalId).map(p=>RECEIPT_PREFIX+p.externalId)}}})
  const references = new Map(receipts.map(row=>{try{const d=JSON.parse(row.value);return [d.paymentId, d.reference] as const}catch{return [row.key, null] as const}}))
  return Response.json({
    payments: payments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      userEmail: p.user.email,
      provider: p.provider,
      reference: references.get(p.id) || null,
      method: p.method,
      amountCents: p.amountCents,
      status: p.status,
      externalId: p.externalId,
      createdAt: p.createdAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() || null,
    })),
  })
}
