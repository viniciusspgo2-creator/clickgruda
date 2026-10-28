import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { approvePayment } from '@/lib/payments'

/** Admin manual approval (useful for bank-transfer proof or gateway sync issues). */
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params

  const payment = await db.payment.findUnique({ where: { id } })
  if (!payment) return jsonError('Pagamento não encontrado', 404)

  await approvePayment(id)
  return Response.json({ ok: true })
}

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}
