import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import {
  ANALYTICS_IGNORE_COOKIE, ANALYTICS_IGNORE_IPS_KEY, ANALYTICS_IGNORE_VISITORS_KEY,
  getClientIp, isInternalCookie, readStringList, validVisitorId, visitorHash,
} from '@/lib/analytics-privacy'

const ALLOWED = new Set(['landing_view', 'cta_click', 'faq_open', 'scroll_depth', 'feature_click'])
/** Registra apenas eventos da landing; não persiste endereço IP. */
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return new Response(null, { status: 403 })
  const body = await req.json().catch(() => null)
  if (!body || !ALLOWED.has(body.event) || !validVisitorId(body.visitorId)) {
    return Response.json({ error: 'Evento inválido.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  if (isInternalCookie(cookieStore.get(ANALYTICS_IGNORE_COOKIE)?.value)) return Response.json({ ok: true, ignored: true })

  // Mesmo sem marcar o navegador, um Admin Master autenticado não infla as métricas.
  if (cookieStore.has('cg_session')) {
    const user = await getSessionUser()
    if (user?.role === 'ADMIN') return Response.json({ ok: true, ignored: true })
  }

  const visitorId = visitorHash(body.visitorId)
  const [excludedBrowsers, excludedIps] = await Promise.all([
    db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_VISITORS_KEY } }),
    db.setting.findUnique({ where: { key: ANALYTICS_IGNORE_IPS_KEY } }),
  ])
  if (readStringList(excludedBrowsers?.value).includes(visitorId)) return Response.json({ ok: true, ignored: true })
  const ip = getClientIp(req.headers)
  if (ip && readStringList(excludedIps?.value).includes(ip)) return Response.json({ ok: true, ignored: true })

  const name = body.event as string
  const location = typeof body.location === 'string' ? body.location.slice(0, 70).replace(/[^a-zA-Z0-9_\-]/g, '') : ''
  const since = new Date(Date.now() - (name === 'landing_view' ? 30_000 : 2_000))
  if (await db.siteEvent.count({ where: { visitorId, name, location, createdAt: { gte: since } } })) return Response.json({ ok: true })
  await db.siteEvent.create({ data: { visitorId, name, location } })
  return Response.json({ ok: true })
}
