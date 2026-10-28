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
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (typeof body.emoji === 'string' && body.emoji.trim()) data.emoji = body.emoji.trim()
  const month = parseInt(body.month, 10)
  const day = parseInt(body.day, 10)
  if (month >= 1 && month <= 12) data.month = month
  if (day >= 1 && day <= 31) data.day = day
  const event = await db.seasonalEvent.update({ where: { id }, data })
  return Response.json({ event })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  await db.seasonalEvent.delete({ where: { id } })
  return Response.json({ ok: true })
}
