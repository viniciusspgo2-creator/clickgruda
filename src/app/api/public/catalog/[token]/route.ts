import { db } from '@/lib/db'
import { jsonError } from '@/lib/auth'

/**
 * GET /api/public/catalog/[token] — catálogo compartilhado (público).
 *
 * O cliente do assinante abre o link temporário (?catalogo=TOKEN) e navega
 * somente pelas artes: sem preços, sem download, sem favoritos. Se o link
 * tiver WhatsApp cadastrado, cada arte tem o botão "Quero esta arte" que
 * abre o WhatsApp DO ASSINANTE com a escolha já escrita.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const link = await db.shareLink.findUnique({
    where: { token },
    include: { user: { select: { name: true } } },
  })

  if (!link || !link.active) return jsonError('Este catálogo não está mais disponível.', 404)
  if (link.expiresAt.getTime() < Date.now()) {
    return jsonError('Este catálogo expirou. Peça um novo link.', 410)
  }

  // Contador de visitas (best-effort — não bloqueia a resposta)
  db.shareLink.update({ where: { id: link.id }, data: { views: { increment: 1 } } }).catch(() => {})

  const arts = await db.art.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: {
      category: { select: { name: true, emoji: true, icon: true } },
      tags: { include: { tag: { select: { name: true } } } },
    },
  })

  return Response.json({
    catalog: {
      ownerName: link.user.name,
      ownerWhatsapp: link.whatsapp,
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt.toISOString(),
    },
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
