import { resolveSession } from '@/lib/auth'

export async function GET() {
  const { user, revoked, reason, deviceLimit } = await resolveSession()
  // reason avisa o front quando ESTE aparelho foi desconectado (limite de dispositivos)
  return Response.json({ user, reason: reason || (revoked ? 'SESSION_REVOKED' : null), deviceLimit }, { headers: { 'Cache-Control': 'private, no-store' } })
}
