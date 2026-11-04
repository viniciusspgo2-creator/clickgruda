import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim().toUpperCase()
  if (typeof body.emoji === 'string' && body.emoji.trim()) data.emoji = body.emoji.trim()
  if (typeof body.icon === 'string') data.icon = body.icon.slice(0, 40)
  const category = await db.category.update({ where: { id }, data })
  return Response.json({ category })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  await db.category.delete({ where: { id } })
  return Response.json({ ok: true })
}
