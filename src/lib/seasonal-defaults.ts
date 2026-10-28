import { db } from '@/lib/db'
import { DEFAULT_SEASONAL_EVENTS } from '@/lib/seasonal'

const FLAG = 'seasonal_defaults_v1'

function norm(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
}

/**
 * Garante as principais datas comemorativas no banco.
 * - Roda automaticamente UMA vez (flag em Setting) — depois disso, se o admin
 *   excluir uma data, ela não volta sozinha.
 * - Com force=true (botão no Admin) adiciona as que estiverem faltando.
 * - Não duplica: compara pelo nome (sem acento/maiúscula) e só completa a regra
 *   de data móvel das que já existem.
 */
export async function ensureDefaultSeasonalEvents(force = false): Promise<number> {
  try {
    if (!force) {
      const flag = await db.setting.findUnique({ where: { key: FLAG } })
      if (flag) return 0
    }
    const existing = await db.seasonalEvent.findMany()
    const byName = new Map(existing.map((e) => [norm(e.name), e]))
    let created = 0
    for (const d of DEFAULT_SEASONAL_EVENTS) {
      const found = byName.get(norm(d.name))
      if (found) {
        if (d.rule && !found.rule) {
          await db.seasonalEvent.update({ where: { id: found.id }, data: { rule: d.rule } })
        }
        continue
      }
      await db.seasonalEvent.create({
        data: { name: d.name, emoji: d.emoji, month: d.month, day: d.day, rule: d.rule ?? null },
      })
      created++
    }
    await db.setting.upsert({ where: { key: FLAG }, update: { value: 'done' }, create: { key: FLAG, value: 'done' } })
    return created
  } catch {
    // best-effort: nunca derruba a rota do catálogo
    return 0
  }
}
