import { getSessionUser, jsonError } from '@/lib/auth'
import { buildArtWhere } from '@/lib/arts'
import { relatedSearches } from '@/lib/art-search'
import { db } from '@/lib/db'

/** Sugestões somente para assinantes; não expõe dados de um catálogo privado publicamente. */
export async function GET(request: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Entre na sua conta', 401)
  if (!session.hasAccess && session.role !== 'ADMIN') return jsonError('Sem acesso', 403)

  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 70)
  if (q.length < 2) return Response.json({ suggestions: [], related: [] })
  const rows = await db.art.findMany({
    where: buildArtWhere({ q }),
    orderBy: [{ downloadsCount: 'desc' }, { createdAt: 'desc' }],
    select: { title: true },
    take: 24,
  })
  const names = [...new Set(rows.map((row) => row.title))].slice(0, 6)
  return Response.json({ suggestions: names, related: relatedSearches(q) }, {
    headers: { 'Cache-Control': 'private, max-age=30' },
  })
}
