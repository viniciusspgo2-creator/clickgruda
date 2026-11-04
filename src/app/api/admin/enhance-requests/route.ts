import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

/** GET /api/admin/enhance-requests — lista os pedidos de melhoria de arte (Admin Master). */
export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)

  const rows = await db.artEnhanceRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: { user: { select: { name: true, email: true } } },
  })

  return Response.json({
    requests: rows.map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      fileName: r.fileName,
      note: r.note,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      userName: r.user?.name || '',
      userEmail: r.user?.email || '',
    })),
  })
}
