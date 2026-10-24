import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const [groups, visitors, events] = await Promise.all([
    db.siteEvent.groupBy({ by: ['name'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    db.siteEvent.groupBy({ by: ['visitorId'], where: { createdAt: { gte: since }, name: 'landing_view' }, _count: { _all: true } }),
    db.siteEvent.groupBy({ by: ['location', 'name'], where: { createdAt: { gte: since }, name: 'cta_click' }, _count: { _all: true }, orderBy: { _count: { location: 'desc' } }, take: 15 }),
  ])
  const get = (name: string) => groups.find((row) => row.name === name)?._count._all || 0
  return Response.json({ period: '30 dias', views: get('landing_view'), uniqueVisitors: visitors.length,
    clicks: get('cta_click'), faq: get('faq_open'), scrolls: get('scroll_depth'),
    topClicks: events.map((e) => ({ location: e.location || 'Não identificado', count: e._count._all })).sort((a,b) => b.count - a.count) })
}
