import { getSessionUser, jsonError } from '@/lib/auth'
import { getSettings } from '@/lib/settings'
import { quoteCheckout } from '@/lib/coupons'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user || user.isDemo) return jsonError('Entre na sua conta para aplicar um cupom.', 401)
  const body = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados inválidos.', 400)
  const settings = await getSettings(['price_cents'])
  try { return Response.json(await quoteCheckout(Number(settings.price_cents || 4790), body.couponCode)) }
  catch (error) { return jsonError(error instanceof Error ? error.message : 'Cupom inválido.', 400) }
}
