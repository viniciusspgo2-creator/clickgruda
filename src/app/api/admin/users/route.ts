import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const [users, dlCounts, favCounts] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    db.download.groupBy({ by: ['userId'], _count: true }),
    db.favorite.groupBy({ by: ['userId'], _count: true }),
  ])
  const dlMap = new Map(dlCounts.map((d) => [d.userId, d._count]))
  const favMap = new Map(favCounts.map((f) => [f.userId, f._count]))
  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      hasAccess: u.hasAccess,
      status: u.status,
      isDemo: u.isDemo,
      accessSource: u.accessSource,
      createdAt: u.createdAt.toISOString(),
      downloadsCount: dlMap.get(u.id) || 0,
      favoritesCount: favMap.get(u.id) || 0,
    })),
  })
}
