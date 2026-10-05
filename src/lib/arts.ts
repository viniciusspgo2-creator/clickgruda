import { db } from '@/lib/db'

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

/** Loads all arts with relations mapped as DTOs (dataset is small; in-memory filtering is used). */
export async function listArtsForUser(userId: string | null): Promise<ArtDTO[]> {
  const arts = await db.art.findMany({
    include: {
      category: true,
      seasonalEvent: true,
      tags: { include: { tag: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  let favSet = new Set<string>()
  if (userId) {
    const favs = await db.favorite.findMany({ where: { userId }, select: { artId: true } })
    favSet = new Set(favs.map((f) => f.artId))
  }

  return arts.map((a) => ({
    id: a.id,
    code: a.code,
    title: a.title,
    imageUrl: a.imageUrl,
    isLaunch: a.isLaunch,
    isSelected: a.isSelected,
    downloadsCount: a.downloadsCount,
    createdAt: a.createdAt.toISOString(),
    category: a.category ? { id: a.category.id, name: a.category.name, emoji: a.category.emoji } : null,
    seasonalEvent: a.seasonalEvent
      ? { id: a.seasonalEvent.id, name: a.seasonalEvent.name, emoji: a.seasonalEvent.emoji }
      : null,
    tags: a.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
    favorited: favSet.has(a.id),
  }))
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
