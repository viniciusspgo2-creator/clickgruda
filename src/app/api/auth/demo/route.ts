import { createPublicDemoSession, getSessionUser, jsonError } from '@/lib/auth'

export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return jsonError('Origem não permitida.', 403)
  try {
    const existing = await getSessionUser()
    // Uma conta ativa ou de administrador mantém sua própria sessão.
    const user = existing && (existing.hasAccess || existing.role === 'ADMIN') ? existing : await createPublicDemoSession()
    return Response.json({ user }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return jsonError('Não foi possível abrir a demonstração. Tente novamente.', 503)
  }
}
