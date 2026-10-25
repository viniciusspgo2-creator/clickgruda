import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { parseArtCode } from '@/lib/art-code'
import type { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  const session = await getSessionUser()
  if (!session || (!session.hasAccess && session.role !== 'ADMIN')) return jsonError('Acesso necessário para consultar os bocões.', 403)
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120)
  const code = parseArtCode(q)
  const requestedPage = Number(url.searchParams.get('page') || 1)
  const page = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 1000) : 1
  const where: Prisma.BocaoWhereInput = q ? { art: { is: code !== null ? { code } : { title: { contains: q, mode: 'insensitive' as const } } } } : {}
  const size = 24
  const [rows, total] = await Promise.all([
    db.bocao.findMany({ where, include: { art: { select: { id: true, code: true, title: true, imageUrl: true, isRejected: true } } }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * size, take: size }),
    db.bocao.count({ where }),
  ])
  return Response.json({
    bocoes: rows.map((row) => ({
      id: row.id, artId: row.artId, code: row.art.code, title: row.art.title, note: row.note,
      imageUrl: session.isDemo ? `/api/bocoes/${row.id}/preview` : row.imageUrl,
      artImageUrl: session.isDemo ? `/api/arts/${row.artId}/preview` : row.art.imageUrl,
      isRejected: row.art.isRejected,
    })),
    total, page, hasMore: page * size < total,
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
