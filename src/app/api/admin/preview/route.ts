import { db } from '@/lib/db'
import { getSessionUser, hashPassword, jsonError } from '@/lib/auth'

async function adminOnly() {
  const session = await getSessionUser()
  return session?.role === 'ADMIN'
}

/** Cria a conta universal de avaliação; não é um assinante pagante. */
export async function POST(req: Request) {
  if (!(await adminOnly())) return jsonError('Não autorizado.', 401)
  const body = await req.json().catch(() => ({}))
  const name = String(body.name || 'Acesso Preview Click & Gruda').trim().slice(0, 80)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 120)
  const password = String(body.password || '')
  const maxSessions = Number(body.maxSessions)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Informe um e-mail válido.', 400)
  if (password.length < 8 || password.length > 128) return jsonError('Use uma senha de 8 a 128 caracteres.', 400)
  if (!Number.isInteger(maxSessions) || maxSessions < 1 || maxSessions > 100) return jsonError('Escolha um limite entre 1 e 100 acessos.', 400)
  const exists = await db.user.findUnique({ where: { email }, select: { id: true } })
  if (exists) return jsonError('Já existe uma conta com este e-mail.', 409)
  const user = await db.user.create({ data: {
    name, email, password: await hashPassword(password), role: 'USER', status: 'ACTIVE',
    hasAccess: true, accessSource: 'ADMIN_GRANT', isDemo: true, isPreview: true, previewMaxSessions: maxSessions,
  }, select: { id: true, name: true, email: true, previewMaxSessions: true } })
  return Response.json({ user }, { status: 201 })
}

/** Admin muda limite/credenciais; alterações na senha exigem login novamente. */
export async function PATCH(req: Request) {
  if (!(await adminOnly())) return jsonError('Não autorizado.', 401)
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const user = await db.user.findUnique({ where: { id } })
  if (!user?.isPreview) return jsonError('Conta Preview não encontrada.', 404)
  const limit = Number(body.maxSessions)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return jsonError('O limite deve estar entre 1 e 100.', 400)
  const nextPassword = typeof body.password === 'string' ? body.password : ''
  if (nextPassword && (nextPassword.length < 8 || nextPassword.length > 128)) return jsonError('Senha com 8 a 128 caracteres.', 400)
  const update = await db.user.update({ where: { id }, data: {
    previewMaxSessions: limit,
    ...(nextPassword ? { password: await hashPassword(nextPassword) } : {}),
    isDemo: true, isPreview: true, hasAccess: true, role: 'USER',
  }, select: { id: true, name: true, email: true, previewMaxSessions: true } })
  if (nextPassword) {
    await db.userSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'ADMIN' } })
  } else if (limit < user.previewMaxSessions) {
    // Reduzir o limite deve ter efeito imediato, não apenas no próximo login.
    const active = await db.userSession.findMany({
      where: { userId: id, revokedAt: null, lastSeenAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      orderBy: { lastSeenAt: 'desc' }, select: { id: true },
    })
    if (active.length > limit) await db.userSession.updateMany({
      where: { id: { in: active.slice(limit).map((s) => s.id) } },
      data: { revokedAt: new Date(), revokedReason: 'LIMIT' },
    })
  }
  return Response.json({ user: update })
}
