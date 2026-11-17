import { db } from '@/lib/db'
import { kiwifyProvider, InvalidKiwifyWebhook } from '@/lib/payments/kiwify'
import { processPaymentEvent } from '@/lib/payments/processor'
import { countAttempt, isThrottled, requestIp, throttleKey } from '@/lib/security-guards'

export const runtime = 'nodejs'
export const maxDuration = 30
const MAX_BODY = 256 * 1024

/**
 * Webhook da Kiwify (Apps → Webhooks) — canal ADICIONAL de venda.
 * A Cakto continua sendo o checkout do site e não muda nada.
 * Na venda aprovada, libera o acesso vitalício na conta ClickGruda que já
 * existe com o mesmo e-mail do comprador (mesmo modelo da Cakto: a conta é
 * criada antes, no cadastro grátis). Sem conta, a compra fica registrada em
 * PendingPurchase para reconciliação no admin.
 */
export async function POST(req: Request) {
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return Response.json({ error: 'Corpo muito grande' }, { status: 413 })
  let raw: string
  try {
    raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY) return Response.json({ error: 'Corpo muito grande' }, { status: 413 })
  } catch { return Response.json({ error: 'Corpo inválido' }, { status: 400 }) }
  let payload: unknown
  try { payload = kiwifyProvider.verify(raw, req.headers) }
  catch (error) {
    return Response.json({ error: 'Webhook não autorizado' }, { status: error instanceof InvalidKiwifyWebhook ? 401 : 400 })
  }
  const rateKey = throttleKey('kiwify-webhook-ip', requestIp(req))
  try {
    if (await isThrottled(rateKey)) return Response.json({ error: 'Limite temporário' }, { status: 429 })
    await countAttempt(rateKey, 2000, 1)
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN'
    console.warn('[kiwify] contador de solicitações indisponível', { code })
  }
  const events = kiwifyProvider.normalize(payload)
  if (!events.length || events.length > 100) return Response.json({ error: 'Lote inválido' }, { status: 400 })
  try {
    for (const evt of events) {
      if (evt.kind === 'IGNORADO') console.info('[kiwify] evento ignorado:', evt.type)
      await processPaymentEvent(kiwifyProvider.name, evt)
    }
    return Response.json({ ok: true })
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code : 'UNKNOWN'
    console.error('[kiwify] falha ao processar evento', { code, types: events.map((event) => event.kind) })
    return Response.json({ error: 'Falha temporária' }, { status: 500 })
  }
}
