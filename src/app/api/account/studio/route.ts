import { getSessionUser, jsonError } from '@/lib/auth'
import { db } from '@/lib/db'
import { isSafeOrigin } from '@/lib/security-guards'
import {
  deliverStudioBonus,
  queueStudioEntitlement,
  studioBonusEnabled,
  studioBonusForUser,
} from '@/lib/studio-bonus'
export async function GET() {
  const user = await getSessionUser()
  if (!user || user.isDemo) return jsonError('Faça login na sua conta.', 401)
  return Response.json(
    { bonus: await studioBonusForUser(user.id) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session || session.isDemo || session.role === 'ADMIN')
    return jsonError('Entre com sua conta de cliente.', 401)
  if (!isSafeOrigin(req)) return jsonError('Solicitação inválida', 403)
  if (!studioBonusEnabled())
    return jsonError('Integração ainda não ativada.', 404)
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id=${session.id} FOR UPDATE`
    const user = await tx.user.findUnique({ where: { id: session.id } })
    if (
      user?.hasAccess &&
      user.status !== 'BLOCKED' &&
      user.accessType !== 'TRIAL'
    )
      await queueStudioEntitlement(tx, user, 'MEMBER')
  })
  await deliverStudioBonus(session.id)
  return GET()
}
