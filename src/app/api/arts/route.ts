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

  // Somente sessões com acesso visualizam os metadados e URLs das artes.
  // O modo demonstração continua disponível a quem recebeu acesso de demo;
  // a proteção de arquivos originais deve continuar no endpoint de download/storage.
  if (!session) return jsonError('Entre na sua conta para consultar o acervo', 401)
  if (!session.hasAccess && session.role !== 'ADMIN') return jsonError('Acesso necessário para consultar o acervo', 403)

  const allowedTabs = new Set(['todas', 'lancamentos', 'selecionadas', 'sazonal', 'favoritas', 'downloads', 'reprovadas'])
  const tabParam = url.searchParams.get('tab') || 'todas'
  const tab = allowedTabs.has(tabParam) ? tabParam : 'todas'
  const q = (url.searchParams.get('q') || '').trim().slice(0, 160)
  const categoryIds = csv(url.searchParams.get('categories')).slice(-1)
  const tagIds = csv(url.searchParams.get('tags')).slice(0, 30)
  const eventId = url.searchParams.get('event')?.slice(0, 100) || null
  const sortParam = url.searchParams.get('sort') || 'recentes'
  const sort = ['recentes', 'baixadas', 'nome'].includes(sortParam) ? sortParam : 'recentes'
  const requestedPage = Number(url.searchParams.get('page') || 1)
  const page = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 10000) : 1
  const requestedSize = Number(url.searchParams.get('limit') || 48)
  const pageSize = Number.isSafeInteger(requestedSize) ? Math.min(Math.max(requestedSize, 1), 100) : 48

  const result = await queryArts({ userId: session?.id ?? null, tab, q, categoryIds, tagIds, eventId, sort, page, pageSize })
  if (session.isDemo) {
    for (const art of result.arts) art.imageUrl = `/api/arts/${art.id}/preview`
  }

  // Busca livre sem nenhum resultado = tema que o acervo ainda não tem → fila de temas do admin
  if (q && page === 1 && result.total === 0 && tab === 'todas' && !categoryIds.length && !tagIds.length && !eventId) {
    if (session && session.hasAccess && !session.isDemo && session.role !== 'ADMIN') {
      await recordSearchMiss(q, session.id)
    }
  }

  return Response.json(result)
}
