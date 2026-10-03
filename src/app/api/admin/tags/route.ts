import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const [tags, counts] = await Promise.all([
    db.tag.findMany({ orderBy: { name: 'asc' } }),
    db.artTag.groupBy({ by: ['tagId'], _count: true }),
  ])
  const map = new Map(counts.map((c) => [c.tagId, c._count]))
  return Response.json({ tags: tags.map((t) => ({ ...t, artCount: map.get(t.id) || 0 })) })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const name = (body.name || '').trim().toLowerCase()
  if (!name) return jsonError('Nome da tag obrigatório', 400)
  const exists = await db.tag.findUnique({ where: { name } })
  if (exists) return jsonError('Tag já existe', 409)
  const tag = await db.tag.create({ data: { name } })
  return Response.json({ tag })
}
