import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { buildAdminArtWhere, hasActiveAdminArtFilters, normalizeAdminArtFilters } from '@/lib/admin-art-filters'

const MAX_ARTS_PER_ACTION = 10000
const idsSchema = z.array(z.string().min(1).max(100)).min(1).max(MAX_ARTS_PER_ACTION)
const filtersSchema = z.object({
  q: z.string().max(150), categoryId: z.string().max(100),
  seasonalEventId: z.string().max(100), launch: z.string(), selected: z.string(), quality: z.string().optional(),
})
const changesSchema = z.object({
  categoryId: z.string().max(100).optional().nullable(),
  seasonalEventId: z.string().max(100).optional().nullable(),
  isLaunch: z.boolean().optional(),
  isSelected: z.boolean().optional(),
  tagNames: z.array(z.string().min(1).max(60)).max(20).optional(),
  tagMode: z.enum(['add', 'remove']).optional(),
}).strict()
const schema = z.discriminatedUnion('scope', [
  z.object({ scope: z.literal('ids'), ids: idsSchema, expectedCount: z.number().int().positive(), changes: changesSchema, confirmedLarge: z.boolean().optional() }),
  z.object({ scope: z.literal('filter'), filters: filtersSchema, excludedIds: z.array(z.string().min(1).max(100)).max(MAX_ARTS_PER_ACTION), expectedCount: z.number().int().positive(), changes: changesSchema, confirmedLarge: z.boolean().optional() }),
])

/** Atualiza somente os campos informados. Não altera títulos, originais ou downloads. */
export async function PATCH(req: Request) {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return jsonError('Não autorizado', 401)

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return jsonError('Dados inválidos para edição em lote.', 400)
  const body = parsed.data
  const changes = body.changes
  const tagNames = [...new Set((changes.tagNames || []).map((name) => name.trim().toLowerCase()).filter(Boolean))]
  if (!('categoryId' in changes) && !('seasonalEventId' in changes) &&
      !('isLaunch' in changes) && !('isSelected' in changes) && !tagNames.length) {
    return jsonError('Selecione pelo menos uma alteração.', 400)
  }
  if (body.expectedCount > MAX_ARTS_PER_ACTION) return jsonError('Limite de 10.000 artes por operação.', 400)
  if (body.expectedCount > 100 && body.confirmedLarge !== true) return jsonError('Confirme explicitamente a edição de mais de 100 artes.', 400)

  const filters = body.scope === 'filter' ? normalizeAdminArtFilters(body.filters) : null
  if (body.scope === 'filter' && filters && !hasActiveAdminArtFilters(filters) && body.confirmedLarge !== true) {
    return jsonError('Confirme explicitamente a alteração de todo o acervo.', 400)
  }
  const targetWhere: Prisma.ArtWhereInput = body.scope === 'ids'
    ? { id: { in: [...new Set(body.ids)] } }
    : { AND: [buildAdminArtWhere(filters!), { id: { notIn: body.excludedIds } }] }

  // Validação ANTES de gravar, para que IDs incorretos não causem alterações parciais.
  if (changes.categoryId) {
    const category = await db.category.findUnique({ where: { id: changes.categoryId }, select: { id: true } })
    if (!category) return jsonError('A categoria escolhida não existe mais.', 400)
  }
  if (changes.seasonalEventId) {
    const event = await db.seasonalEvent.findUnique({ where: { id: changes.seasonalEventId }, select: { id: true } })
    if (!event) return jsonError('A data sazonal escolhida não existe mais.', 400)
  }

  const update: Prisma.ArtUncheckedUpdateManyInput = {}
  if ('categoryId' in changes) update.categoryId = changes.categoryId || null
  if ('seasonalEventId' in changes) update.seasonalEventId = changes.seasonalEventId || null
  if ('isLaunch' in changes) update.isLaunch = changes.isLaunch
  if ('isSelected' in changes) update.isSelected = changes.isSelected

  try {
    // Transação: a lista e a contagem precisam estar consistentes; ou todas mudam, ou nenhuma.
    const count = await db.$transaction(async (tx) => {
      const matches = await tx.art.findMany({ where: targetWhere, select: { id: true } })
      if (matches.length !== body.expectedCount) {
        throw new Error('A seleção mudou desde a última consulta. Atualize a lista e selecione novamente.')
      }
      if (matches.length > MAX_ARTS_PER_ACTION) throw new Error('A seleção excede 10.000 artes.')
      const ids = matches.map((a) => a.id)
      if (Object.keys(update).length) await tx.art.updateMany({ where: { id: { in: ids } }, data: update })

      if (tagNames.length) {
        if (changes.tagMode === 'remove') {
          const tags = await tx.tag.findMany({ where: { name: { in: tagNames } }, select: { id: true } })
          if (tags.length) await tx.artTag.deleteMany({ where: { artId: { in: ids }, tagId: { in: tags.map((t) => t.id) } } })
        } else {
          const tagIds: string[] = []
          for (const name of tagNames) {
            const tag = await tx.tag.upsert({ where: { name }, create: { name }, update: {} })
            tagIds.push(tag.id)
          }
          // createMany ignora vínculos que já existem; não apaga as outras tags.
          for (const tagId of tagIds) {
            await tx.artTag.createMany({ data: ids.map((artId) => ({ artId, tagId })), skipDuplicates: true })
          }
        }
      }
      return matches.length
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000, maxWait: 10000 })
    return Response.json({ ok: true, updated: count })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg.startsWith('A seleção') || msg.startsWith('A seleção excede')) return jsonError(msg, 409)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      return jsonError('As artes foram modificadas simultaneamente. Atualize e tente outra vez.', 409)
    }
    console.error('Falha na edição em lote:', error)
    return jsonError('Não foi possível concluir a edição em lote. Nenhuma alteração parcial foi salva.', 500)
  }
}
