import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { nextOccurrence, daysUntil } from '@/lib/seasonal'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const [events, counts] = await Promise.all([
    db.seasonalEvent.findMany({ orderBy: [{ month: 'asc' }, { day: 'asc' }] }),
    db.art.groupBy({ by: ['seasonalEventId'], _count: true }),
  ])
  const map = new Map(counts.map((c) => [c.seasonalEventId, c._count]))
  const now = new Date()
  return Response.json({
    events: events.map((e) => {
      const nextDate = nextOccurrence(e.month, e.day, now)
      return {
        ...e,
        artCount: map.get(e.id) || 0,
        nextDate: nextDate.toISOString(),
        daysLeft: daysUntil(nextDate, now),
      }
    }),
  })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))
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
