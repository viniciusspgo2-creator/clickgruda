import { getSessionUser } from '@/lib/auth'
import { countAttempt, isThrottled, requestIp, throttleKey } from '@/lib/security-guards'
export async function GET(req: Request) {
  const key = throttleKey('status-ip', requestIp(req))
  if (await isThrottled(key)) return Response.json({ error: 'Muitas verificações' }, { status: 429 })
  await countAttempt(key, 150, 1)
  const user = await getSessionUser()
  if (user) {
    const accountKey = throttleKey('status-account', user.id)
    if (await isThrottled(accountKey)) return Response.json({ error: 'Muitas verificações' }, { status: 429 })
    await countAttempt(accountKey, 150, 1)
  }
  if (!user || user.isDemo || user.status === 'BLOCKED') return Response.json({ active: false }, { status: 401, headers: { 'Cache-Control': 'private, no-store' } })
  return Response.json({ active: (user.hasAccess && !user.isTrial), status: (user.hasAccess && !user.isTrial) ? 'ATIVO' : 'SEM_ACESSO' }, { headers: { 'Cache-Control': 'private, no-store' } })
}
