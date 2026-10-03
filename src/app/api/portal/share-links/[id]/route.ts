import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

/** DELETE — desativa/exclui um link do próprio assinante. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para continuar', 401)
  const { id } = await params

  const link = await db.shareLink.findUnique({ where: { id } })
  if (!link || link.userId !== session.id) return jsonError('Link não encontrado', 404)

  await db.shareLink.delete({ where: { id } })
  return Response.json({ ok: true })
}
