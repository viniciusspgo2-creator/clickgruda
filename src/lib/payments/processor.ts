import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import type { NormalizedPaymentEvent } from './provider'

/** Transação atômica: registra evento e altera permissão no mesmo commit. */
export async function processPaymentEvent(provider: string, evt: NormalizedPaymentEvent): Promise<'duplicate' | 'processed'> {
  try {
    await db.$transaction(async (tx) => {
      const existingUser = evt.email ? await tx.user.findUnique({ where: { email: evt.email } }) : null
      await tx.paymentWebhookEvent.create({ data: {
        provider, externalId: evt.externalId, eventType: evt.type,
        customerEmail: evt.email, userId: existingUser?.id ?? null,
        outcome: evt.kind === 'IGNORADO' ? 'IGNORED' : existingUser ? 'PROCESSED' : 'UNMATCHED',
      } })
      if (evt.kind === 'IGNORADO') return
      const revoked = evt.kind !== 'PAGO'
      const previous = await tx.pendingPurchase.findUnique({ where: { provider_externalId: { provider, externalId: evt.externalId } } })
      // Revogações são irreversíveis para esta referência; uma aprovação atrasada não deve reativar.
      const newStatus = revoked || previous?.status === 'REVOKED' ? 'REVOKED' : 'APPROVED'
      await tx.pendingPurchase.upsert({
        where: { provider_externalId: { provider, externalId: evt.externalId } },
        create: { provider, externalId: evt.externalId, email: evt.email, status: newStatus, claimedUserId: existingUser?.id },
        update: { status: newStatus, claimedUserId: existingUser?.id ?? previous?.claimedUserId },
      })
      if (!existingUser || existingUser.isDemo || existingUser.isPreview) return
      if (newStatus === 'APPROVED') {
        // Respeita concessão administrativa independente desta compra.
        if (existingUser.status === 'BLOCKED' || (existingUser.hasAccess && existingUser.accessSource === 'ADMIN_GRANT')) return
        await tx.user.update({ where: { id: existingUser.id }, data: {
          hasAccess: true, accessStatus: 'ATIVO', accessType: 'VITALICIO',
          activatedAt: existingUser.activatedAt ?? new Date(), accessProvider: provider,
          accessReference: evt.externalId, accessSource: 'PURCHASE', status: 'ACTIVE',
        } })
      } else if (existingUser.accessProvider === provider && existingUser.accessReference === evt.externalId && existingUser.accessSource !== 'ADMIN_GRANT') {
        await tx.user.update({ where: { id: existingUser.id }, data: {
          hasAccess: false, accessStatus: 'REVOGADO', accessType: null,
          accessProvider: provider, accessReference: evt.externalId, accessSource: null,
        } })
        await tx.userSession.updateMany({ where: { userId: existingUser.id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: 'PAYMENT_REVOKED' } })
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 6000 })
    return 'processed'
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return 'duplicate'
    throw error
  }
}
