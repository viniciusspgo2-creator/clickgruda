import { db } from '@/lib/db'

/** minúsculas, sem acento, espaços colapsados — "Café  Flork" e "cafe flork" viram a mesma busca. */
export function normalizeQuery(q: string) {
  return q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Registra uma busca sem resultado (best-effort: nunca derruba a rota). */
export async function recordSearchMiss(raw: string, userId: string) {
  try {
    const display = raw.trim().replace(/\s+/g, ' ').slice(0, 80)
    const query = normalizeQuery(display)
    if (query.length < 3) return
    if (/^(cg[\s-]?)?\d+$/.test(query)) return // busca por código de arte, não é tema
    const miss = await db.searchMiss.upsert({
      where: { query },
      create: { query, display, count: 1, users: 0 },
      update: { count: { increment: 1 }, display, lastAt: new Date() },
    })
    try {
      await db.searchMissUser.create({ data: { missId: miss.id, userId } })
      await db.searchMiss.update({ where: { id: miss.id }, data: { users: { increment: 1 } } })
    } catch {
      /* esta pessoa já tinha buscado esse termo */
    }
  } catch {
    /* best-effort */
  }
}
