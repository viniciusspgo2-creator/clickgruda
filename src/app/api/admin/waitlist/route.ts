import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  return session && session.role === 'ADMIN' ? session : null
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const rows = await db.catalogoWaitlist.findMany({ orderBy: { createdAt: 'desc' }, take: 5000 })
  return Response.json({
    entries: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      whatsapp: r.whatsapp,
      notifiedAt: r.notifiedAt ? r.notifiedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}

/** PATCH { ids: string[], notified: boolean } — marca como avisado / não avisado. */
export async function PATCH(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : []
  if (!ids.length) return jsonError('Nenhum item selecionado', 400)
  await db.catalogoWaitlist.updateMany({
    where: { id: { in: ids } },
    data: { notifiedAt: body.notified ? new Date() : null },
  })
  return Response.json({ ok: true })
}

/** DELETE ?id= — remove da lista. */
export async function DELETE(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return jsonError('id obrigatório', 400)
  await db.catalogoWaitlist.delete({ where: { id } }).catch(() => {})
  return Response.json({ ok: true })
}
