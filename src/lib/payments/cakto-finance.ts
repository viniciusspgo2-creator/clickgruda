import type { Prisma } from '@prisma/client'
import type { NormalizedPaymentEvent } from './provider'

export const CAKTO_FINANCE_PREFIX = 'cakto-finance:'
export type CaktoFinance = {
  version: 1
  externalId: string
  reference: string
  amountCents: number | null
  currency: string | null
  paidAt: string | null
  method: string
  source: 'WEBHOOK' | 'ADMIN_RECONCILIATION'
  recordedAt: string
  adminId?: string
  evidence?: string
}
export function parseCaktoFinance(value?: string | null): CaktoFinance | null {
  try {
    const data = JSON.parse(value || '')
    if (data.version !== 1 || typeof data.externalId !== 'string') return null
    if (data.amountCents !== null && (!Number.isSafeInteger(data.amountCents) || data.amountCents < 0 || data.amountCents > 2_147_483_647 || data.currency !== 'BRL')) return null
    return data
  } catch { return null }
}

/** Chamada sob a mesma trava da compra. Reenvio preenche apenas valores ausentes;
 * não reativa contas nem substitui valores comprovados ou conciliação do admin. */
export async function captureCaktoFinance(tx: Prisma.TransactionClient, purchaseId: string, evt: NormalizedPaymentEvent) {
  if (evt.kind !== 'PAGO' || !evt.finance) return
  const key = CAKTO_FINANCE_PREFIX + purchaseId
  const existing = await tx.setting.findUnique({ where: { key } })
  const prior = parseCaktoFinance(existing?.value)
  if (prior?.amountCents !== null && prior?.amountCents !== undefined) return
  const metadata: CaktoFinance = {
    version: 1, externalId: evt.externalId, reference: evt.reference,
    ...evt.finance, source: 'WEBHOOK', recordedAt: new Date().toISOString(),
  }
  await tx.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(metadata) }, update: { value: JSON.stringify(metadata) } })
}
