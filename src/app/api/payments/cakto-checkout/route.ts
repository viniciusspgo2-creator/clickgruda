import { getSessionUser } from '@/lib/auth'
import { caktoProvider } from '@/lib/payments/cakto'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.isDemo) return Response.json({ error: 'Autenticação necessária' }, { status: 401 })
  // Acesso compartilhado (só-Studio / Preview) não compra com o e-mail universal:
  // quem quiser o vitalício cria a própria conta com o próprio e-mail.
  if (user.isStudioOnly || user.isPreview) return Response.json({ error: 'Este é um acesso compartilhado. Crie sua própria conta com seu e-mail para comprar o acesso vitalício.' }, { status: 403 })
  if (user.hasAccess && !user.isTrial) return Response.json({ error: 'Seu acesso já está ativo' }, { status: 409 })
  const url = caktoProvider.checkoutUrl(user.email)
  if (!url) return Response.json({ error: 'Checkout Cakto não configurado. Contate o suporte.' }, { status: 503 })
  return Response.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } })
}
