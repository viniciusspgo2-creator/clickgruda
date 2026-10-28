import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const [categories, counts] = await Promise.all([
    db.category.findMany({ orderBy: { name: 'asc' } }),
    db.art.groupBy({ by: ['categoryId'], _count: true }),
  ])
  const map = new Map(counts.map((c) => [c.categoryId, c._count]))
  return Response.json({
    categories: categories.map((c) => ({ ...c, artCount: map.get(c.id) || 0 })),
  })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const name = (body.name || '').trim().toUpperCase()
  if (!name) return jsonError('Nome da categoria obrigatório', 400)
  const exists = await db.category.findUnique({ where: { name } })
  if (exists) return jsonError('Categoria já existe', 409)
  const icon = typeof body.icon === 'string' ? body.icon.slice(0, 40) : ''
  const category = await db.category.create({ data: { name, emoji: body.emoji || '🎨', icon } })
  return Response.json({ category })
}
