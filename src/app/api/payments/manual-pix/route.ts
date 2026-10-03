import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings } from '@/lib/settings'

/**
 * POST /api/payments/manual-pix
 *
 * Fluxo do PIX manual: o cliente se cadastra, escolhe "PIX direto (manual)"
 * no checkout e declara que vai pagar a chave PIX exibida. O cadastro fica
 * PRÉ-APROVADO (status PENDING_MANUAL) e um pagamento PENDING do provider
 * MANUAL_PIX é registrado — o Admin Master vê na lista de pagamentos e faz
 * a liberação da conta após conferir o comprovante recebido no WhatsApp.
 */
export async function POST() {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para continuar', 401)

  const settings = await getSettings()
  const manualEnabled = settings.pix_manual_enabled === 'true' && Boolean((settings.pix_key || '').trim())
  if (!manualEnabled) return jsonError('O pagamento por PIX manual não está disponível agora.', 400)

  if (session.hasAccess) return jsonError('Você já tem acesso ativo.', 400)

  const amountCents = parseInt(settings.price_cents || '4790', 10)

  const payment = await db.payment.create({
    data: {
      userId: session.id,
      provider: 'MANUAL_PIX',
      method: 'PIX',
      amountCents,
      status: 'PENDING',
    },
  })

  // Cadastro pré-aprovado: aguardando apenas a conferência do comprovante.
  await db.user.update({
    where: { id: session.id },
    data: { status: 'PENDING_MANUAL' },
  })

  return Response.json({ ok: true, paymentId: payment.id, amountCents }, { status: 201 })
}
