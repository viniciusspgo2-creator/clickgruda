import { db } from '@/lib/db'
import { clearSessionCookie, getCurrentSessionId } from '@/lib/auth'

export async function POST() {
  // encerra só ESTE aparelho (para não ocupar uma vaga do limite de dispositivos)
  const sid = await getCurrentSessionId()
  if (sid) {
    await db.userSession
      .updateMany({ where: { id: sid, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'LOGOUT' } })
      .catch(() => {})
  }
  await clearSessionCookie()
  return Response.json({ ok: true })
}
