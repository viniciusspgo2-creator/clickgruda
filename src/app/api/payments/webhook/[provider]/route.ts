import { db } from '@/lib/db'
import { getSettings } from '@/lib/settings'
import { fetchGatewayPayment, synchronizePayment, validMercadoPagoSignature } from '@/lib/payment-verification'

export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const providerName = (await params).provider
  if (!['mercadopago', 'asaas'].includes(providerName)) return Response.json({ received: false }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const settings = await getSettings()
  const url = new URL(req.url)
  const provider = providerName === 'mercadopago' ? 'MERCADOPAGO' : 'ASAAS'
  const rawId = provider === 'MERCADOPAGO' ? url.searchParams.get('data.id') || url.searchParams.get('id') || body?.data?.id : body?.payment?.id
  const externalId = rawId == null ? '' : String(rawId)
  if (!externalId || externalId.length > 100) return Response.json({ received: true, ignored: true })
  if (provider === 'MERCADOPAGO') {
    if (!/^\d+$/.test(externalId)) return Response.json({ received: true, ignored: true })
    if (body?.data?.id && String(body.data.id) !== externalId) return Response.json({ received: false }, { status: 400 })
    if (!validMercadoPagoSignature(req, externalId, settings.mercadopago_webhook_secret || '')) return Response.json({ received: false }, { status: 401 })
  }
  if (!(provider === 'MERCADOPAGO' ? settings.mercadopago_access_token : settings.asaas_api_key)?.trim()) return Response.json({ received: false }, { status: 503 })
  try {
    const snapshot = await fetchGatewayPayment(provider, externalId, settings)
    // A referência local permite localizar o pedido mesmo se o webhook chegar antes do retorno da criação do PIX.
    const payment = await db.payment.findFirst({ where: { provider, OR: [{ externalId }, ...(snapshot.reference ? [{ id: snapshot.reference }] : [])] } })
    if (payment) await synchronizePayment(payment, settings, snapshot)
    return Response.json({ received: true })
  } catch {
    // Falha temporária recebe resposta não-2xx para o gateway tentar novamente.
    return Response.json({ received: false }, { status: 503 })
  }
}
