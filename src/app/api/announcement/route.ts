import { getSessionUser, jsonError } from '@/lib/auth'
import { readAnnouncement } from '@/lib/announcement'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return jsonError('Não autorizado', 401)
  const announcement = await readAnnouncement()
  return Response.json({ announcement: announcement.enabled ? announcement : null }, { headers: { 'Cache-Control': 'private, no-store' } })
}
