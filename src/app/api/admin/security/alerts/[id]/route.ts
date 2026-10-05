import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

/** PATCH { resolved: boolean } — dispensa (ou reabre) um alerta. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  await db.accountAlert.update({ where: { id }, data: { resolved: Boolean(body.resolved) } })
  return Response.json({ ok: true })
}
