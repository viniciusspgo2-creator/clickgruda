import { db } from '@/lib/db'
import { hashPassword, setSessionCookie, jsonError, getSessionUser } from '@/lib/auth'
import { startSession } from '@/lib/sessions'
import { normalizeWhatsapp, saveMemberProfile } from '@/lib/member-profile'

export async function POST(req: Request) {
  const existingSession = await getSessionUser()
  if (existingSession?.isPreview) return jsonError('Saia do modo Preview para criar uma conta própria.', 403)
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 254) : ''
    const password = typeof body.password === 'string' ? body.password : ''
    let whatsapp: string
    try { whatsapp = normalizeWhatsapp(body.whatsapp) } catch (error) { return jsonError((error as Error).message, 400) }

    if (name.length < 2) return jsonError('Informe seu nome completo', 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('E-mail inválido', 400)
    if (password.length < 6) return jsonError('A senha precisa ter no mínimo 6 caracteres', 400)
    if (password.length > 128) return jsonError('A senha deve ter até 128 caracteres.', 400)

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) return jsonError('Este e-mail já possui uma conta. Faça login!', 409)

    const hashed = await hashPassword(password)
    const user = await db.$transaction(async tx => {
      const created = await tx.user.create({ data: { name, email, password: hashed } })
      await saveMemberProfile(created.id, { whatsapp, extraDevices: 0, contactPurpose: 'pagamento, ativação e suporte desta conta', registeredAt: new Date().toISOString() }, tx)
      return created
    })

    const session = await startSession(user, req)
    await setSessionCookie(session.token)

    return Response.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAccess: user.hasAccess, isDemo: user.isDemo, status: user.status },
    })
  } catch {
    return jsonError('Erro ao criar conta. Tente novamente.', 500)
  }
}
