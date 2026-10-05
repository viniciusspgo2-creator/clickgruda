import { resolveSession } from '@/lib/auth'

export async function GET() {
  const { user, revoked } = await resolveSession()
  // reason avisa o front quando ESTE aparelho foi desconectado (limite de dispositivos)
  return Response.json({ user, reason: revoked ? 'SESSION_REVOKED' : null })
}
