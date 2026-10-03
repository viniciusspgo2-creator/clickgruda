import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings, resolveProvider, type GatewayProvider } from '@/lib/settings'
import { createMercadoPagoPix, createAsaasPix } from '@/lib/payments'

/**
 * POST /api/payments/checkout — gera o PIX via gateway REAL.
 * Mercado Pago/Asaas ficam disponíveis automaticamente assim que as
 * credenciais são salvas no Admin Master (Configurações). Sem gateway
 * configurado, o checkout usa o fluxo "PIX direto (chave)" — esta rota
 * então responde com erro orientado (o frontend não a chama nesse caso).
 */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para assinar', 401)

  const body = await req.json().catch(() => ({}))
  const settings = await getSettings()
  const requested = (body.provider || '').toUpperCase()
  const effective = resolveProvider(settings)

  // Só permite um gateway que esteja realmente configurado (por segurança).
  let provider: GatewayProvider | null = effective
  if (requested === 'MERCADOPAGO' && (settings.mercadopago_access_token || '').trim()) provider = 'MERCADOPAGO'
  else if (requested === 'ASAAS' && (settings.asaas_api_key || '').trim()) provider = 'ASAAS'

  if (!provider) {
    return jsonError(
      'Nenhum gateway de pagamento ativo no momento. Use a opção "PIX direto (chave)" no checkout.',
      400
    )
  }

  const amountCents = parseInt(settings.price_cents || '4790', 10)
  const description = 'Click & Gruda — Acesso Vitalício a todas as artes'

  try {
    if (provider === 'MERCADOPAGO') {
      const mp = await createMercadoPagoPix({
        token: settings.mercadopago_access_token,
        amountCents,
        email: session.email,
        name: session.name,
        description,
      })
      const payment = await db.payment.create({
        data: {
          userId: session.id,
          provider,
          amountCents,
          status: 'PENDING',
          externalId: mp.externalId,
          qrCodePayload: mp.qrCodePayload,
          qrCodeImage: mp.qrCodeImage,
        },
      })
      return Response.json({
        id: payment.id,
        status: payment.status,
        provider,
        amountCents,
        qrCodeImage: mp.qrCodeImage,
        qrCodePayload: mp.qrCodePayload,
      })
    }

    // ASAAS
    const cpf = (body.cpf || '').replace(/\D/g, '')
    if (!cpf || cpf.length < 11) {
      return jsonError('Informe um CPF válido para pagar via Asaas', 400)
    }
    const asaas = await createAsaasPix({
      key: settings.asaas_api_key,
      sandbox: settings.asaas_sandbox === 'true',
      name: session.name,
      email: session.email,
      cpfCnpj: cpf,
      amountCents,
      description,
    })
    const payment = await db.payment.create({
      data: {
        userId: session.id,
        provider,
        amountCents,
        status: 'PENDING',
        externalId: asaas.externalId,
        qrCodePayload: asaas.qrCodePayload,
        qrCodeImage: asaas.qrCodeImage,
      },
    })
    return Response.json({
      id: payment.id,
      status: payment.status,
      provider,
      amountCents,
      qrCodeImage: asaas.qrCodeImage,
      qrCodePayload: asaas.qrCodePayload,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro ao gerar o PIX. Tente novamente.'
    return jsonError(message, 502)
  }
}
