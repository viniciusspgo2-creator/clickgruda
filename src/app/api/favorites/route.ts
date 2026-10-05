import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { queryArts } from '@/lib/arts'

export async function GET() {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para ver seus favoritos', 401)
  const { arts, total } = await queryArts({ userId: session.id, tab: 'favoritas', pageSize: 200 })
  return Response.json({ arts, total })
}

export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para favoritar', 401)

  const body = await req.json().catch(() => ({}))
  const artId = body.artId
  if (!artId) return jsonError('artId obrigatório', 400)

  const existing = await db.favorite.findUnique({
    where: { userId_artId: { userId: session.id, artId } },
  })

  if (existing) {
    await db.favorite.delete({ where: { userId_artId: { userId: session.id, artId } } })
    return Response.json({ favorited: false })
  }

  await db.favorite.create({ data: { userId: session.id, artId } })
  return Response.json({ favorited: true })
}
