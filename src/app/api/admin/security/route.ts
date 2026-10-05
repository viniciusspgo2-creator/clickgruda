import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { DEFAULT_MAX_DEVICES, SESSION_ACTIVE_DAYS } from '@/lib/sessions'
import { DEFAULT_DAILY_DOWNLOAD_LIMIT } from '@/lib/download-quota'

async function requireAdmin() {
  const session = await getSessionUser()
  return session && session.role === 'ADMIN' ? session : null
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const since = new Date(Date.now() - SESSION_ACTIVE_DAYS * 86400000)

  const [settings, alerts, activeRows] = await Promise.all([
    getSettings(['max_devices', 'dl_daily_limit']),
    db.accountAlert.findMany({
      orderBy: [{ resolved: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    db.userSession.findMany({
      where: { revokedAt: null, lastSeenAt: { gte: since } },
      select: { userId: true },
    }),
  ])

  // contas com mais de um aparelho ativo (top 15)
  const perUser = new Map<string, number>()
  for (const r of activeRows as { userId: string }[]) perUser.set(r.userId, (perUser.get(r.userId) || 0) + 1)
  const multi = [...perUser.entries()]
    .filter(([, n]) => n > 1)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 15)
    .map(([userId]) => ({ userId }))

  // dispositivos ativos dos usuários citados (alertas + ranking)
  const userIds = [...new Set([...alerts.map((a) => a.userId), ...multi.map((m) => m.userId)])]
  const [sessions, users] = await Promise.all([
    userIds.length
      ? db.userSession.findMany({
          where: { userId: { in: userIds }, revokedAt: null, lastSeenAt: { gte: since } },
          orderBy: { lastSeenAt: 'desc' },
        })
      : Promise.resolve([]),
    userIds.length
      ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
      : Promise.resolve([]),
  ])
  const devicesOf = (userId: string) =>
    sessions
      .filter((s) => s.userId === userId)
      .map((s) => ({ id: s.id, device: s.device || 'Aparelho', ip: s.ip, lastSeenAt: s.lastSeenAt.toISOString(), createdAt: s.createdAt.toISOString() }))
  const userMap = new Map(users.map((u) => [u.id, u] as const))

  return Response.json({
    settings: {
      max_devices: settings.max_devices ?? String(DEFAULT_MAX_DEVICES),
      dl_daily_limit: settings.dl_daily_limit ?? String(DEFAULT_DAILY_DOWNLOAD_LIMIT),
    },
    alerts: alerts.map((a) => ({
      id: a.id,
      type: a.type,
      detail: a.detail,
      resolved: a.resolved,
      createdAt: a.createdAt.toISOString(),
      user: a.user,
      devices: devicesOf(a.userId),
    })),
    multiDevice: multi.map((m) => ({
      userId: m.userId,
      name: userMap.get(m.userId)?.name || '—',
      email: userMap.get(m.userId)?.email || '',
      devices: devicesOf(m.userId),
    })),
  })
}
