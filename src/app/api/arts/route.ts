import { getSessionUser, jsonError } from '@/lib/auth'
import { queryArts } from '@/lib/arts'
import { recordSearchMiss } from '@/lib/search-miss'

function csv(param: string | null): string[] {
  if (!param) return []
  return param.split(',').filter(Boolean)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const session = await getSessionUser()

  const tab = url.searchParams.get('tab') || 'todas'
  const q = (url.searchParams.get('q') || '').trim()
  const categoryIds = csv(url.searchParams.get('categories'))
  const tagIds = csv(url.searchParams.get('tags'))
  const eventId = url.searchParams.get('event')
  const sort = url.searchParams.get('sort') || 'recentes'
  const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
  const pageSize = Math.min(parseInt(url.searchParams.get('limit') || '48', 10) || 48, 100)

  if ((tab === 'favoritas' || tab === 'downloads') && !session) {
    return jsonError('Faça login para ver esta aba', 401)
  }

  const result = await queryArts({ userId: session?.id ?? null, tab, q, categoryIds, tagIds, eventId, sort, page, pageSize })

  // Busca livre sem nenhum resultado = tema que o acervo ainda não tem → fila de temas do admin
  if (q && page === 1 && result.total === 0 && tab === 'todas' && !categoryIds.length && !tagIds.length && !eventId) {
    if (session && session.hasAccess && !session.isDemo && session.role !== 'ADMIN') {
      await recordSearchMiss(q, session.id)
    }
  }

  return Response.json(result)
}
