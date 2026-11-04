import { caktoProvider, InvalidCaktoWebhook } from '@/lib/payments/cakto'
import { processPaymentEvent } from '@/lib/payments/processor'
import { countAttempt, isThrottled, requestIp, throttleKey } from '@/lib/security-guards'

export const runtime = 'nodejs'
export const maxDuration = 10
const MAX_BODY = 256 * 1024

export async function POST(req: Request) {
  if (Number(req.headers.get('content-length') || 0) > MAX_BODY) return Response.json({ error: 'Corpo muito grande' }, { status: 413 })
  let raw: string
  try {
    raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY) return Response.json({ error: 'Corpo muito grande' }, { status: 413 })
  } catch { return Response.json({ error: 'Corpo inválido' }, { status: 400 }) }
  let payload: unknown
  try { payload = caktoProvider.verify(raw, req.headers) }
  catch (error) {
    return Response.json({ error: 'Webhook não autorizado' }, { status: error instanceof InvalidCaktoWebhook ? 401 : 400 })
  }
  // A autenticação ocorre antes de acessar o contador persistente.
  // Se o contador falhar temporariamente durante uma rajada de eventos válidos,
  // não transformar esse erro acessório em 500 de um pagamento legítimo.
  const rateKey = throttleKey('cakto-webhook-ip', requestIp(req))
  try {
    if (await isThrottled(rateKey)) return Response.json({ error: 'Limite temporário' }, { status: 429 })
    await countAttempt(rateKey, 2000, 1)
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN'
    console.warn('[cakto] contador de solicitações indisponível', { code })
  }
  const events = caktoProvider.normalize(payload)
  if (!events.length || events.length > 100) return Response.json({ error: 'Lote inválido' }, { status: 400 })
  try {
    for (const evt of events) {
      if (evt.kind === 'IGNORADO') console.info('[cakto] evento ignorado:', evt.type)
      await processPaymentEvent(caktoProvider.name, evt)
    }
    return Response.json({ ok: true })
  } catch (error) {
    // Nunca registrar segredos nem dados do comprador em logs.
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code : 'UNKNOWN'
    console.error('[cakto] falha ao processar evento', { code, types: events.map((event) => event.kind) })
    // Não dá 200 se falhou: solicita reenvio pelo gateway.
    return Response.json({ error: 'Falha temporária' }, { status: 500 })
  }
}
