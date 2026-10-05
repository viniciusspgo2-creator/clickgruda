import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

/** POST /api/waitlist — membro entra na lista de espera do Catálogo Digital (preço de membro). */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para entrar na lista.', 401)
  if (!session.hasAccess || session.isDemo) return jsonError('A lista de espera é exclusiva para membros com acesso ativo.', 403)

  const body = await req.json().catch(() => ({}))
  const name = String(body.name || '').trim().slice(0, 80)
  const email = String(body.email || '').trim().toLowerCase().slice(0, 120)
  const whatsapp = String(body.whatsapp || '').replace(/\D/g, '').slice(0, 15)

  if (name.length < 2) return jsonError('Informe o seu nome.', 400)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError('Informe um e-mail válido.', 400)
  if (whatsapp.length < 10) return jsonError('Informe o WhatsApp com DDD (ex: 62 99999-9999).', 400)

  const entry = await db.catalogoWaitlist.upsert({
    where: { email },
    create: { name, email, whatsapp, userId: session.id },
    update: { name, whatsapp, userId: session.id },
  })
  return Response.json({ ok: true, id: entry.id })
}
