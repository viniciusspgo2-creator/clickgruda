import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { cleanBocaoInput } from '@/lib/bocao-validation'

async function authorized() { const user = await getSessionUser(); return user?.role === 'ADMIN' }

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return jsonError('Não autorizado', 401)
  const { id } = await params
  const parsed = cleanBocaoInput(await req.json().catch(() => null))
  if (!parsed) return jsonError('Informe arte principal e prévia válidas.', 400)
  const art = await db.art.findUnique({ where: { id: parsed.artId }, select: { id: true } })
  if (!art) return jsonError('A arte CG selecionada não existe.', 404)
  try {
    const bocao = await db.bocao.update({ where: { id }, data: parsed })
    return Response.json({ bocao })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return jsonError('Esse código CG já está associado a outro bocão.', 409)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return jsonError('Bocão não encontrado.', 404)
    throw e
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return jsonError('Não autorizado', 401)
  const { id } = await params
  await db.bocao.delete({ where: { id } }).catch(() => null)
  // O complemento sai do catálogo, mas os arquivos R2 não são apagados automaticamente.
  return Response.json({ ok: true })
}
