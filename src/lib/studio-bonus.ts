import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getMemberProfile, saveMemberProfile } from '@/lib/member-profile'

export const STUDIO_PREFIX = 'studio-bonus:'
export const freeSignupEnabled = () =>
  process.env.LIBRARY_FREE_SIGNUP_ENABLED === '1'
export const studioBonusEnabled = () =>
  process.env.LIBRARY_STUDIO_INTEGRATION_ENABLED === '1'
type Entitlement = 'TRIAL' | 'MEMBER' | 'REVOKED'
type Reason = 'ADMIN_REVOKED' | 'ACCOUNT_BLOCKED' | 'REFUND' | 'CHARGEBACK'
type Customer = { id: string; name: string; createdAt: Date }
type Event = {
  eventId: string
  version: number
  libraryUserId: string
  name: string
  registeredAt: string
  trialEndsAt: string
  entitlement: Entitlement
  revocationReason?: Reason
}
type Delivery = {
  event: Event
  code: string | null
  deliveredVersion: number
  active: boolean
  adminBlocked: boolean
  attempts: number
  nextAttemptAt: string
  lastError: string | null
}
const endpointPath = '/api/integrations/library/entitlements'

/** Chamar com o lock de User. Cria/atualiza a fila na MESMA transação do cadastro ou concessão. */
export async function queueStudioEntitlement(
  tx: Prisma.TransactionClient,
  user: Customer,
  entitlement: Entitlement,
  reason?: Reason,
) {
  if (!studioBonusEnabled()) return
  const key = STUDIO_PREFIX + user.id,
    prior = await tx.setting.findUnique({ where: { key } })
  const old: Delivery | null = prior ? JSON.parse(prior.value) : null
  // Atualização acessória não reabre teste nem cria novas versões sem mudança de estado.
  if (
    old?.event.entitlement === entitlement &&
    old.event.revocationReason === reason
  )
    return
  const registeredAt = old?.event.registeredAt ?? user.createdAt.toISOString()
  const event: Event = {
    eventId: randomUUID(),
    version: (old?.event.version ?? 0) + 1,
    libraryUserId: user.id,
    name: user.name.slice(0, 120),
    registeredAt,
    trialEndsAt: new Date(
      Date.parse(registeredAt) + 7 * 86400000,
    ).toISOString(),
    entitlement,
    ...(reason ? { revocationReason: reason } : {}),
  }
  const delivery: Delivery = {
    event,
    code: old?.code ?? null,
    deliveredVersion: old?.deliveredVersion ?? 0,
    active: old?.active ?? false,
    adminBlocked: old?.adminBlocked ?? false,
    attempts: 0,
    nextAttemptAt: new Date().toISOString(),
    lastError: null,
  }
  const value = JSON.stringify(delivery)
  await tx.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export async function grantCompleteBenefits(
  tx: Prisma.TransactionClient,
  user: Customer,
) {
  const profile = await getMemberProfile(user.id, tx)
  if (profile.downloadLimit != null || profile.downloadExpiresAt)
    await saveMemberProfile(
      user.id,
      { ...profile, downloadLimit: null, downloadExpiresAt: null },
      tx,
    )
  await queueStudioEntitlement(tx, user, 'MEMBER')
}

/** Um erro do Studio nunca desfaz um cadastro/pagamento já confirmado na Biblioteca. */
export async function deliverStudioBonus(userId: string) {
  if (!studioBonusEnabled()) return
  const key = STUDIO_PREFIX + userId,
    row = await db.setting.findUnique({ where: { key } })
  if (!row) return
  const delivery: Delivery = JSON.parse(row.value)
  if (
    delivery.deliveredVersion >= delivery.event.version ||
    Date.parse(delivery.nextAttemptAt) > Date.now()
  )
    return
  const secret = process.env.STUDIO_LIBRARY_WEBHOOK_SECRET,
    base = process.env.STUDIO_API_ORIGIN
  let success = false,
    error = 'CONFIGURATION'
  try {
    if (
      !secret ||
      secret.length < 32 ||
      secret === process.env.AUTH_SECRET ||
      !base
    )
      throw Error('configuration')
    const origin = new URL(base)
    if (
      origin.protocol !== 'https:' ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash
    )
      throw Error('configuration')
    const body = JSON.stringify(delivery.event),
      stamp = String(Math.floor(Date.now() / 1000))
    const signature =
      'v1=' +
      createHmac('sha256', secret)
        .update(`POST\n${endpointPath}\n${stamp}\n${body}`)
        .digest('hex')
    const response = await fetch(origin.origin + endpointPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Library-Timestamp': stamp,
        'X-Library-Signature': signature,
      },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    })
    error = 'HTTP_' + response.status
    if (response.ok) {
      const data = await response.json()
      if (
        data.ok !== true ||
        data.libraryUserId !== userId ||
        data.version !== delivery.event.version ||
        data.entitlement !== delivery.event.entitlement ||
        typeof data.code !== 'string' ||
        !/^CG-[A-F0-9]{24}$/i.test(data.code) ||
        typeof data.active !== 'boolean' ||
        typeof data.adminBlocked !== 'boolean'
      )
        throw Error('response')
      if (delivery.code && delivery.code !== data.code)
        throw Error('code_changed')
      delivery.code = data.code
      delivery.active = data.active
      delivery.adminBlocked = data.adminBlocked
      delivery.deliveredVersion = data.version
      success = true
    }
  } catch {
    if (error === 'HTTP_200') error = 'INVALID_RESPONSE'
  }
  delivery.attempts++
  delivery.lastError = success ? null : error
  delivery.nextAttemptAt = new Date(
    Date.now() + Math.min(3600000, 15000 * 2 ** Math.min(delivery.attempts, 8)),
  ).toISOString()
  // Se um evento mais novo venceu durante o HTTP, não sobrescrever sua fila/código/versão.
  await db.setting.updateMany({
    where: { key, value: row.value },
    data: { value: JSON.stringify(delivery) },
  })
}

export async function studioBonusForUser(userId: string) {
  if (!studioBonusEnabled()) return null
  const row = await db.setting.findUnique({
    where: { key: STUDIO_PREFIX + userId },
  })
  if (!row) return { state: 'unlinked', code: null }
  const d: Delivery = JSON.parse(row.value)
  return {
    state:
      d.deliveredVersion < d.event.version
        ? 'pending'
        : d.adminBlocked
          ? 'blocked'
          : 'ready',
    code: d.code,
    entitlement: d.event.entitlement,
    trialEndsAt: d.event.trialEndsAt,
    active: d.active,
    adminBlocked: d.adminBlocked,
  }
}
export function validBonusCron(req: Request) {
  const secret = process.env.STUDIO_BONUS_CRON_SECRET,
    value = req.headers.get('authorization') ?? ''
  if (!secret || secret.length < 32) return false
  const expected = Buffer.from('Bearer ' + secret),
    given = Buffer.from(value)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
