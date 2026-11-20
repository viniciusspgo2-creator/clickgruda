/**
 * Continuar de onde parou — Biblioteca.
 *
 * A posição é guardada NA CONTA (servidor), não só no navegador, para valer
 * no PC, no celular e na TV. A âncora é a ÚLTIMA ARTE VISTA (id + índice
 * na lista filtrada), nunca a posição em pixels: arte nova entra no topo
 * em "Mais recentes" e empurra tudo, então o pixel de ontem aponta para
 * outra arte hoje.
 *
 * Sem migração de banco, de propósito: usa a tabela Setting, que já existe,
 * no mesmo padrão de member-profile, studio grants e cupons. Chave:
 * `library-position:<userId>`. Um registro por conta: a última navegação
 * vence — cada combinação de filtros é um contexto, e retomar só faz
 * sentido no mesmo contexto em que a pessoa parou.
 */

export const LIBRARY_POSITION_KEY_PREFIX = 'library-position:'

/** Só vale mostrar "continuar" depois da 1ª página (48 artes/página). */
export const RESUME_MIN_INDEX = 48
/** Posição mais velha que isso é considerada obsoleta e some sozinha. */
export const RESUME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export type LibraryPosition = {
  artId: string
  artTitle: string
  artCode: number | null
  /** Índice 0-based da arte na lista filtrada/ordenada no momento em que parou. */
  index: number
  total: number
  tab: string
  q: string
  categoryIds: string[]
  tagIds: string[]
  sort: string
  seasonalEventId: string | null
  savedAt: string
}

export function libraryPositionKey(userId: string) {
  return `${LIBRARY_POSITION_KEY_PREFIX}${userId}`
}

/** Chave do contexto de navegação — retomar só vale no mesmo contexto. */
export function libraryFilterKey(p: Pick<LibraryPosition, 'tab' | 'q' | 'categoryIds' | 'tagIds' | 'sort' | 'seasonalEventId'>) {
  return JSON.stringify([p.tab, p.q, [...p.categoryIds].sort(), [...p.tagIds].sort(), p.sort, p.seasonalEventId])
}

export function parseLibraryPosition(value: unknown): LibraryPosition | null {
  try {
    const data = typeof value === 'string' ? JSON.parse(value) : value
    if (!data || typeof data !== 'object') return null
    const artId = typeof data.artId === 'string' ? data.artId : ''
    const index = Number(data.index)
    const total = Number(data.total)
    const savedAt = typeof data.savedAt === 'string' ? data.savedAt : ''
    if (!artId || !Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(total) || total < 0 || !savedAt || Number.isNaN(Date.parse(savedAt))) return null
    const tab = typeof data.tab === 'string' ? data.tab : 'todas'
    const sort = typeof data.sort === 'string' ? data.sort : 'recentes'
    return {
      artId,
      artTitle: typeof data.artTitle === 'string' ? data.artTitle : '',
      artCode: Number.isSafeInteger(data.artCode) ? data.artCode : null,
      index,
      total,
      tab,
      q: typeof data.q === 'string' ? data.q.slice(0, 160) : '',
      categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 1) : [],
      tagIds: Array.isArray(data.tagIds) ? data.tagIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 30) : [],
      sort,
      seasonalEventId: typeof data.seasonalEventId === 'string' ? data.seasonalEventId : null,
      savedAt,
    }
  } catch {
    return null
  }
}

export function isResumeExpired(position: LibraryPosition, now = Date.now()) {
  return now - Date.parse(position.savedAt) > RESUME_MAX_AGE_MS
}
