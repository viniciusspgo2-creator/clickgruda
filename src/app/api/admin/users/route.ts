import { db } from '@/lib/db'
import { getSessionUser, jsonError, hashPassword } from '@/lib/auth'
import { MEMBER_PREFIX, normalizeWhatsapp, parseMemberProfile, saveMemberProfile } from '@/lib/member-profile'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const [users, dlCounts, favCounts] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 500 }),
    db.download.groupBy({ by: ['userId'], _count: true }),
    db.favorite.groupBy({ by: ['userId'], _count: true }),
  ])
  const dlMap = new Map(dlCounts.map((d) => [d.userId, d._count]))
  const favMap = new Map(favCounts.map((f) => [f.userId, f._count]))
  const profiles = await db.setting.findMany({ where: { key: { in: users.map(user => MEMBER_PREFIX + user.id) } } })
  const profileMap = new Map(profiles.map(row => [row.key.slice(MEMBER_PREFIX.length), parseMemberProfile(row.value)]))
  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      whatsapp: profileMap.get(u.id)?.whatsapp || '',
      extraDevices: profileMap.get(u.id)?.extraDevices || 0,
      role: u.role,
      hasAccess: u.hasAccess,
      status: u.status,
      isDemo: u.isDemo,
      isPreview: u.isPreview,
      previewMaxSessions: u.previewMaxSessions,
      accessSource: u.accessSource,
      createdAt: u.createdAt.toISOString(),
      downloadsCount: dlMap.get(u.id) || 0,
      favoritesCount: favMap.get(u.id) || 0,
    })),
  })
}

/**
 * POST /api/admin/users — cadastro MANUAL de cliente (ex.: quem comprou pelo WhatsApp).
 * Body: { name, email, password, grantAccess? (padrão true) }
 * A conta já nasce ativa (accessSource = ADMIN_GRANT), sem passar pelo PIX.
 */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  const name = String(body.name || '').trim().slice(0, 80)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 120)
  const password = String(body.password || '')
  const grantAccess = body.grantAccess === true
  let whatsapp: string
  try { whatsapp = normalizeWhatsapp(body.whatsapp) } catch (error) { return jsonError((error as Error).message, 400) }

  if (name.length < 2) return jsonError('Informe o nome do cliente.', 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('E-mail inválido.', 400)
  if (password.length < 6) return jsonError('A senha precisa ter no mínimo 6 caracteres.', 400)

  const exists = await db.user.findUnique({ where: { email }, select: { id: true, name: true, hasAccess: true } })
  if (exists) {
    return jsonError(
      `Já existe uma conta com este e-mail (${exists.name}). Procure na lista e use "Liberar" ou "Redefinir senha".`,
      409
    )
  }

  const passwordHash = await hashPassword(password)
  const user = await db.$transaction(async tx => {
    const created = await tx.user.create({
    data: {
      name,
      email,
      password: passwordHash,
      role: 'USER',
      hasAccess: grantAccess,
      accessSource: grantAccess ? 'ADMIN_GRANT' : null,
      status: 'ACTIVE',
    },
    select: { id: true, name: true, email: true, hasAccess: true },
    })
    await saveMemberProfile(created.id, { whatsapp, extraDevices: 0, contactPurpose: 'cadastro realizado pela equipe de suporte', registeredAt: new Date().toISOString() }, tx)
    return created
  })
  return Response.json({ user: { ...user, whatsapp } })
}
