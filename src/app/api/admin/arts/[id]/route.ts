import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) data.title = body.title.trim()
  if (typeof body.imageUrl === 'string' && body.imageUrl.trim()) data.imageUrl = body.imageUrl.trim()
  if (typeof body.originalKey === 'string' && body.originalKey.startsWith('originals/')) data.originalKey = body.originalKey
  if (typeof body.isLaunch === 'boolean') data.isLaunch = body.isLaunch
  if ('categoryId' in body) data.categoryId = body.categoryId || null
  if ('seasonalEventId' in body) data.seasonalEventId = body.seasonalEventId || null

  if (Array.isArray(body.tagNames)) {
    const tagNames: string[] = body.tagNames.filter(Boolean)
    const tags = await Promise.all(
      tagNames.map(async (name) => db.tag.upsert({ where: { name }, update: {}, create: { name } }))
    )
    await db.artTag.deleteMany({ where: { artId: id } })
    data.tags = { create: tags.map((t) => ({ tagId: t.id })) }
  }

  const art = await db.art.update({ where: { id }, data })
  return Response.json({ art })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  await db.artTag.deleteMany({ where: { artId: id } })
  await db.favorite.deleteMany({ where: { artId: id } })
  await db.download.deleteMany({ where: { artId: id } })
  await db.art.delete({ where: { id } })
  return Response.json({ ok: true })
}
