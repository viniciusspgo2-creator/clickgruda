import { createHash } from 'node:crypto'
import { z } from 'zod'
import {
  grantCompleteBenefits,
  queueStudioEntitlement,
} from '@/lib/studio-bonus'
import { db } from '@/lib/db'

export const MANUAL_PROVIDER = 'ADMIN_MANUAL'
export const RECEIPT_PREFIX = 'manual-receipt:'
export const receiptInput = z
  .object({
    requestId: z.uuid(),
    userId: z.string().min(1).max(100),
    amountCents: z.number().int().min(1).max(100_000_000),
    paidAt: z.iso.datetime({ offset: true }),
    method: z.enum(['PIX', 'BANK_TRANSFER', 'CASH', 'CARD', 'OTHER']),
    reference: z.string().trim().min(3).max(100),
    note: z.string().trim().max(500).default(''),
    activateAccess: z.boolean().default(false),
    confirmedOutsideGateway: z.literal(true),
  })
  .strict()
export type ReceiptInput = z.infer<typeof receiptInput>
export class ReceiptError extends Error {
  constructor(
    message: string,
    public status = 409,
  ) {
    super(message)
  }
}
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex')

/** Payment e Setting existentes; nenhum usuário, senha ou sessão é recriado. */
export async function registerManualReceipt(
  input: ReceiptInput,
  adminId: string,
) {
  const paidAt = new Date(input.paidAt)
  if (paidAt.getTime() > Date.now() + 300_000 || paidAt.getUTCFullYear() < 2000)
    throw new ReceiptError(
      'Informe a data real do recebimento, sem data futura.',
      400,
    )
  const canonical = {
    ...input,
    paidAt: paidAt.toISOString(),
    reference: input.reference.trim().toUpperCase(),
  }
  const hash = digest(JSON.stringify(canonical)),
    key = RECEIPT_PREFIX + input.requestId
  const referenceKey = 'manual-reference:' + digest(canonical.reference)
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT 1::integer FROM pg_advisory_xact_lock(hashtextextended(${referenceKey}, 0))`
      // Mesmo requestId também é serializado se duas requisições trouxerem referências diferentes.
      await tx.$queryRaw`SELECT 1::integer FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))`
      const prior = await tx.setting.findUnique({ where: { key } })
      if (prior) {
        const receipt = JSON.parse(prior.value)
        if (receipt.hash !== hash)
          throw new ReceiptError(
            'Esta solicitação já foi usada com outros dados.',
          )
        return { paymentId: receipt.paymentId, duplicate: true }
      }
      const referenceReceipt = await tx.setting.findUnique({
        where: { key: referenceKey },
      })
      if (referenceReceipt) {
        const priorPayment = await tx.payment.findUnique({
          where: { id: JSON.parse(referenceReceipt.value).paymentId },
        })
        if (priorPayment?.status !== 'VOIDED')
          throw new ReceiptError(
            'Este comprovante já foi registrado. Confira os pagamentos antes de lançar novamente.',
          )
      }
      await tx.$queryRaw`SELECT id FROM "User" WHERE id=${input.userId} FOR UPDATE`
      const user = await tx.user.findUnique({ where: { id: input.userId } })
      if (!user) throw new ReceiptError('Usuário não encontrado.', 404)
      if (user.role === 'ADMIN' || user.isDemo || user.isPreview)
        throw new ReceiptError('Selecione uma conta de cliente.', 400)
      if (input.activateAccess && user.status === 'BLOCKED')
        throw new ReceiptError(
          'Conta bloqueada. Analise o bloqueio antes de liberar acesso.',
        )
      const [approved, purchase, pending] = await Promise.all([
        tx.payment.findFirst({
          where: { userId: user.id, status: 'APPROVED' },
        }),
        tx.pendingPurchase.findFirst({
          where: {
            status: 'APPROVED',
            OR: [{ claimedUserId: user.id }, { email: user.email }],
          },
        }),
        tx.payment.findFirst({ where: { userId: user.id, status: 'PENDING' } }),
      ])
      if (approved || purchase)
        throw new ReceiptError(
          'Este cliente já possui um pagamento aprovado. Confira o histórico para evitar contagem duplicada, inclusive da Cakto.',
        )
      if (pending)
        throw new ReceiptError(
          'Este cliente tem um pedido pendente. Confira e aprove o pedido existente em Pagamentos, em vez de criar outro recebimento.',
        )
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          provider: MANUAL_PROVIDER,
          method: input.method,
          amountCents: input.amountCents,
          status: 'APPROVED',
          approvedAt: paidAt,
          externalId: input.requestId,
        },
      })
      const metadata = {
        ...canonical,
        hash,
        paymentId: payment.id,
        adminId,
        recordedAt: new Date().toISOString(),
      }
      await tx.setting.create({
        data: { key, value: JSON.stringify(metadata) },
      })
      const referenceValue = JSON.stringify({
        paymentId: payment.id,
        requestId: input.requestId,
      })
      await tx.setting.upsert({
        where: { key: referenceKey },
        create: { key: referenceKey, value: referenceValue },
        update: { value: referenceValue },
      })
      if (input.activateAccess) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            hasAccess: true,
            accessStatus: 'ATIVO',
            accessType: 'MANUAL',
            accessSource: 'ADMIN_GRANT',
            activatedAt: user.activatedAt ?? new Date(),
            status: 'ACTIVE',
          },
        })
        await grantCompleteBenefits(tx, user)
      } else if (
        user.hasAccess &&
        user.accessType !== 'TRIAL' &&
        user.status !== 'BLOCKED'
      ) {
        await queueStudioEntitlement(tx, user, 'MEMBER')
      }
      return { paymentId: payment.id, duplicate: false }
    },
    { maxWait: 10000, timeout: 15000 },
  )
}

/** Corrige o lançamento financeiro sem apagar seu histórico. */
export async function voidManualReceipt(
  paymentId: string,
  reason: string,
  adminId: string,
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE id=${paymentId} FOR UPDATE`
    const payment = await tx.payment.findUnique({ where: { id: paymentId } })
    if (!payment || payment.provider !== MANUAL_PROVIDER)
      throw new ReceiptError('Lançamento manual não encontrado.', 404)
    if (payment.status === 'VOIDED') return { ok: true, duplicate: true }
    if (payment.status !== 'APPROVED')
      throw new ReceiptError('Este lançamento não pode ser anulado.')
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: 'VOIDED' },
    })
    await tx.setting.create({
      data: {
        key: 'manual-void:' + paymentId,
        value: JSON.stringify({
          paymentId,
          reason,
          adminId,
          voidedAt: new Date().toISOString(),
        }),
      },
    })
    return { ok: true, duplicate: false }
  })
}
