import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getMemberProfile, saveMemberProfile } from '@/lib/member-profile'

/** Conciliação excepcional: admin verifica a titularidade por fora antes de confirmar. */
export async function POST(req: Request) {
  const admin = await getSessionUser()
  if (admin?.role !== 'ADMIN') return jsonError('Não autorizado', 403)
  const body = await req.json().catch(() => ({}))
  const id = typeof body.pendingId === 'string' ? body.pendingId : ''
  const userId = typeof body.userId === 'string' ? body.userId : ''
  if (!id || !userId || body.confirmOwnership !== true) return jsonError('É necessário confirmar a titularidade do pagamento.', 400)
  try {
    await db.$transaction(async tx => {
      const [purchase, user] = await Promise.all([
        tx.pendingPurchase.findUnique({ where: { id } }),
        tx.user.findUnique({ where: { id: userId } }),
      ])
      if (!purchase || purchase.status !== 'APPROVED' || purchase.claimedUserId) throw new Error('Pagamento indisponível')
      if (!user || user.email.toLowerCase() !== purchase.email || user.isDemo || user.isPreview || user.status === 'BLOCKED') throw new Error('Conta ou e-mail inválido')
      await tx.pendingPurchase.update({ where: { id }, data: { claimedUserId: user.id } })
      await tx.user.update({ where: { id: user.id }, data: { hasAccess: true, accessStatus: 'ATIVO', accessType: 'VITALICIO', activatedAt: new Date(), accessProvider: purchase.provider, accessReference: purchase.externalId, accessSource: 'PURCHASE' } })
      const profile = await getMemberProfile(user.id, tx)
      if (profile.downloadLimit != null) await saveMemberProfile(user.id, { ...profile, downloadLimit: null }, tx)
      await tx.paymentWebhookEvent.create({ data: { provider: 'ADMIN', externalId: randomUUID(), eventType: 'MANUAL_CLAIM', customerEmail: user.email, userId: user.id, outcome: 'PROCESSED' } })
    })
    return Response.json({ ok: true })
  } catch { return jsonError('Não foi possível associar a compra. Verifique os dados.', 400) }
}
