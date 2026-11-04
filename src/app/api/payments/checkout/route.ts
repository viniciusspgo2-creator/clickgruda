import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings, resolveProvider, type GatewayProvider } from '@/lib/settings'
import { createMercadoPagoPix, createAsaasPix } from '@/lib/payments'
import { createCheckoutOrder } from '@/lib/coupons'

export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para assinar', 401)
  if (session.isDemo) return jsonError('Conta Preview: operação indisponível.', 403)
  if (session.hasAccess) return jsonError('Sua conta já tem acesso ativo.', 400)
  const body = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados inválidos.', 400)
  const settings = await getSettings()
  const requested = typeof body.provider === 'string' ? body.provider.toUpperCase() : ''
  let provider: GatewayProvider | null = resolveProvider(settings)
  if (requested) {
    if (!['MERCADOPAGO', 'ASAAS'].includes(requested)) return jsonError('Forma de pagamento inválida.', 400)
    const available = requested === 'MERCADOPAGO' ? settings.mercadopago_access_token : settings.asaas_api_key
    if (!available?.trim()) return jsonError('Esta forma de pagamento não está disponível.', 400)
    provider = requested as GatewayProvider
  }
  if (!provider) return jsonError('Nenhum gateway está ativo. Consulte as formas disponíveis no checkout.', 400)
  const cpf = typeof body.cpf === 'string' ? body.cpf.replace(/\D/g, '') : ''
  if (provider === 'ASAAS' && cpf.length !== 11) return jsonError('Informe um CPF válido para pagar via Asaas.', 400)
  let order: Awaited<ReturnType<typeof createCheckoutOrder>>
  try { order = await createCheckoutOrder(session.id, provider, Number(settings.price_cents || 4790), body.couponCode) }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Confira o cupom informado.', 400) }
  try {
    const opts = { amountCents: order.quote.amountCents, paymentId: order.payment.id, email: session.email, name: session.name, description: 'Click & Gruda — acesso à plataforma' }
    const result = provider === 'MERCADOPAGO'
      ? await createMercadoPagoPix({ ...opts, token: settings.mercadopago_access_token })
      : await createAsaasPix({ ...opts, key: settings.asaas_api_key, sandbox: settings.asaas_sandbox === 'true', cpfCnpj: cpf })
    const payment = await db.payment.update({ where: { id: order.payment.id }, data: { externalId: result.externalId, qrCodePayload: result.qrCodePayload, qrCodeImage: result.qrCodeImage } })
    return Response.json({ id: payment.id, status: payment.status, provider, ...order.quote, qrCodeImage: result.qrCodeImage, qrCodePayload: result.qrCodePayload })
  } catch (error) {
    await db.payment.updateMany({ where: { id: order.payment.id, status: 'PENDING' }, data: { status: 'FAILED' } })
    return jsonError(error instanceof Error ? error.message : 'Não foi possível gerar o PIX. Tente novamente.', 502)
  }
}
