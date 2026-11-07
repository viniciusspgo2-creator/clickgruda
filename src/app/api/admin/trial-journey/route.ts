import { getSessionUser, jsonError } from '@/lib/auth'
import { getTrialJourney } from '@/lib/trial-journey'

const DAY = 86_400_000
const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s
export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const search = new URL(req.url).searchParams
  const range = search.get('range') || '30d'
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  let start = today, end = today
  if (range === '7d' || range === '30d') start = new Date(Date.parse(today + 'T12:00:00Z') - (range === '7d' ? 6 : 29) * DAY).toISOString().slice(0, 10)
  else if (range === 'custom') {
    start = search.get('start') || ''; end = search.get('end') || ''
    if (!validDay(start) || !validDay(end) || start > end || Date.parse(end) - Date.parse(start) > 365 * DAY) return jsonError('Período inválido. Selecione até 366 dias.', 400)
  } else if (range !== 'today') return jsonError('Filtro inválido.', 400)
  const from = new Date(start + 'T03:00:00Z'), to = new Date(Date.parse(end + 'T03:00:00Z') + DAY)
  return Response.json({ range, start, end, ...await getTrialJourney(from, to) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
