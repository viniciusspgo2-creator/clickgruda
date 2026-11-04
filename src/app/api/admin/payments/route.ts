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
  return Response.json({
    payments: payments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      userEmail: p.user.email,
      provider: p.provider,
      method: p.method,
      amountCents: p.amountCents,
      status: p.status,
      externalId: p.externalId,
      createdAt: p.createdAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() || null,
    })),
  })
}
