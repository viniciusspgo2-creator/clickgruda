import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

const STATUSES = ['NEW', 'SEEN', 'DONE'] as const

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

/** PATCH /api/admin/suggestions/[id] — atualiza o status (NEW → SEEN → DONE). */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)

  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as { status?: string }
  if (!body.status || !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
    return jsonError('Status inválido', 400)
  }

  try {
    const updated = await db.themeSuggestion.update({
      where: { id },
      data: { status: body.status },
    })
    return Response.json({ ok: true, id: updated.id, status: updated.status })
  } catch {
    return jsonError('Sugestão não encontrada', 404)
  }
}

/** DELETE /api/admin/suggestions/[id] — exclui a sugestão. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)

  const { id } = await ctx.params
  try {
    await db.themeSuggestion.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch {
    return jsonError('Sugestão não encontrada', 404)
  }
}
