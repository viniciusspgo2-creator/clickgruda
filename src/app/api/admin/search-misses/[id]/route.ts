import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  return session && session.role === 'ADMIN' ? session : null
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const status = body.status === 'DONE' ? 'DONE' : 'NEW'
  await db.searchMiss.update({ where: { id }, data: { status } })
  return Response.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  await db.searchMiss.delete({ where: { id } }).catch(() => {})
  return Response.json({ ok: true })
}
