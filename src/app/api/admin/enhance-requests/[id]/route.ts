import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

/** PATCH /api/admin/enhance-requests/[id] — atualiza o status (NEW | DONE). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)

  const { id } = await params
  let body: { status?: unknown }
  try {
    body = await req.json()
  } catch {
    return jsonError('Requisição inválida.', 400)
  }

  const status = typeof body.status === 'string' ? body.status : ''
  if (!['NEW', 'DONE'].includes(status)) return jsonError('Status inválido.', 400)

  try {
    await db.artEnhanceRequest.update({ where: { id }, data: { status } })
    return Response.json({ ok: true })
  } catch {
    return jsonError('Pedido não encontrado.', 404)
  }
}

/** DELETE /api/admin/enhance-requests/[id] — exclui o pedido. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)

  const { id } = await params
  try {
    await db.artEnhanceRequest.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch {
    return jsonError('Pedido não encontrado.', 404)
  }
}
