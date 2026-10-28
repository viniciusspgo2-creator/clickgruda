import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  return session && session.role === 'ADMIN' ? session : null
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const rows = await db.searchMiss.findMany({
    orderBy: [{ users: 'desc' }, { count: 'desc' }, { lastAt: 'desc' }],
    take: 500,
  })
  return Response.json({
    misses: rows.map((r) => ({
      id: r.id,
      query: r.display,
      count: r.count,
      users: r.users,
      status: r.status,
      lastAt: r.lastAt.toISOString(),
    })),
  })
}
