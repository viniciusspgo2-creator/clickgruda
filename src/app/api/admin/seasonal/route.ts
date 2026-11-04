import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { nextEventDate, daysUntil } from '@/lib/seasonal'
import { ensureDefaultSeasonalEvents } from '@/lib/seasonal-defaults'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  await ensureDefaultSeasonalEvents()
  const [events, counts] = await Promise.all([
    db.seasonalEvent.findMany({ orderBy: [{ month: 'asc' }, { day: 'asc' }] }),
    db.art.groupBy({ by: ['seasonalEventId'], _count: true }),
  ])
  const map = new Map(counts.map((c) => [c.seasonalEventId, c._count]))
  const now = new Date()
  const list = events
    .map((e) => {
      const nextDate = nextEventDate(e, now)
      return {
        ...e,
        artCount: map.get(e.id) || 0,
        nextDate: nextDate.toISOString(),
        daysLeft: daysUntil(nextDate, now),
      }
    })
    .sort((x, y) => new Date(x.nextDate).getTime() - new Date(y.nextDate).getTime())
  return Response.json({ events: list })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
  if (body.action === 'add-defaults') {
    const created = await ensureDefaultSeasonalEvents(true)
    return Response.json({ created })
  }
  const name = (body.name || '').trim()
  const month = parseInt(body.month, 10)
  const day = parseInt(body.day, 10)
  if (!name) return jsonError('Nome do evento obrigatório', 400)
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 31)) {
    return jsonError('Data inválida', 400)
  }
  const event = await db.seasonalEvent.create({
    data: { name, emoji: body.emoji || '🎉', month, day },
  })
  return Response.json({ event })
}
