import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

const HONEYPOT_MAX = 600

/**
 * POST /api/suggestions — endpoint público.
 * Recebe a sugestão de tema/arte enviada pela landing e registra no Painel Admin Master.
 * Anônima por opção: nome e contato são opcionais.
 */
export async function POST(req: Request) {
  let body: { message?: unknown; name?: unknown; contact?: unknown }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 160) : ''

  if (message.length < 3) {
    return Response.json({ error: 'Escreva a sua sugestão (mínimo 3 caracteres).' }, { status: 400 })
  }
  if (message.length > HONEYPOT_MAX) {
    return Response.json({ error: 'Sugestão muito longa (máximo 600 caracteres).' }, { status: 400 })
  }

  // Enviado de dentro do portal → vincula à conta (rastreio no Admin Master)
  const session = await getSessionUser()

  const suggestion = await db.themeSuggestion.create({
    data: { message, name, contact, userId: session?.id || null },
  })

  return Response.json({ ok: true, id: suggestion.id }, { status: 201 })
}
