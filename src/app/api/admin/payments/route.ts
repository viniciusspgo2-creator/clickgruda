import { financialLedger } from '@/lib/payments/financial-ledger'
import { getSessionUser, jsonError } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const ledger = await financialLedger()
  return Response.json({ payments: ledger.payments.filter(p => !p.isTest).slice(0, 300), testPayments: ledger.payments.filter(p => p.isTest).slice(0, 300), realPaymentsCount: ledger.payments.filter(p => !p.isTest).length, testPaymentsCount: ledger.stats.testPaymentsCount, revenueCents: ledger.stats.revenueCents, missingCaktoAmounts: ledger.stats.missingCaktoAmounts }, { headers: { 'Cache-Control': 'private, no-store' } })
}
