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
  return Response.json({ payments: ledger.payments.slice(0, 300), missingCaktoAmounts: ledger.stats.missingCaktoAmounts }, { headers: { 'Cache-Control': 'private, no-store' } })
}
