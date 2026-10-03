import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

/** GET — lista os links de catálogo do assinante logado. */
export async function GET() {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para continuar', 401)

  const links = await db.shareLink.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return Response.json({
    links: links.map((l) => ({
      id: l.id,
      token: l.token,
      whatsapp: l.whatsapp,
      active: l.active,
      views: l.views,
      expiresAt: l.expiresAt.toISOString(),
      createdAt: l.createdAt.toISOString(),
    })),
  })
}

const VALID_DAYS = [1, 3, 7]

/** POST — gera um novo link temporário (máx. 5 ativos por assinante). */
export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) return jsonError('Faça login para continuar', 401)
  if (!session.hasAccess) return jsonError('Assine o acesso vitalício para compartilhar o catálogo.', 403)

  const body = await req.json().catch(() => ({}))
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.replace(/[^\d+]/g, '').slice(0, 20) : ''
  const days = VALID_DAYS.includes(Number(body.expiresInDays)) ? Number(body.expiresInDays) : 3

  const activeCount = await db.shareLink.count({ where: { userId: session.id, active: true } })
  if (activeCount >= 5) {
    return jsonError('Você já tem 5 links ativos. Exclua um antes de criar outro.', 400)
  }

  const token = crypto.randomUUID().replace(/-/g, '').slice(0, 22)
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

  const link = await db.shareLink.create({
    data: { token, userId: session.id, whatsapp, expiresAt },
  })

  return Response.json(
    {
      link: {
        id: link.id,
        token: link.token,
        whatsapp: link.whatsapp,
        active: link.active,
        views: link.views,
        expiresAt: link.expiresAt.toISOString(),
        createdAt: link.createdAt.toISOString(),
      },
    },
    { status: 201 }
  )
}
