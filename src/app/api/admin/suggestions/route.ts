import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

/** GET /api/admin/suggestions — lista todas as sugestões de tema (Admin Master). */
export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)

  const suggestions = await db.themeSuggestion.findMany({ orderBy: { createdAt: 'desc' }, take: 500 })

  return Response.json({
    suggestions: suggestions.map((s) => ({
      id: s.id,
      message: s.message,
      name: s.name,
      contact: s.contact,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
  })
}
