import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import {
  LIBRARY_POSITION_KEY_PREFIX,
  isResumeExpired,
  libraryPositionKey,
  parseLibraryPosition,
  type LibraryPosition,
} from '@/lib/library-position'

const TABS = new Set(['todas', 'lancamentos', 'selecionadas', 'sazonal', 'favoritas', 'downloads', 'reprovadas', 'bocoes'])
const SORTS = new Set(['recentes', 'baixadas', 'nome'])

function isRealUser(session: Awaited<ReturnType<typeof getSessionUser>>) {
  // Demonstração pública não tem usuário no banco — a posição dela não
  // sobreviveria à troca de aparelho mesmo; não salva nada por ela.
  return !!session && !session.isDemo && !session.isPublicDemo
}

export async function GET() {
  const session = await getSessionUser()
  if (!session) return jsonError('Entre na sua conta para continuar de onde parou', 401)
  if (!isRealUser(session)) return Response.json({ position: null })

  const row = await db.setting.findUnique({ where: { key: libraryPositionKey(session.id) } })
  const position = parseLibraryPosition(row?.value)
  if (!position) return Response.json({ position: null })
  if (isResumeExpired(position)) {
    await db.setting.deleteMany({ where: { key: libraryPositionKey(session.id) } }).catch(() => {})
    return Response.json({ position: null })
  }
  // A arte-âncora pode ter sido excluída (ou sair do filtro). O cliente
  // cai para o índice salvo, então devolve a posição mesmo assim, com o
  // flag para ele avisar que foi para o ponto mais próximo.
  const art = await db.art.findUnique({ where: { id: position.artId }, select: { id: true, title: true, code: true } })
  return Response.json({
    position: {
      ...position,
      artTitle: art?.title ?? position.artTitle,
      artCode: art?.code ?? position.artCode,
      artExists: !!art,
    },
  })
}

export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Entre na sua conta para continuar de onde parou', 401)
  if (!isRealUser(session)) return jsonError('Posição indisponível na demonstração.', 403)

  const body = await req.json().catch(() => ({}))
  const artId = typeof body.artId === 'string' ? body.artId : ''
  const index = Number(body.index)
  const total = Number(body.total)
  const tab = typeof body.tab === 'string' && TABS.has(body.tab) ? body.tab : 'todas'
  const sort = typeof body.sort === 'string' && SORTS.has(body.sort) ? body.sort : 'recentes'
  if (!artId || !Number.isSafeInteger(index) || index < 0 || index > 100000 || !Number.isSafeInteger(total) || total < 0) {
    return jsonError('Posição inválida', 400)
  }
  const art = await db.art.findUnique({ where: { id: artId }, select: { id: true, title: true, code: true } })
  if (!art) return jsonError('Arte não encontrada', 404)

  const position: LibraryPosition = {
    artId: art.id,
    artTitle: art.title,
    artCode: art.code,
    index,
    total,
    tab,
    q: typeof body.q === 'string' ? body.q.trim().slice(0, 160) : '',
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 1) : [],
    tagIds: Array.isArray(body.tagIds) ? body.tagIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 30) : [],
    sort,
    seasonalEventId: typeof body.seasonalEventId === 'string' ? body.seasonalEventId.slice(0, 100) : null,
    savedAt: new Date().toISOString(),
  }
  const key = libraryPositionKey(session.id)
  await db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(position) }, update: { value: JSON.stringify(position) } })
  return Response.json({ position })
}

export async function DELETE() {
  const session = await getSessionUser()
  if (!session) return jsonError('Entre na sua conta', 401)
  if (!isRealUser(session)) return Response.json({ ok: true })
  await db.setting.deleteMany({ where: { key: `${LIBRARY_POSITION_KEY_PREFIX}${session.id}` } })
  return Response.json({ ok: true })
}
