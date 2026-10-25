import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import {
  ANALYTICS_IGNORE_COOKIE, ANALYTICS_IGNORE_IPS_KEY, ANALYTICS_IGNORE_VISITORS_KEY,
  getClientIp, isInternalCookie, readStringList,
} from '@/lib/analytics-privacy'

const DAY_MS = 86_400_000
const isoDay = (date: Date) => date.toISOString().slice(0, 10)
const dayPattern = /^\d{4}-\d{2}-\d{2}$/
function validDay(value: string) {
  const parsed = new Date(`${value}T12:00:00.000Z`)
  return dayPattern.test(value) && !Number.isNaN(parsed.getTime()) && isoDay(parsed) === value
}
function brazilToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

/** Visitas são registradas em UTC; agrupamento exibido na data local de Brasília. */
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return jsonError('Não autorizado', 401)

  const search = new URL(req.url).searchParams
  const range = search.get('range') || '30d'
  const today = brazilToday()
  let start = today
  let end = today
  if (range === '7d' || range === '30d') {
    start = isoDay(new Date(Date.parse(`${today}T12:00:00Z`) - (range === '7d' ? 6 : 29) * DAY_MS))
  } else if (range === 'custom') {
    start = search.get('start') || ''
    end = search.get('end') || ''
    if (!validDay(start) || !validDay(end) || start > end || Date.parse(end) - Date.parse(start) > 365 * DAY_MS) {
      return jsonError('Período inválido. Selecione até 366 dias.', 400)
    }
  } else if (range !== 'today') return jsonError('Filtro inválido.', 400)

  // O Brasil não adota horário de verão desde 2019. Dados agrupados no fuso America/Sao_Paulo.
  const from = new Date(`${start}T03:00:00.000Z`)
  const to = new Date(Date.parse(`${end}T03:00:00.000Z`) + DAY_MS)
  const [savedBrowsers, savedIps] = await Promise.all([
    db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY } }),
    db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_IPS_KEY } }),
  ])
  const ignoredVisitors = readStringList(savedBrowsers?.value).filter(v => /^[0-9a-f]{64}$/.test(v))
  const ignoredIps = readStringList(savedIps?.value)

  type Totals = { views: bigint; uniqueVisitors: bigint; clicks: bigint; faq: bigint; scrolls: bigint }
  type Day = { day: string; views: bigint; uniqueVisitors: bigint; clicks: bigint }
  type Top = { location: string; count: bigint }
  const [totals, byDay, topClicks] = await Promise.all([
    db.$queryRaw<Totals[]>`
      SELECT COUNT(*) FILTER (WHERE name = 'landing_view') AS views,
             COUNT(DISTINCT "visitorId") FILTER (WHERE name = 'landing_view') AS "uniqueVisitors",
             COUNT(*) FILTER (WHERE name = 'cta_click') AS clicks,
             COUNT(*) FILTER (WHERE name = 'faq_open') AS faq,
             COUNT(*) FILTER (WHERE name = 'scroll_depth') AS scrolls
      FROM "SiteEvent" WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
        AND NOT ("visitorId" = ANY(${ignoredVisitors}::text[]))`,
    db.$queryRaw<Day[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS day,
             COUNT(*) FILTER (WHERE name = 'landing_view') AS views,
             COUNT(DISTINCT "visitorId") FILTER (WHERE name = 'landing_view') AS "uniqueVisitors",
             COUNT(*) FILTER (WHERE name = 'cta_click') AS clicks
      FROM "SiteEvent" WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
        AND NOT ("visitorId" = ANY(${ignoredVisitors}::text[]))
      GROUP BY 1 ORDER BY 1`,
    db.$queryRaw<Top[]>`
      SELECT COALESCE(NULLIF(location, ''), 'Não identificado') AS location, COUNT(*) AS count
      FROM "SiteEvent" WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
        AND name = 'cta_click' AND NOT ("visitorId" = ANY(${ignoredVisitors}::text[]))
      GROUP BY 1 ORDER BY count DESC LIMIT 8`,
  ])
  const daily = new Map(byDay.map(d => [d.day, d]))
  const trend: Array<{ day: string; views: number; uniqueVisitors: number; clicks: number }> = []
  for (let t = Date.parse(`${start}T12:00:00Z`); t <= Date.parse(`${end}T12:00:00Z`); t += DAY_MS) {
    const day = isoDay(new Date(t))
    const row = daily.get(day)
    trend.push({ day, views: Number(row?.views ?? 0), uniqueVisitors: Number(row?.uniqueVisitors ?? 0), clicks: Number(row?.clicks ?? 0) })
  }
  const total = totals[0]
  const visits = Number(total?.views ?? 0)
  const clicks = Number(total?.clicks ?? 0)
  const cookieStore = await cookies()
  return Response.json({
    range, start, end, views: visits, uniqueVisitors: Number(total?.uniqueVisitors ?? 0),
    clicks, faq: Number(total?.faq ?? 0), scrolls: Number(total?.scrolls ?? 0),
    clickRate: visits ? Math.round((clicks / visits) * 1000) / 10 : 0,
    trend, topClicks: topClicks.map(e => ({ location: e.location, count: Number(e.count) })),
    browserExcluded: isInternalCookie(cookieStore.get(ANALYTICS_IGNORE_COOKIE)?.value),
    ignoredIps, currentIp: getClientIp(req.headers),
  })
}
