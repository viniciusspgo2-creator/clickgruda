import { db } from '@/lib/db'
import { hashPassword, setSessionCookie, jsonError } from '@/lib/auth'
import { startSession } from '@/lib/sessions'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''

    if (name.length < 2) return jsonError('Informe seu nome completo', 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('E-mail inválido', 400)
    if (password.length < 6) return jsonError('A senha precisa ter no mínimo 6 caracteres', 400)

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) return jsonError('Este e-mail já possui uma conta. Faça login!', 409)

    const user = await db.user.create({
      data: { name, email, password: await hashPassword(password) },
    })

    const token = await startSession(user, req)
    await setSessionCookie(token)

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAccess: user.hasAccess, isDemo: user.isDemo, status: user.status },
    })
  } catch {
    return jsonError('Erro ao criar conta. Tente novamente.', 500)
  }
}
