import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { createSessionToken, getCurrentSessionId } from '@/lib/auth'
import { getMemberProfile } from '@/lib/member-profile'

const DAY = 86400000
/** Mesma validade do cookie (30 dias): tudo que ainda "vale" conta como aparelho ativo. */
export const SESSION_ACTIVE_DAYS = 30

export const DEFAULT_MAX_DEVICES = 1

/** "Chrome · Windows" a partir do user-agent. */
export function describeDevice(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : 'Navegador'
  const os = /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(ua)
      ? 'iOS'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Sistema desconhecido'
  return `${browser} · ${os}`
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  return (fwd ? fwd.split(',')[0] : req.headers.get('x-real-ip') || '').trim().slice(0, 64)
}

/**
 * Abre uma sessão (= um aparelho) para o login/cadastro e devolve o token do cookie.
 * Se a conta já está no limite de aparelhos, o MENOS usado é desconectado — quem tem o
 * login "rodando" entre várias pessoas fica sendo derrubado, o que desestimula o compartilhamento
 * (e gera um alerta no painel quando isso acontece várias vezes).
 * Administradores e demonstrações públicas ficam fora da regra individual; Preview privado usa seu limite próprio.
 */
export async function startSession(user: { id: string; role: string; isDemo: boolean; isPreview?: boolean; previewMaxSessions?: number }, req: Request): Promise<{ token: string; displaced: boolean; limit: number }> {
  const currentSid = await getCurrentSessionId()
  const ua = req.headers.get('user-agent') || ''
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await db.$transaction(async tx => {
        const profile = await getMemberProfile(user.id, tx)
        const limit = user.isPreview ? Math.max(1, Math.min(100, user.previewMaxSessions || 10)) : DEFAULT_MAX_DEVICES + profile.extraDevices
        const enforced = user.role !== 'ADMIN' && (!user.isDemo || user.isPreview)
        // Refazer login no mesmo navegador substitui apenas a sua sessão.
        if (currentSid) await tx.userSession.updateMany({ where: { id: currentSid, userId: user.id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'RELOGIN' } })
        let displaced = false
        if (enforced) {
          const active = await tx.userSession.findMany({ where: { userId: user.id, revokedAt: null, lastSeenAt: { gte: new Date(Date.now() - SESSION_ACTIVE_DAYS * DAY) } }, orderBy: [{ lastSeenAt: 'asc' }, { id: 'asc' }] })
          const excess = active.length - (limit - 1)
          if (excess > 0) {
            displaced = true
            await tx.userSession.updateMany({ where: { id: { in: active.slice(0, excess).map(s => s.id) } }, data: { revokedAt: new Date(), revokedReason: 'LIMIT' } })
          }
        }
        const session = await tx.userSession.create({ data: { userId: user.id, device: describeDevice(ua).slice(0, 80), ip: clientIp(req) } })
        return { session, displaced, limit }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      if (result.displaced && !user.isPreview) await flagDeviceChurn(user.id, result.limit)
      return { token: await createSessionToken(user.id, result.session.id), displaced: result.displaced, limit: result.limit }
    } catch (error) {
      if (attempt < 2 && (error as { code?: string }).code === 'P2034') continue
      throw error
    }
  }
  throw new Error('Não foi possível abrir a sessão.')
}

/** 3+ aparelhos derrubados pelo limite em 7 dias = forte indício de login compartilhado. */
async function flagDeviceChurn(userId: string, limit: number) {
  try {
    const since = new Date(Date.now() - 7 * DAY)
    const [kicked, recent, open] = await Promise.all([
      db.userSession.count({ where: { userId, revokedReason: 'LIMIT', revokedAt: { gte: since } } }),
      db.userSession.findMany({ where: { userId, createdAt: { gte: since } }, select: { ip: true } }),
      db.accountAlert.findFirst({ where: { userId, type: 'DEVICES', resolved: false, createdAt: { gte: since } } }),
    ])
    if (kicked < 3 || open) return
    const ips = new Set(recent.map((s) => s.ip).filter(Boolean)).size
    await db.accountAlert.create({
      data: {
        userId,
        type: 'DEVICES',
        detail: `${kicked} aparelhos foram desconectados pelo limite (${limit}) nos últimos 7 dias · ${ips} IPs diferentes nesse período.`,
      },
    })
  } catch {
    /* best-effort */
  }
}
