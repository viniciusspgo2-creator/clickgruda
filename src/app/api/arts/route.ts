import { getSessionUser, jsonError } from '@/lib/auth'
import { listArtsForUser, userDownloadOrder } from '@/lib/arts'
import { formatArtCode, parseArtCode } from '@/lib/art-code'

function csv(param: string | null): string[] {
  if (!param) return []
  return param.split(',').filter(Boolean)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const session = await getSessionUser()

  const tab = url.searchParams.get('tab') || 'todas'
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()
  const categoryIds = csv(url.searchParams.get('categories'))
  const tagIds = csv(url.searchParams.get('tags'))
  const eventId = url.searchParams.get('event')
  const sort = url.searchParams.get('sort') || 'recentes'
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10) || 500, 500)

  if ((tab === 'favoritas' || tab === 'downloads') && !session) {
    return jsonError('Faça login para ver esta aba', 401)
  }

  let arts = await listArtsForUser(session?.id ?? null)

  if (tab === 'lancamentos') arts = arts.filter((a) => a.isLaunch)
  if (tab === 'selecionadas') arts = arts.filter((a) => a.isSelected)
  if (tab === 'sazonal') arts = arts.filter((a) => a.seasonalEvent)

  if (eventId) arts = arts.filter((a) => a.seasonalEvent?.id === eventId)

  if (categoryIds.length) arts = arts.filter((a) => a.category && categoryIds.includes(a.category.id))
  if (tagIds.length) arts = arts.filter((a) => a.tags.some((t) => tagIds.includes(t.id)))

  if (q) {
    const codeQ = parseArtCode(q)
    arts = arts.filter(
      (a) =>
        (codeQ !== null && a.code === codeQ) ||
        formatArtCode(a.code).toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        (a.category?.name || '').toLowerCase().includes(q) ||
        (a.seasonalEvent?.name || '').toLowerCase().includes(q) ||
        a.tags.some((t) => t.name.toLowerCase().includes(q))
    )
  }

  if (tab === 'favoritas') {
    arts = arts.filter((a) => a.favorited)
  }

  if (tab === 'downloads' && session) {
    const order = await userDownloadOrder(session.id)
    const map = new Map(arts.map((a) => [a.id, a]))
    arts = order.map((id) => map.get(id)).filter(Boolean) as typeof arts
  }

  if (tab !== 'downloads') {
    if (sort === 'baixadas') arts.sort((a, b) => b.downloadsCount - a.downloadsCount)
    else if (sort === 'nome') arts.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    else arts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  const total = arts.length
  return Response.json({ arts: arts.slice(0, limit), total })
}
