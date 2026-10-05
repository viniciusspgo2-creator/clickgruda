import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { formatArtCode } from '@/lib/art-code'
import { downloadQuota } from '@/lib/download-quota'

/**
 * GET /api/arts/ids?scope=category|event|launch|selected|all&id=...&skip=1
 * Lista (id, código, título) das artes de um recorte do acervo — usada pelo "Baixar em ZIP".
 * skip=1 → pula as artes que a pessoa já baixou (assim, com o limite diário, dá para continuar de onde parou).
 * Só para membros com acesso ativo (conta demo não baixa).
 */
export async function GET(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para baixar as artes', 401)
  if (!session.hasAccess || session.isDemo) return jsonError('Download liberado apenas para membros com acesso ativo.', 403)

  const url = new URL(req.url)
  const scope = url.searchParams.get('scope') || 'all'
  const id = url.searchParams.get('id') || ''
  const skip = url.searchParams.get('skip') === '1'

  if ((scope === 'category' || scope === 'event') && !id) return jsonError('Escolha uma categoria ou data.', 400)

  const base =
    scope === 'category'
      ? { categoryId: id }
      : scope === 'event'
        ? { seasonalEventId: id }
        : scope === 'launch'
          ? { isLaunch: true }
          : scope === 'selected'
            ? { isSelected: true }
            : {}

  const [arts, alreadyHad, quota] = await Promise.all([
    db.art.findMany({
      where: skip ? { ...base, downloads: { none: { userId: session.id } } } : base,
      orderBy: [{ code: 'asc' }],
      take: 6000,
      select: { id: true, code: true, title: true },
    }),
    skip ? db.art.count({ where: { ...base, downloads: { some: { userId: session.id } } } }) : Promise.resolve(0),
    session.role === 'ADMIN' ? Promise.resolve(null) : downloadQuota(session.id),
  ])

  return Response.json({
    arts: arts.map((a: { id: string; code: number; title: string }) => ({ id: a.id, code: formatArtCode(a.code), title: a.title })),
    total: arts.length,
    alreadyHad,
    limit: quota?.limit ?? 0,
    used: quota?.used ?? 0,
    remaining: quota ? quota.remaining : null,
  })
}
