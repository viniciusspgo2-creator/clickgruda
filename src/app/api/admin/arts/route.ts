import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { adminArtFiltersFromParams, buildAdminArtWhere } from '@/lib/admin-art-filters'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
  const pageSize = 40
  const where = buildAdminArtWhere(adminArtFiltersFromParams(url.searchParams))
  const [rows, total] = await Promise.all([
    db.art.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (Math.max(1, page) - 1) * pageSize,
      take: pageSize,
      include: { category: true, seasonalEvent: true, tags: { include: { tag: true } }, bocao: { select: { id: true } } },
    }),
    db.art.count({ where }),
  ])
  return Response.json({
    arts: rows.map((a) => ({
      id: a.id, code: a.code, title: a.title, imageUrl: a.imageUrl,
      isLaunch: a.isLaunch, isSelected: a.isSelected, isRejected: a.isRejected, bocaoId: a.bocao?.id ?? null, downloadsCount: a.downloadsCount,
      createdAt: a.createdAt.toISOString(),
      category: a.category ? { id: a.category.id, name: a.category.name, emoji: a.category.emoji } : null,
      seasonalEvent: a.seasonalEvent ? { id: a.seasonalEvent.id, name: a.seasonalEvent.name, emoji: a.seasonalEvent.emoji } : null,
      tags: a.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })), favorited: false,
    })),
    total, page: Math.max(1, page), pageSize, hasMore: Math.max(1, page) * pageSize < total,
  })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => ({}))

  const title = (body.title || '').trim()
  const imageUrl = (body.imageUrl || '').trim()
  if (!title) return jsonError('Título obrigatório', 400)
  if (!imageUrl) return jsonError('Envie uma imagem para a arte', 400)

  const tagNames: string[] = Array.isArray(body.tagNames) ? body.tagNames.filter(Boolean) : []

  const art = await db.art.create({
    data: {
      title,
      imageUrl,
      originalKey: typeof body.originalKey === 'string' && body.originalKey.startsWith('originals/') ? body.originalKey : null,
      isLaunch: Boolean(body.isLaunch),
      isSelected: Boolean(body.isSelected),
      isRejected: Boolean(body.isRejected),
      categoryId: body.categoryId || null,
      seasonalEventId: body.seasonalEventId || null,
      tags: {
        create: await Promise.all(
          tagNames.map(async (name) => {
            const tag = await db.tag.upsert({ where: { name }, update: {}, create: { name } })
            return { tagId: tag.id }
          })
        ),
      },
    },
  })

  return Response.json({ art })
}
