import type { Prisma } from '@prisma/client'
import { buildArtWhere } from '@/lib/arts'

/** Os mesmos filtros são usados na lista e nas edições de todos os resultados. */
export type AdminArtFilters = {
  q: string
  categoryId: string
  seasonalEventId: string
  launch: string
  selected: string
}

export const DEFAULT_ADMIN_ART_FILTERS: AdminArtFilters = {
  q: '', categoryId: 'all', seasonalEventId: 'all', launch: 'all', selected: 'all',
}

export function normalizeAdminArtFilters(input: Partial<AdminArtFilters>): AdminArtFilters {
  return {
    q: typeof input.q === 'string' ? input.q.trim().slice(0, 150) : '',
    categoryId: typeof input.categoryId === 'string' && input.categoryId ? input.categoryId.slice(0, 100) : 'all',
    seasonalEventId: typeof input.seasonalEventId === 'string' && input.seasonalEventId ? input.seasonalEventId.slice(0, 100) : 'all',
    launch: input.launch === 'yes' || input.launch === 'no' ? input.launch : 'all',
    selected: input.selected === 'yes' || input.selected === 'no' ? input.selected : 'all',
  }
}

export function adminArtFiltersFromParams(params: URLSearchParams): AdminArtFilters {
  return normalizeAdminArtFilters({
    q: params.get('q') || '',
    categoryId: params.get('categoryId') || 'all',
    seasonalEventId: params.get('seasonalEventId') || 'all',
    launch: params.get('launch') || 'all',
    selected: params.get('selected') || 'all',
  })
}

export function buildAdminArtWhere(filters: AdminArtFilters): Prisma.ArtWhereInput {
  const AND: Prisma.ArtWhereInput[] = [buildArtWhere({ q: filters.q })]
  if (filters.categoryId !== 'all') {
    AND.push({ categoryId: filters.categoryId === 'none' ? null : filters.categoryId })
  }
  if (filters.seasonalEventId !== 'all') {
    AND.push({ seasonalEventId: filters.seasonalEventId === 'none' ? null : filters.seasonalEventId })
  }
  if (filters.launch !== 'all') AND.push({ isLaunch: filters.launch === 'yes' })
  if (filters.selected !== 'all') AND.push({ isSelected: filters.selected === 'yes' })
  return { AND }
}

export function hasActiveAdminArtFilters(filters: AdminArtFilters) {
  return Boolean(filters.q || filters.categoryId !== 'all' || filters.seasonalEventId !== 'all' || filters.launch !== 'all' || filters.selected !== 'all')
}
