import { getSessionUser, jsonError } from '@/lib/auth'
import { ANNOUNCEMENT_KINDS, readAnnouncement, writeAnnouncement, type AnnouncementKind, type AnnouncementContent, type PortalAnnouncement } from '@/lib/announcement'

export const dynamic = 'force-dynamic'

async function isAdmin() { const user = await getSessionUser(); return user?.role === 'ADMIN' }
const safeKind = (kind: unknown): AnnouncementKind =>
  ANNOUNCEMENT_KINDS.includes(kind as AnnouncementKind) ? kind as AnnouncementKind : 'NOVIDADE'

export async function GET() {
  if (!(await isAdmin())) return jsonError('Não autorizado', 401)
  return Response.json({ announcement: await readAnnouncement() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados inválidos', 400)
  const kind = safeKind(body.kind)
  const title = String(body.title ?? '').trim()
  const message = String(body.message ?? '').trim()
  const layout: NonNullable<PortalAnnouncement['layout']> = body.layout === 'double' ? 'double' : 'single'
  const enabled = body.enabled === true
  const rawSecondary = body.secondary && typeof body.secondary === 'object' && !Array.isArray(body.secondary)
    ? body.secondary as Record<string, unknown> : {}
  const secondary: AnnouncementContent = {
    kind: safeKind(rawSecondary.kind),
    title: String(rawSecondary.title ?? '').trim(),
    message: String(rawSecondary.message ?? '').trim(),
  }
  if (title.length > 90 || message.length > 650 || secondary.title.length > 90 || secondary.message.length > 650)
    return jsonError('Título ou mensagem excede o limite', 400)
  if (enabled && (!title || !message)) return jsonError('Preencha o primeiro aviso antes de publicar', 400)
  if (enabled && layout === 'double' && (!secondary.title || !secondary.message))
    return jsonError('Preencha título e mensagem do segundo aviso para publicar o pop-up duplo', 400)
  const previous = await readAnnouncement()
  const revision = enabled ? `${Date.now()}-${Math.random().toString(36).slice(2,9)}` : previous.revision
  const announcement: PortalAnnouncement = { kind, title, message, enabled, revision, layout, secondary }
  await writeAnnouncement(announcement)
  return Response.json({ announcement }, { headers: { 'Cache-Control': 'no-store' } })
}
