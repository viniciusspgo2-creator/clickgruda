import { db } from '@/lib/db'
import { createSessionToken } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

const DAY = 86400000
/** Mesma validade do cookie (30 dias): tudo que ainda "vale" conta como aparelho ativo. */
export const SESSION_ACTIVE_DAYS = 30

export const DEFAULT_MAX_DEVICES = 2

function intSetting(v: string | undefined, fallback: number) {
  const n = parseInt(v ?? '', 10)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

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
 * Admin e conta demo ficam fora do limite.
 */
export async function startSession(user: { id: string; role: string; isDemo: boolean }, req: Request): Promise<string> {
  const settings = await getSettings(['max_devices'])
  const limit = intSetting(settings.max_devices, DEFAULT_MAX_DEVICES) // 0 = sem limite
  const enforced = limit > 0 && user.role !== 'ADMIN' && !user.isDemo

  if (enforced) {
    const since = new Date(Date.now() - SESSION_ACTIVE_DAYS * DAY)
    const active = await db.userSession.findMany({
      where: { userId: user.id, revokedAt: null, lastSeenAt: { gte: since } },
      orderBy: { lastSeenAt: 'asc' },
    })
    const excess = active.length - (limit - 1)
    if (excess > 0) {
      const ids = active.slice(0, excess).map((s) => s.id)
      await db.userSession.updateMany({
        where: { id: { in: ids } },
        data: { revokedAt: new Date(), revokedReason: 'LIMIT' },
      })
      await flagDeviceChurn(user.id, limit)
    }
  }

  const ua = req.headers.get('user-agent') || ''
  const session = await db.userSession.create({
    data: { userId: user.id, device: describeDevice(ua).slice(0, 80), ip: clientIp(req) },
  })
  return createSessionToken(user.id, session.id)
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
