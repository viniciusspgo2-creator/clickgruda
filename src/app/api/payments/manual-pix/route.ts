import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { createCheckoutOrder, getCheckoutContext, quoteCheckout } from '@/lib/coupons'

/** Solicitação de atendimento com valor e cupom conferidos no servidor.
 * Não declara pagamento e nunca libera o acesso sem a confirmação da equipe. */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para continuar', 401)
  if (session.isDemo) return jsonError('Conta Preview: operação indisponível.', 403)

  const settings = await getSettings()
  // Solicitação de atendimento e ativação; não exige PIX cadastrado nem declara pagamento.

  if (session.hasAccess) return jsonError('Você já tem acesso ativo.', 400)

  const body = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados inválidos.', 400)
  let order: Awaited<ReturnType<typeof createCheckoutOrder>>
  try {
    const quote = await quoteCheckout(Number(settings.price_cents || 4790), body.couponCode)
    const pending = await db.payment.findFirst({ where: { userId: session.id, provider: 'MANUAL_PIX', status: 'PENDING' }, orderBy: { createdAt: 'desc' } })
    const context = pending ? await getCheckoutContext(pending.id) : null
    if (pending && context && pending.amountCents === quote.amountCents && context.subtotalCents === quote.subtotalCents && context.coupon?.code === quote.coupon?.code) order = { payment: pending, quote }
    else order = await createCheckoutOrder(session.id, 'MANUAL_PIX', Number(settings.price_cents || 4790), body.couponCode)
  }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Cupom inválido.', 400) }
  const { payment, quote } = order

  // Solicitação pendente de atendimento e confirmação do pagamento.
  await db.user.update({
    where: { id: session.id },
    data: { status: 'PENDING_MANUAL' },
  })

  return Response.json({ ok: true, paymentId: payment.id, ...quote }, { status: 201 })
}

export async function GET() {
  const session = await getSessionUser()
  if (!session || session.isDemo) return jsonError('Entre na sua conta.', 401)
  const payment = await db.payment.findFirst({ where: { userId: session.id, provider: 'MANUAL_PIX', status: 'PENDING' }, orderBy: { createdAt: 'desc' } })
  if (!payment) return Response.json({ paymentId: null })
  const quote = await getCheckoutContext(payment.id)
  return Response.json({ paymentId: payment.id, amountCents: payment.amountCents, ...(quote ? { discountCents: quote.discountCents, subtotalCents: quote.subtotalCents, coupon: quote.coupon } : {}) })
}
