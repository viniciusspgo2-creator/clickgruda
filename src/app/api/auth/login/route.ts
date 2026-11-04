import { db } from '@/lib/db'
import { verifyPassword, setSessionCookie, jsonError } from '@/lib/auth'
import { startSession } from '@/lib/sessions'
import { countAttempt, isSafeOrigin, isThrottled, requestIp, resetAttempt, throttleKey, verifyTurnstile } from '@/lib/security-guards'

export async function POST(req: Request) {
  if (!isSafeOrigin(req)) return jsonError('Solicitação inválida', 403)
  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0,254) : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (body.website || !email || !password || email.length > 254 || password.length > 128) return jsonError('E-mail ou senha incorretos', 401)
    const ipKey = throttleKey('login-ip', requestIp(req))
    const accountKey = throttleKey('login-account', email)
    if (await isThrottled(ipKey) || await isThrottled(accountKey)) return jsonError('Muitas tentativas. Tente novamente mais tarde.', 429)
    if (!await verifyTurnstile(body.captchaToken, req)) return jsonError('Não foi possível verificar a segurança. Atualize a página.', 403)
    const user = await db.user.findUnique({ where: { email } })
    // Mesma mensagem para conta inexistente, bloqueada e senha incorreta.
    const ok = user ? await verifyPassword(password, user.password) : false
    if (!ok || user?.status === 'BLOCKED' || !user) {
      await Promise.all([countAttempt(ipKey, 30, 15), countAttempt(accountKey, 5, 15)])
      return jsonError('E-mail ou senha incorretos', 401)
    }
    await resetAttempt(accountKey)

    const session = await startSession(user, req)
    await setSessionCookie(session.token)

    return Response.json({
      sessionNotice: session.displaced && !user.isPreview ? 'NEW_LOGIN' : null,
      deviceLimit: session.limit,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, hasAccess: user.hasAccess, isDemo: user.isDemo || user.isPreview, isPreview: user.isPreview, status: user.status },
    })
  } catch {
    return jsonError('Erro ao entrar. Tente novamente.', 500)
  }
}
