import { createHash } from 'node:crypto'
import { db } from '@/lib/db'

const ALLOWED = new Set(['landing_view', 'cta_click', 'faq_open', 'scroll_depth', 'feature_click'])
/** Métricas próprias do painel; identificador aleatório anônimo, sem IP. */
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) return new Response(null, { status: 403 })
  const body = await req.json().catch(() => null)
  if (!body || !ALLOWED.has(body.event) || typeof body.visitorId !== 'string' || !/^[0-9a-f-]{20,50}$/i.test(body.visitorId)) {
    return Response.json({ error: 'Evento inválido.' }, { status: 400 })
  }
  const name = body.event as string
  const visitorId = createHash('sha256').update(body.visitorId).digest('hex')
  const location = typeof body.location === 'string' ? body.location.slice(0, 70).replace(/[^a-zA-Z0-9_\-]/g, '') : ''
  // Reduz ruído de spam e eventos duplicados no mesmo intervalo.
  const since = new Date(Date.now() - (name === 'landing_view' ? 30_000 : 2_000))
  if (await db.siteEvent.count({ where: { visitorId, name, location, createdAt: { gte: since } } })) return Response.json({ ok: true })
  await db.siteEvent.create({ data: { visitorId, name, location } })
  return Response.json({ ok: true })
}
