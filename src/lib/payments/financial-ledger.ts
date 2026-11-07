import { db } from '@/lib/db'
import { MANUAL_PROVIDER, RECEIPT_PREFIX } from '@/lib/manual-receipts'
import { isCaktoTestEmail } from './payment-classification'
import { CAKTO_FINANCE_PREFIX, parseCaktoFinance } from './cakto-finance'

export type FinancialPayment = {
  id: string; userName: string; userEmail: string; provider: string; method: string
  reference: string | null; externalId: string | null; amountCents: number | null
  status: string; createdAt: string; approvedAt: string | null
  isTest: boolean
  pendingPurchaseId?: string; currency?: string | null
}

/** Um único modelo financeiro para o resumo e a listagem. Seleciona apenas os
 * campos financeiros; contas liberadas por cortesia não originam lançamentos.
 * Não altera dados antigos, usuários ou comprovantes. */
export async function financialLedger() {
  const [payments, purchases, settings] = await db.$transaction(async tx => Promise.all([
    tx.payment.findMany({ where: { provider: { not: 'DEMO' } }, select: {
      id: true, provider: true, method: true, externalId: true, amountCents: true,
      status: true, createdAt: true, approvedAt: true,
      user: { select: { name: true, email: true, isDemo: true, isPreview: true } },
    } }),
    tx.pendingPurchase.findMany({ where: { provider: 'CAKTO' }, select: {
      id: true, externalId: true, email: true, status: true, createdAt: true, claimedUserId: true,
    } }),
    tx.setting.findMany({ where: { OR: [{ key: { startsWith: CAKTO_FINANCE_PREFIX } }, { key: { startsWith: RECEIPT_PREFIX } }] }, select: { key: true, value: true } }),
  ]), { isolationLevel: 'RepeatableRead' })
  const metadata = new Map(settings.map(s => [s.key, s.value]))
  const users = await db.user.findMany({ where: { id: { in: purchases.flatMap(p => p.claimedUserId ? [p.claimedUserId] : []) } }, select: { id: true, name: true, isDemo: true, isPreview: true } })
  const byUser = new Map(users.map(u => [u.id, u]))
  const aliases = new Map<string, typeof purchases[number]>()
  for (const purchase of purchases) {
    aliases.set(purchase.externalId, purchase)
    const info = parseCaktoFinance(metadata.get(CAKTO_FINANCE_PREFIX + purchase.id))
    if (info?.reference) aliases.set(info.reference, purchase)
  }
  const represented = new Set<string>()
  const rows: FinancialPayment[] = payments.filter(p => !p.user.isDemo && !p.user.isPreview).map(p => {
    const purchase = p.provider === 'CAKTO' && p.externalId ? aliases.get(p.externalId) : undefined
    if (purchase) represented.add(purchase.id)
    let reference: string | null = null
    if (p.provider === MANUAL_PROVIDER && p.externalId) {
      try { reference = JSON.parse(metadata.get(RECEIPT_PREFIX + p.externalId) || '').reference || null } catch {}
    }
    return { id: p.id, userName: p.user.name, userEmail: p.user.email,
      provider: p.provider, method: p.method, reference, externalId: p.externalId,
      isTest: p.provider === 'CAKTO' && isCaktoTestEmail(purchase?.email || p.user.email),
      amountCents: p.amountCents, status: purchase?.status === 'REVOKED' ? 'REVOKED' : p.status,
      createdAt: p.createdAt.toISOString(), approvedAt: p.approvedAt?.toISOString() || null,
    }
  })
  for (const p of purchases) {
    const user = p.claimedUserId ? byUser.get(p.claimedUserId) : undefined
    if (represented.has(p.id) || user?.isDemo || user?.isPreview) continue
    const info = parseCaktoFinance(metadata.get(CAKTO_FINANCE_PREFIX + p.id))
    rows.push({ id: 'cakto:' + p.id, pendingPurchaseId: p.id, userName: user?.name || 'Cliente Cakto', userEmail: p.email,
      provider: 'CAKTO', method: info?.method || 'CAKTO', reference: info?.reference || p.externalId,
      externalId: p.externalId, amountCents: info?.amountCents ?? null, currency: info?.currency,
      isTest: isCaktoTestEmail(p.email),
      status: p.status, createdAt: p.createdAt.toISOString(), approvedAt: info?.paidAt || null,
    })
  }
  rows.sort((a, b) => Date.parse(b.approvedAt || b.createdAt) - Date.parse(a.approvedAt || a.createdAt) || a.id.localeCompare(b.id))
  const approved = rows.filter(r => !r.isTest && r.status === 'APPROVED')
  return { payments: rows, stats: {
    pendingPayments: rows.filter(r => !r.isTest && r.status === 'PENDING').length,
    testPaymentsCount: rows.filter(r => r.isTest).length,
    revenueCents: approved.reduce((total, p) => total + (p.amountCents ?? 0), 0),
    approvedPayments: approved.filter(p => p.amountCents !== null).length,
    missingCaktoAmounts: approved.filter(p => p.provider === 'CAKTO' && p.amountCents === null).length,
  } }
}
