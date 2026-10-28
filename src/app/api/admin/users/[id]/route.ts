import { db } from '@/lib/db'
import { getSessionUser, jsonError, hashPassword } from '@/lib/auth'
import { getMemberProfile, saveMemberProfile, MEMBER_PREFIX } from '@/lib/member-profile'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return jsonError('Não autorizado', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const data: Record<string, unknown> = {}
  if (body.extraDevices !== undefined && (!Number.isInteger(body.extraDevices) || body.extraDevices < 0 || body.extraDevices > 20)) return jsonError('Informe de 0 a 20 acessos adicionais.', 400)
  if (typeof body.blocked === 'boolean') {
    if (admin.id === id && body.blocked) return jsonError('Você não pode bloquear sua própria conta.', 400)
    if (body.blocked) data.status = 'BLOCKED'
  }
  if (typeof body.hasAccess === 'boolean') {
    data.hasAccess = body.hasAccess
    data.accessSource = body.hasAccess ? 'ADMIN_GRANT' : null
    // Liberação da conta sempre encerra o estado "aguardando PIX manual"
    if (body.hasAccess) data.status = 'ACTIVE'
  }
  const target = await db.user.findUnique({ where: { id }, select: { isPreview: true, status: true } })
  if (!target) return jsonError('Usuário não encontrado.', 404)
  if (body.blocked === true) data.status = 'BLOCKED'
  else if (body.blocked === false && target.status === 'BLOCKED') data.status = 'ACTIVE'
  if (target?.isPreview && (body.role === 'ADMIN' || body.hasAccess === false || typeof body.password === 'string')) return jsonError('A conta Preview só pode ser gerenciada pela opção Preview.', 403)
  if (body.role === 'USER' || body.role === 'ADMIN') data.role = body.role
  // Redefinição de senha pelo Admin Master (não há recuperação automática por enquanto)
  if (typeof body.password === 'string') {
    const password = body.password
    if (password.length < 6) return jsonError('A senha precisa ter no mínimo 6 caracteres', 400)
    data.password = await hashPassword(password)
  }

  const user = await db.$transaction(async tx => {
    if (body.extraDevices !== undefined) {
      const profile = await getMemberProfile(id, tx)
      await saveMemberProfile(id, { ...profile, extraDevices: body.extraDevices }, tx)
      const active = await tx.userSession.findMany({ where: { userId: id, revokedAt: null }, orderBy: [{ lastSeenAt: 'desc' }, { id: 'desc' }], select: { id: true } })
      const excess = active.slice(1 + body.extraDevices).map(row => row.id)
      if (excess.length) await tx.userSession.updateMany({ where: { id: { in: excess } }, data: { revokedAt: new Date(), revokedReason: 'LIMIT' } })
    }
    if (body.blocked === true || typeof body.password === 'string') await tx.userSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'ADMIN' } })
    return tx.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, hasAccess: true, status: true, accessSource: true, createdAt: true },
    })
  })
  return Response.json({ user })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return jsonError('Não autorizado', 401)
  const { id } = await params
  if (session.id === id) return jsonError('Você não pode excluir a si mesmo', 400)
  await db.$transaction([db.user.delete({ where: { id } }), db.setting.deleteMany({ where: { key: MEMBER_PREFIX + id } })])
  return Response.json({ ok: true })
}
