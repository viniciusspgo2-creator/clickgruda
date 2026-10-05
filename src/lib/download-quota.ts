import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'

/** Limite diário padrão de downloads por conta (0 = sem limite). Ajustável em Admin → Segurança. */
export const DEFAULT_DAILY_DOWNLOAD_LIMIT = 500

const DAY = 86400000
const BR_OFFSET = 3 * 3600000 // Brasília = UTC-3 (sem horário de verão desde 2019)

/** O "dia" do limite vira à meia-noite de Brasília. */
export function startOfTodayBR(now = Date.now()): Date {
  const local = now - BR_OFFSET
  return new Date(Math.floor(local / DAY) * DAY + BR_OFFSET)
}

export function nextResetBR(now = Date.now()): Date {
  return new Date(startOfTodayBR(now).getTime() + DAY)
}

/** "YYYY-MM-DD" do dia de Brasília (para o registro de dias em que o limite foi atingido). */
export function dayKeyBR(now = Date.now()): string {
  return new Date(now - BR_OFFSET).toISOString().slice(0, 10)
}

export async function getDailyLimit(): Promise<number> {
  const s = await getSettings(['dl_daily_limit'])
  const n = parseInt(s.dl_daily_limit ?? '', 10)
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DAILY_DOWNLOAD_LIMIT
}

export type DownloadQuota = {
  limit: number // 0 = sem limite
  used: number // artes DIFERENTES baixadas hoje (baixar a mesma arte de novo no mesmo dia não gasta cota)
  remaining: number | null // null = sem limite
  today: Set<string>
}

export async function downloadQuota(userId: string): Promise<DownloadQuota> {
  const [limit, rows] = await Promise.all([
    getDailyLimit(),
    db.download.findMany({
      where: { userId, createdAt: { gte: startOfTodayBR() } },
      distinct: ['artId'],
      select: { artId: true },
    }),
  ])
  const today = new Set<string>(rows.map((r: { artId: string }) => r.artId))
  const used = today.size
  return { limit, used, remaining: limit > 0 ? Math.max(0, limit - used) : null, today }
}

export function limitMessage(limit: number): string {
  return `Você chegou ao limite de ${limit} downloads de hoje! 🎉 Para não sobrecarregar o sistema, o limite renova todo dia à meia-noite. Volte amanhã e baixe mais ${limit}.`
}

/**
 * Registra que a conta bateu o limite hoje. Se isso acontece em 3+ dias da última semana,
 * abre um alerta (uso pesado recorrente — pode ser login compartilhado ou revenda das artes).
 */
export async function recordLimitHit(userId: string, limit: number) {
  try {
    try {
      await db.downloadLimitHit.create({ data: { userId, day: dayKeyBR() } })
    } catch {
      return // já registrado hoje
    }
    const since = dayKeyBR(Date.now() - 6 * DAY)
    const days = await db.downloadLimitHit.count({ where: { userId, day: { gte: since } } })
    if (days < 3) return
    const open = await db.accountAlert.findFirst({
      where: { userId, type: 'DOWNLOADS', resolved: false, createdAt: { gte: new Date(Date.now() - 7 * DAY) } },
    })
    if (open) return
    await db.accountAlert.create({
      data: {
        userId,
        type: 'DOWNLOADS',
        detail: `Bateu o limite diário de ${limit} downloads em ${days} dos últimos 7 dias — uso pesado recorrente.`,
      },
    })
  } catch {
    /* best-effort */
  }
}
