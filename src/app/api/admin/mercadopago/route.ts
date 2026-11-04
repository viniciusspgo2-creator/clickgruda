import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings, setSettings } from '@/lib/settings'
import { SITE_URL } from '@/lib/site'

async function allowed() { return (await getSessionUser())?.role === 'ADMIN' }
export async function GET() {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const s = await getSettings(['mercadopago_access_token', 'mercadopago_webhook_secret', 'payment_provider'])
  return Response.json({ configured: Boolean(s.mercadopago_access_token?.trim()), signatureConfigured: Boolean(s.mercadopago_webhook_secret?.trim()), preferred: s.payment_provider === 'MERCADOPAGO', webhookUrl: `${SITE_URL}/api/payments/webhook/mercadopago` })
}
export async function PUT(req: Request) {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const body = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados inválidos.', 400)
  const values: Record<string, string> = {}
  if (typeof body.token === 'string' && body.token.trim()) {
    const token = body.token.trim()
    if (!/^[a-zA-Z0-9_-]{10,512}$/.test(token)) return jsonError('Access Token inválido. Copie o valor das credenciais do Mercado Pago.', 400)
    values.mercadopago_access_token = token
  }
  if (typeof body.webhookSecret === 'string' && body.webhookSecret.trim()) {
    if (body.webhookSecret.trim().length > 512) return jsonError('Chave de assinatura inválida.', 400)
    values.mercadopago_webhook_secret = body.webhookSecret.trim()
  }
  if (body.preferred === true) values.payment_provider = 'MERCADOPAGO'
  else if (body.preferred === false) values.payment_provider = ''
  await setSettings(values)
  return Response.json({ ok: true })
}
