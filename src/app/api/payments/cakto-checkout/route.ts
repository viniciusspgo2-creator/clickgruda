import { getSessionUser } from '@/lib/auth'
import { resolveCaktoCheckout } from '@/lib/payments/buyer-country'

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user || user.isDemo) return Response.json({ error: 'Autenticação necessária' }, { status: 401 })
  // Acesso compartilhado (só-Studio / Preview) não compra com o e-mail universal:
  // quem quiser o vitalício cria a própria conta com o próprio e-mail.
  if (user.isStudioOnly || user.isPreview) return Response.json({ error: 'Este é um acesso compartilhado. Crie sua própria conta com seu e-mail para comprar o acesso vitalício.' }, { status: 403 })
  if (user.hasAccess && !user.isTrial) return Response.json({ error: 'Seu acesso já está ativo' }, { status: 409 })
  // Brasil -> checkout em real; fora do Brasil -> checkout em dólar.
  // Sem país detectado o padrão é o Brasil (comportamento atual).
  const { url, country, currency } = await resolveCaktoCheckout(req)
  if (!url) return Response.json({ error: 'Checkout Cakto não configurado. Contate o suporte.' }, { status: 503 })
  console.info('[cakto-checkout] país=%s checkout=%s', country ?? 'desconhecido (BR)', currency)
  return Response.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } })
}
