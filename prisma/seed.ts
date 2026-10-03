/**
 * Seed do Click & Gruda — idempotente (pode rodar quantas vezes quiser).
 *
 * Popula: Settings (pagamento/PIX/R2), Categorias (+ícones), Tags,
 * Eventos sazonais, Artes (com vínculos de categoria/tags) e as contas
 * de sistema (Admin Master + Cliente Demo).
 *
 * Uso local:   bun run db:seed
 * Uso produção (uma vez após o primeiro deploy, apontando p/ o Neon):
 *   DATABASE_URL="postgresql://usuario:senha@ep-xxx.neon.tech/clickgruda?sslmode=require" bun run db:seed
 */
import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

type AnyRecord = Record<string, unknown>

const db = new PrismaClient()

function loadSeedData() {
  const here = dirname(fileURLToPath(import.meta.url))
  return JSON.parse(readFileSync(join(here, 'seed-data.json'), 'utf-8')) as {
    settings: AnyRecord[]
    categories: AnyRecord[]
    tags: AnyRecord[]
    events: AnyRecord[]
    arts: AnyRecord[]
    artTags: AnyRecord[]
    users: AnyRecord[]
  }
}

/** Converte strings ISO em Date (Prisma exige Date em runtime). */
function dates<T extends AnyRecord>(row: T, keys: string[]): T {
  const out: AnyRecord = { ...row }
  for (const k of keys) {
    if (out[k] != null) out[k] = new Date(out[k] as string)
  }
  return out as T
}

async function main() {
  const data = loadSeedData()
  const counts: Record<string, number> = {}

  /* ---------- Settings ---------- */
  for (const s of data.settings) {
    await db.setting.upsert({
      where: { key: s.key as string },
      update: {}, // NUNCA sobrescreve: re-rodar o seed apagaria tokens/chaves já salvos no Admin
      create: { key: s.key as string, value: s.value as string },
    })
  }
  counts.settings = data.settings.length

  /* ---------- Categorias ---------- */
  for (const c of data.categories) {
    await db.category.upsert({
      where: { id: c.id as string },
      update: { name: c.name as string, emoji: c.emoji as string, icon: (c.icon as string) ?? '' },
      create: {
        id: c.id as string,
        name: c.name as string,
        emoji: c.emoji as string,
        icon: (c.icon as string) ?? '',
        createdAt: c.createdAt as string,
      },
    })
  }
  counts.categories = data.categories.length

  /* ---------- Tags ---------- */
  for (const t of data.tags) {
    await db.tag.upsert({
      where: { id: t.id as string },
      update: { name: t.name as string },
      create: { id: t.id as string, name: t.name as string, createdAt: t.createdAt as string },
    })
  }
  counts.tags = data.tags.length

  /* ---------- Eventos sazonais ---------- */
  for (const e of data.events) {
    await db.seasonalEvent.upsert({
      where: { id: e.id as string },
      update: { name: e.name as string, emoji: e.emoji as string, month: e.month as number, day: e.day as number },
      create: {
        id: e.id as string,
        name: e.name as string,
        emoji: e.emoji as string,
        month: e.month as number,
        day: e.day as number,
        createdAt: e.createdAt as string,
      },
    })
  }
  counts.events = data.events.length

  /* ---------- Artes ---------- */
  for (const a of data.arts) {
    const payload = {
      title: a.title as string,
      imageUrl: a.imageUrl as string,
      isLaunch: a.isLaunch as boolean,
      downloadsCount: (a.downloadsCount as number) ?? 0,
      categoryId: (a.categoryId as string) ?? null,
      seasonalEventId: (a.seasonalEventId as string) ?? null,
      createdAt: a.createdAt as string,
    }
    await db.art.upsert({
      where: { id: a.id as string },
      update: payload,
      create: { id: a.id as string, ...payload },
    })
  }
  counts.arts = data.arts.length

  /* ---------- Vínculos arte ↔ tag ---------- */
  for (const at of data.artTags) {
    await db.artTag.upsert({
      where: { artId_tagId: { artId: at.artId as string, tagId: at.tagId as string } },
      update: {},
      create: { artId: at.artId as string, tagId: at.tagId as string },
    })
  }
  counts.artTags = data.artTags.length

  /* ---------- Contas de sistema ---------- */
  // Sem senhas padrão: o Admin Master vem de ADMIN_EMAIL / ADMIN_PASSWORD (variáveis de ambiente).
  const bcrypt = (await import('bcryptjs')).default
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD || ''
  if (!adminEmail || adminPassword.length < 10) {
    throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (mín. 10 caracteres) antes de rodar o seed.')
  }
  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', hasAccess: true },
    create: {
      name: 'Admin Master',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      role: 'ADMIN',
      hasAccess: true,
      accessSource: 'ADMIN_GRANT',
    },
  })
  counts.users = 1

  console.log('✅ Seed concluído:', JSON.stringify(counts))
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
