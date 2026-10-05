import { db } from '@/lib/db'
import { jsonError } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import { parseArtCode } from '@/lib/art-code'

/**
 * GET /api/public/catalog/[token] — catálogo compartilhado (público).
 *
 * O cliente do assinante abre o link temporário (?catalogo=TOKEN) e navega
 * somente pelas artes: sem preços, sem download, sem favoritos. Se o link
 * tiver WhatsApp cadastrado, cada arte tem o botão "Quero esta arte" que
 * abre o WhatsApp DO ASSINANTE com a escolha já escrita.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const url = new URL(req.url)
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1)
  const q = (url.searchParams.get('q') || '').trim()
  const category = (url.searchParams.get('category') || '').trim()
  const pageSize = 36

  const link = await db.shareLink.findUnique({
    where: { token },
    include: { user: { select: { name: true } } },
  })

  if (!link || !link.active) return jsonError('Este catálogo não está mais disponível.', 404)
  if (link.expiresAt.getTime() < Date.now()) {
    return jsonError('Este catálogo expirou. Peça um novo link.', 410)
  }

  // Contador de visitas: só na abertura (1ª página, sem busca) — best-effort
  if (page === 1 && !q && !category) {
    db.shareLink.update({ where: { id: link.id }, data: { views: { increment: 1 } } }).catch(() => {})
  }

  // Filtro no banco (o acervo pode ter milhares de artes)
  const where: Prisma.ArtWhereInput = {
    AND: [
      ...(category ? [{ category: { is: { name: category } } }] : []),
      ...(q
        ? [
            {
              OR: [
                { title: { contains: q, mode: 'insensitive' as const } },
                { category: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
                { tags: { some: { tag: { name: { contains: q, mode: 'insensitive' as const } } } } },
                ...(parseArtCode(q) !== null ? [{ code: parseArtCode(q) as number }] : []),
              ],
            },
          ]
        : []),
    ],
  }

  const [arts, total] = await Promise.all([
    db.art.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true, emoji: true, icon: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    }),
    db.art.count({ where }),
  ])

  let categories: { name: string; emoji: string; icon: string; count: number }[] = []
  if (page === 1) {
    const [cats, catGroups] = await Promise.all([
      db.category.findMany({ select: { id: true, name: true, emoji: true, icon: true } }),
      db.art.groupBy({ by: ['categoryId'], _count: true }),
    ])
    const counts = new Map(catGroups.map((g) => [g.categoryId, g._count]))
    categories = cats
      .map((c) => ({ name: c.name, emoji: c.emoji, icon: c.icon, count: counts.get(c.id) || 0 }))
      .filter((c) => c.count > 0)
      .sort((x, y) => y.count - x.count)
  }

  return Response.json({
    catalog: {
      ownerName: link.user.name,
      ownerWhatsapp: link.whatsapp,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt.toISOString(),
    },
    categories,
    total,
    page,
    hasMore: (page - 1) * pageSize + arts.length < total,
    arts: arts.map((a) => ({
      id: a.id,
      code: a.code,
      title: a.title,
      imageUrl: a.imageUrl,
      isLaunch: a.isLaunch,
      category: a.category,
      tags: a.tags.map((t) => ({ name: t.tag.name })),
    })),
  })
}
