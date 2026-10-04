import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { getSettings, resolveProvider } from '@/lib/settings'
import { nextEventDate, daysUntil } from '@/lib/seasonal'
import { ensureDefaultSeasonalEvents } from '@/lib/seasonal-defaults'

export async function GET() {
  await ensureDefaultSeasonalEvents()
  const [session, settings, categories, tags, artsCount, launchesCount, catCounts, tagCounts, eventCounts, events] =
    await Promise.all([
      getSessionUser(),
      getSettings(),
      db.category.findMany({ orderBy: { name: 'asc' } }),
      db.tag.findMany({ orderBy: { name: 'asc' } }),
      db.art.count(),
      db.art.count({ where: { isLaunch: true } }),
      db.art.groupBy({ by: ['categoryId'], _count: true }),
      db.artTag.groupBy({ by: ['tagId'], _count: true }),
      db.art.groupBy({ by: ['seasonalEventId'], _count: true }),
      db.seasonalEvent.findMany(),
    ])

  const catCountMap = new Map(catCounts.map((c) => [c.categoryId, c._count]))
  const tagCountMap = new Map(tagCounts.map((t) => [t.tagId, t._count]))
  const eventCountMap = new Map(eventCounts.map((e) => [e.seasonalEventId, e._count]))

  const now = new Date()
  const eventsWithMeta = events
    .map((e) => {
      const nextDate = nextEventDate(e, now)
      return {
        id: e.id,
        name: e.name,
        emoji: e.emoji,
        month: e.month,
        day: e.day,
        nextDate: nextDate.toISOString(),
        daysLeft: daysUntil(nextDate, now),
        artCount: eventCountMap.get(e.id) || 0,
      }
    })
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())

  const [favCount, dlCount] = session
    ? await Promise.all([
        db.favorite.count({ where: { userId: session.id } }),
        db.download.findMany({ where: { userId: session.id }, select: { artId: true } }).then((rows) => new Set(rows.map((r) => r.artId)).size),
      ])
    : [0, 0]

  return Response.json({
    session,
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      icon: c.icon,
      artCount: catCountMap.get(c.id) || 0,
    })),
    tags: tags.map((t) => ({ id: t.id, name: t.name, artCount: tagCountMap.get(t.id) || 0 })),
    events: eventsWithMeta,
    nextEvent: eventsWithMeta[0] || null,
    counts: {
      arts: artsCount,
      lancamentos: launchesCount,
      favoritas: favCount,
      minhasDownloads: dlCount,
    },
    priceCents: parseInt(settings.price_cents || '4790', 10),
    provider: resolveProvider(settings),
    providers: {
      mercadopago: Boolean((settings.mercadopago_access_token || '').trim()),
      asaas: Boolean((settings.asaas_api_key || '').trim()),
    },
    /* A chave PIX é informação pós-cadastro: só vai ao cliente autenticado. */
    manualPix: {
      enabled: settings.pix_manual_enabled === 'true' && Boolean((settings.pix_key || '').trim()),
      key: session && settings.pix_manual_enabled === 'true' ? settings.pix_key || '' : '',
      holder: session ? settings.pix_holder || '' : '',
    },
  })
}
