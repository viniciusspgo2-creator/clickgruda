import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { parseArtCode } from '@/lib/art-code'
import { cleanBocaoInput } from '@/lib/bocao-validation'

export async function GET(req: Request) {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const search = new URL(req.url).searchParams.get('q')?.trim().slice(0, 100) || ''
  const code = parseArtCode(search)
  const requestedPage = Number(new URL(req.url).searchParams.get('page') || 1)
  const page = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 10000) : 1
  const pageSize = 30
  const where: Prisma.BocaoWhereInput = search ? { art: { is: code !== null ? { code } : { title: { contains: search, mode: 'insensitive' } } } } : {}
  const [rows, total] = await Promise.all([
    db.bocao.findMany({ where, include: { art: { select: { id: true, code: true, title: true, imageUrl: true, isRejected: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    db.bocao.count({ where }),
  ])
  return Response.json({ bocoes: rows, total, page, hasMore: page * pageSize < total }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const body = await req.json().catch(() => null)
  const parsed = cleanBocaoInput(body)
  if (!parsed) return jsonError('Escolha a arte CG correspondente e envie a imagem do bocão.', 400)
  const art = await db.art.findUnique({ where: { id: parsed.artId }, select: { id: true } })
  if (!art) return jsonError('A arte principal não existe.', 404)
  try {
    const bocao = await db.bocao.create({ data: parsed })
    return Response.json({ bocao }, { status: 201 })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return jsonError('Essa arte CG já possui um bocão. Edite o existente em vez de cadastrar outro.', 409)
    throw e
  }
}
