import { resolveSession } from '@/lib/auth'
import { getDownloadQuota } from '@/lib/download-quota'

export async function GET() {
  const { user, revoked, reason, deviceLimit } = await resolveSession()
  // reason avisa o front quando ESTE aparelho foi desconectado (limite de dispositivos)
  const quota = user ? await getDownloadQuota(user) : null
  return Response.json({ user: user ? { ...user, downloadLimited: quota !== null } : null, reason: reason || (revoked ? 'SESSION_REVOKED' : null), deviceLimit }, { headers: { 'Cache-Control': 'private, no-store' } })
}
