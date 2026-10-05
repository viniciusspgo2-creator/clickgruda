import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { queryArts } from '@/lib/arts'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const url = new URL(req.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
  const q = (url.searchParams.get('q') || '').trim()
  const result = await queryArts({ userId: null, tab: 'todas', q, page, pageSize: 40 })
  return Response.json(result)
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
