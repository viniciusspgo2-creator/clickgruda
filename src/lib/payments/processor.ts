import { Prisma } from '@prisma/client'
import {grantCompleteBenefits,queueStudioEntitlement} from '@/lib/studio-bonus'
import { db } from '@/lib/db'
import type { NormalizedPaymentEvent } from './provider'
import { captureCaktoFinance } from './cakto-finance'

/**
 * A Cakto pode entregar eventos de uma mesma compra em paralelo.
 * Uma trava transacional PostgreSQL serializa somente essa referência,
 * sem bloquear compras diferentes. É compatível com pool de conexões,
 * pois a trava é liberada ao final da transação.
 */
const MAX_ATTEMPTS = 3
function prismaCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = (error as { code?: unknown }).code
  return typeof value === 'string' ? value : undefined
}

export async function processPaymentEvent(provider: string, evt: NormalizedPaymentEvent): Promise<'duplicate' | 'processed'> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const duplicate = await db.$transaction(async (tx) => {
        // hashtextextended recebe uma chave textual parametrizada.
        // O lock protege as atualizações de PendingPurchase e da conta
        // contra eventos simultâneos da MESMA compra.
        const key = `${provider}:${evt.externalId}`
        await tx.$queryRaw<{ acquired: number }[]>`
          SELECT 1::integer AS acquired
          FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))
        `

        const priorEvent = await tx.paymentWebhookEvent.findUnique({
          where: { provider_externalId_eventType: { provider, externalId: evt.externalId, eventType: evt.type } },
          select: { id: true },
        })
        if (priorEvent) {
          // Um reenvio autenticado pode recuperar o valor perdido pelo código
          // antigo. Mantém os efeitos de acesso originais e a precedência de estorno.
          if (provider === 'CAKTO' && evt.finance && evt.kind === 'PAGO') {
            const purchase = await tx.pendingPurchase.findUnique({ where: { provider_externalId: { provider, externalId: evt.externalId } } })
            if (purchase) await captureCaktoFinance(tx, purchase.id, evt)
          }
          return true
        }

        let existingUser = evt.email
          ? await tx.user.findUnique({ where: { email: evt.email } })
          : null
        if(existingUser){await tx.$queryRaw`SELECT id FROM "User" WHERE id=${existingUser.id} FOR UPDATE`;existingUser=await tx.user.findUnique({where:{id:existingUser.id}})}
        await tx.paymentWebhookEvent.create({ data: {
          provider,
          externalId: evt.externalId,
          eventType: evt.type,
          customerEmail: evt.email,
          userId: existingUser?.id ?? null,
          outcome: evt.kind === 'IGNORADO' ? 'IGNORED' : existingUser ? 'PROCESSED' : 'UNMATCHED',
        } })
        if (evt.kind === 'IGNORADO') return

        const revoked = evt.kind !== 'PAGO'
        const previous = await tx.pendingPurchase.findUnique({
          where: { provider_externalId: { provider, externalId: evt.externalId } },
        })
        // Reembolso/chargeback têm precedência sobre uma aprovação atrasada.
        const newStatus = revoked || previous?.status === 'REVOKED' ? 'REVOKED' : 'APPROVED'
        const purchase = await tx.pendingPurchase.upsert({
          where: { provider_externalId: { provider, externalId: evt.externalId } },
          create: { provider, externalId: evt.externalId, email: evt.email, status: newStatus, claimedUserId: existingUser?.id },
          update: { status: newStatus, claimedUserId: existingUser?.id ?? previous?.claimedUserId },
        })
        if (provider === 'CAKTO') await captureCaktoFinance(tx, purchase.id, evt)
        if (!existingUser || existingUser.isDemo || existingUser.isPreview) return

        if (newStatus === 'APPROVED') {
          // Não substitui concessões manuais nem desbloqueia conta bloqueada.
          if (existingUser.status === 'BLOCKED' || (existingUser.hasAccess && existingUser.accessSource === 'ADMIN_GRANT')) return
          await tx.user.update({ where: { id: existingUser.id }, data: {
            hasAccess: true,
            accessStatus: 'ATIVO',
            accessType: 'VITALICIO',
            activatedAt: existingUser.activatedAt ?? new Date(),
            accessProvider: provider,
            accessReference: evt.externalId,
            accessSource: 'PURCHASE',
            status: 'ACTIVE',
          } })
          await grantCompleteBenefits(tx,existingUser)
        } else if (
          existingUser.accessProvider === provider &&
          existingUser.accessReference === evt.externalId &&
          existingUser.accessSource !== 'ADMIN_GRANT'
        ) {
          await tx.user.update({ where: { id: existingUser.id }, data: {
            hasAccess: false,
            accessStatus: 'REVOGADO',
            accessType: null,
            accessProvider: provider,
            accessReference: evt.externalId,
            accessSource: null,
          } })
          await queueStudioEntitlement(tx,existingUser,'REVOKED',evt.kind==='CHARGEBACK'?'CHARGEBACK':'REFUND')
          await tx.userSession.updateMany({
            where: { userId: existingUser.id, revokedAt: null },
            data: { revokedAt: new Date(), revokedReason: 'PAYMENT_REVOKED' },
          })
        }
      }, {
        // Serializable sem retry causava conflitos P2034 com os três testes
        // disparados simultaneamente. A trava por referência é suficiente.
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 2000,
        timeout: 5000,
      })
      return duplicate ? 'duplicate' : 'processed'
    } catch (error) {
      const code = prismaCode(error)
      if (code === 'P2002') {
        // Somente tratar como duplicado se ESTE evento estiver no histórico.
        // P2002 de outra tabela não pode esconder um erro real de produção.
        const prior = await db.paymentWebhookEvent.findUnique({
          where: { provider_externalId_eventType: {
            provider, externalId: evt.externalId, eventType: evt.type,
          } },
          select: { id: true },
        })
        if (prior) return 'duplicate'
      }
      // P2034 indica conflito/deadlock; P2028 pode ocorrer ao aguardar lock.
      // Evita falhas intermitentes sem aceitar um evento não persistido.
      if ((code === 'P2034' || code === 'P2028') && attempt + 1 < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)))
        continue
      }
      throw error
    }
  }
  // Não deveria alcançar este ponto; nunca confirma evento sem persistir.
  throw new Error('Tentativas de processamento esgotadas')
}
