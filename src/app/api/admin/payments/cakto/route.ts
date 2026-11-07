import { isCaktoTestEmail } from '@/lib/payments/payment-classification'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { isSafeOrigin } from '@/lib/security-guards'
import { CAKTO_FINANCE_PREFIX, parseCaktoFinance, type CaktoFinance } from '@/lib/payments/cakto-finance'

const input = z.object({ purchaseId: z.string().min(1).max(100), amountCents: z.number().int().min(1).max(100_000_000), paidAt: z.iso.datetime({ offset: true }), evidence: z.string().trim().min(5).max(300), confirmedCakto: z.literal(true) }).strict()
class Conflict extends Error {}
export async function POST(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  if (!isSafeOrigin(req)) return jsonError('Solicitação inválida', 403)
  const raw = await req.text()
  if (Buffer.byteLength(raw) > 2048) return jsonError('Solicitação muito grande', 413)
  try {
    const parsed = input.safeParse(JSON.parse(raw))
    if (!parsed.success) return jsonError('Confira valor, data e referência do comprovante Cakto.', 400)
    const data = parsed.data
    const date = new Date(data.paidAt)
    if (date.getTime() > Date.now() + 300_000 || date.getUTCFullYear() < 2000) return jsonError('Informe a data real do pagamento.', 400)
    const result = await db.$transaction(async tx => {
      const purchase = await tx.pendingPurchase.findUnique({ where: { id: data.purchaseId } })
      if (!purchase || purchase.provider !== 'CAKTO') throw new Conflict('Compra Cakto não encontrada.')
      if (isCaktoTestEmail(purchase.email)) throw new Conflict('Este é um registro de teste da Cakto e não entra no faturamento.')
      await tx.$queryRaw`SELECT 1::integer FROM pg_advisory_xact_lock(hashtextextended(${'CAKTO:' + purchase.externalId}, 0))`
      const current = await tx.pendingPurchase.findUnique({ where: { id: purchase.id } })
      if (current?.status !== 'APPROVED') throw new Conflict('Esta compra foi revogada ou não está aprovada.')
      const key = CAKTO_FINANCE_PREFIX + purchase.id
      const prior = parseCaktoFinance((await tx.setting.findUnique({ where: { key } }))?.value)
      if (prior?.amountCents !== null && prior?.amountCents !== undefined) {
        if (prior.source === 'ADMIN_RECONCILIATION' && prior.amountCents === data.amountCents && prior.paidAt === date.toISOString() && prior.evidence === data.evidence) return { duplicate: true }
        throw new Conflict('Esta compra já tem valor registrado. Atualize a lista para evitar duplicação.')
      }
      if (prior?.currency && prior.currency !== 'BRL') throw new Conflict('Compra em outra moeda. Confira a moeda original antes de conciliar.')
      const legacy = await tx.payment.findFirst({ where: { provider: 'CAKTO', externalId: { in: [purchase.externalId, prior?.reference || purchase.externalId] } } })
      if (legacy) throw new Conflict('Esta compra já possui lançamento financeiro.')
      const metadata: CaktoFinance = { version: 1, externalId: purchase.externalId, reference: prior?.reference || purchase.externalId, amountCents: data.amountCents, currency: 'BRL', paidAt: date.toISOString(), method: prior?.method || 'CAKTO', source: 'ADMIN_RECONCILIATION', recordedAt: new Date().toISOString(), adminId: admin.id, evidence: data.evidence }
      await tx.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(metadata) }, update: { value: JSON.stringify(metadata) } })
      return { duplicate: false }
    })
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (e instanceof SyntaxError) return jsonError('Dados inválidos', 400)
    if (e instanceof Conflict) return jsonError(e.message, 409)
    return jsonError('Não foi possível confirmar. Tente novamente com os mesmos dados.', 503)
  }
}
