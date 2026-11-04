import { caktoProvider, InvalidCaktoWebhook } from '@/lib/payments/cakto'
import { processPaymentEvent } from '@/lib/payments/processor'
import { countAttempt, isThrottled, requestIp, throttleKey } from '@/lib/security-guards'

export const runtime = 'nodejs'
export const maxDuration = 10
const MAX_BODY = 256 * 1024

export async function POST(req: Request) {
  // Limite bastante generoso para não prejudicar retries legítimos da Cakto.
  const rateKey = throttleKey('cakto-webhook-ip', requestIp(req))
  if (await isThrottled(rateKey)) return Response.json({ error: 'Limite temporário' }, { status: 429 })
  await countAttempt(rateKey, 2000, 1)
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
  const events = caktoProvider.normalize(payload)
  if (!events.length || events.length > 100) return Response.json({ error: 'Lote inválido' }, { status: 400 })
  try {
    for (const evt of events) {
      if (evt.kind === 'IGNORADO') console.info('[cakto] evento ignorado:', evt.type)
      await processPaymentEvent(caktoProvider.name, evt)
    }
    return Response.json({ ok: true })
  } catch {
    // Não dá 200 se falhou: solicita reenvio pelo gateway.
    console.error('[cakto] erro ao persistir evento')
    return Response.json({ error: 'Falha temporária' }, { status: 500 })
  }
}
