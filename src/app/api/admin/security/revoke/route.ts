import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

/** POST { userId } — desconecta TODOS os aparelhos da conta (ela precisa fazer login de novo). */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!userId) return jsonError('userId obrigatório', 400)
  const r = await db.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: 'ADMIN' },
  })
  return Response.json({ revoked: r.count })
}
