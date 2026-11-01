import { getSessionUser, jsonError } from '@/lib/auth'
import { ANNOUNCEMENT_KINDS, readAnnouncement, writeAnnouncement, type AnnouncementKind } from '@/lib/announcement'

export const dynamic = 'force-dynamic'

async function isAdmin() { const user = await getSessionUser(); return user?.role === 'ADMIN' }

export async function GET() {
  if (!(await isAdmin())) return jsonError('Não autorizado', 401)
  return Response.json({ announcement: await readAnnouncement() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados inválidos', 400)
  const kind = ANNOUNCEMENT_KINDS.includes(body.kind as AnnouncementKind) ? body.kind as AnnouncementKind : 'NOVIDADE'
  const title = String(body.title ?? '').trim()
  const message = String(body.message ?? '').trim()
  const enabled = body.enabled === true
  if (title.length > 90 || message.length > 650) return jsonError('Título ou mensagem excede o limite', 400)
  if (enabled && (!title || !message)) return jsonError('Informe título e mensagem antes de publicar', 400)
  const previous = await readAnnouncement()
  const revision = enabled ? `${Date.now()}-${Math.random().toString(36).slice(2,9)}` : previous.revision
  const announcement = { kind, title, message, enabled, revision }
  await writeAnnouncement(announcement)
  return Response.json({ announcement }, { headers: { 'Cache-Control': 'no-store' } })
}
