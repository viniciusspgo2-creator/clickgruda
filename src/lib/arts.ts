import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { parseArtCode } from '@/lib/art-code'

export type ArtDTO = {
  id: string
  code: number
  title: string
  imageUrl: string
  isLaunch: boolean
  isSelected: boolean
  downloadsCount: number
  createdAt: string
  category: { id: string; name: string; emoji: string } | null
  seasonalEvent: { id: string; name: string; emoji: string } | null
  tags: { id: string; name: string }[]
  favorited: boolean
}

export type ArtQuery = {
  userId?: string | null
  /** todas | lancamentos | selecionadas | sazonal | favoritas | downloads */
  tab?: string
  q?: string
  categoryIds?: string[]
  tagIds?: string[]
  eventId?: string | null
  sort?: 'recentes' | 'baixadas' | 'nome' | string
  page?: number
  pageSize?: number
}

export type ArtPage = { arts: ArtDTO[]; total: number; page: number; pageSize: number; hasMore: boolean }

const INCLUDE = {
  category: true,
  seasonalEvent: true,
  tags: { include: { tag: true } },
} satisfies Prisma.ArtInclude

type ArtRow = Prisma.ArtGetPayload<{ include: typeof INCLUDE }>

function toDTO(a: ArtRow, favSet: Set<string>): ArtDTO {
  return {
    id: a.id,
    code: a.code,
    title: a.title,
    imageUrl: a.imageUrl,
    isLaunch: a.isLaunch,
    isSelected: a.isSelected,
    downloadsCount: a.downloadsCount,
    createdAt: a.createdAt.toISOString(),
    category: a.category ? { id: a.category.id, name: a.category.name, emoji: a.category.emoji } : null,
    seasonalEvent: a.seasonalEvent ? { id: a.seasonalEvent.id, name: a.seasonalEvent.name, emoji: a.seasonalEvent.emoji } : null,
    tags: a.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
    favorited: favSet.has(a.id),
  }
}

/** Monta o filtro no BANCO (nada de carregar o acervo inteiro em memória). */
export function buildArtWhere(o: ArtQuery): Prisma.ArtWhereInput {
  const AND: Prisma.ArtWhereInput[] = []
  const tab = o.tab || 'todas'

  if (tab === 'lancamentos') AND.push({ isLaunch: true })
  if (tab === 'selecionadas') AND.push({ isSelected: true })
  if (tab === 'sazonal') AND.push({ seasonalEventId: { not: null } })
  if (tab === 'favoritas') AND.push({ favorites: { some: { userId: o.userId || '__none__' } } })

  if (o.eventId) AND.push({ seasonalEventId: o.eventId })
  if (o.categoryIds?.length) AND.push({ categoryId: { in: o.categoryIds } })
  if (o.tagIds?.length) AND.push({ tags: { some: { tagId: { in: o.tagIds } } } })

  const q = (o.q || '').trim()
  if (q) {
    const code = parseArtCode(q)
    const or: Prisma.ArtWhereInput[] = [
      { title: { contains: q, mode: 'insensitive' } },
      { category: { is: { name: { contains: q, mode: 'insensitive' } } } },
      { seasonalEvent: { is: { name: { contains: q, mode: 'insensitive' } } } },
      { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' } } } } },
    ]
    if (code !== null) or.push({ code })
    AND.push({ OR: or })
  }
  return AND.length ? { AND } : {}
}

function orderBy(sort?: string): Prisma.ArtOrderByWithRelationInput[] {
  if (sort === 'baixadas') return [{ downloadsCount: 'desc' }, { id: 'asc' }]
  if (sort === 'nome') return [{ title: 'asc' }, { id: 'asc' }]
  return [{ createdAt: 'desc' }, { id: 'asc' }]
}

async function favSetFor(userId: string | null | undefined, ids: string[]) {
  if (!userId || !ids.length) return new Set<string>()
  const favs: { artId: string }[] = await db.favorite.findMany({ where: { userId, artId: { in: ids } }, select: { artId: true } })
  return new Set<string>(favs.map((f) => f.artId))
}

/**
 * Busca PAGINADA de artes — filtra, ordena e pagina direto no Postgres.
 * Funciona com milhares de artes (a aba "Meus downloads" ordena pela recência do download).
 */
export async function queryArts(o: ArtQuery): Promise<ArtPage> {
  const pageSize = Math.min(Math.max(o.pageSize || 48, 1), 200)
  const page = Math.max(o.page || 1, 1)
  const skip = (page - 1) * pageSize
  const where = buildArtWhere(o)

  if ((o.tab || 'todas') === 'downloads' && o.userId) {
    const order = await userDownloadOrder(o.userId)
    // respeita busca/filtros: só os ids que ainda batem com o filtro
    const matching: { id: string }[] = await db.art.findMany({ where: { AND: [where, { id: { in: order } }] }, select: { id: true } })
    const allowed = new Set<string>(matching.map((a) => a.id))
    const ids = order.filter((id) => allowed.has(id))
    const pageIds = ids.slice(skip, skip + pageSize)
    const rows = await db.art.findMany({ where: { id: { in: pageIds } }, include: INCLUDE })
    const byId = new Map(rows.map((r) => [r.id, r]))
    const favSet = await favSetFor(o.userId, pageIds)
    const arts = pageIds.map((id) => byId.get(id)).filter(Boolean).map((r) => toDTO(r as ArtRow, favSet))
    return { arts, total: ids.length, page, pageSize, hasMore: skip + pageSize < ids.length }
  }

  const [rows, total] = await Promise.all([
    db.art.findMany({ where, orderBy: orderBy(o.sort), skip, take: pageSize, include: INCLUDE }),
    db.art.count({ where }),
  ])
  const favSet = await favSetFor(o.userId, rows.map((r) => r.id))
  return { arts: rows.map((r) => toDTO(r, favSet)), total, page, pageSize, hasMore: skip + rows.length < total }
}

/** Ordered unique art ids a user has downloaded (most recent first). */
export async function userDownloadOrder(userId: string): Promise<string[]> {
  const dls = await db.download.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { artId: true },
  })
  const seen = new Set<string>()
  const order: string[] = []
  for (const d of dls) {
    if (!seen.has(d.artId)) {
      seen.add(d.artId)
      order.push(d.artId)
    }
  }
  return order
}
