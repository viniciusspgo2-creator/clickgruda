import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie, jsonError } from '@/lib/auth'
import { startSession } from '@/lib/sessions'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (!email || !password) return jsonError('Informe e-mail e senha', 400)

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return jsonError('E-mail ou senha incorretos', 401)

    const ok = await verifyPassword(password, user.password)
    if (!ok) return jsonError('E-mail ou senha incorretos', 401)

    const token = await startSession(user, req)
    await setSessionCookie(token)

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAccess: user.hasAccess, isDemo: user.isDemo, status: user.status },
    })
  } catch {
    return jsonError('Erro ao entrar. Tente novamente.', 500)
  }
}
