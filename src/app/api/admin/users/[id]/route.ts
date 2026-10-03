import { db } from '@/lib/db'
import { getSessionUser, jsonError, hashPassword } from '@/lib/auth'

async function requireAdmin() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return null
  return session
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return jsonError('Não autorizado', 401)
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const data: Record<string, unknown> = {}
  if (typeof body.hasAccess === 'boolean') {
    data.hasAccess = body.hasAccess
    data.accessSource = body.hasAccess ? 'ADMIN_GRANT' : null
    // Liberação da conta sempre encerra o estado "aguardando PIX manual"
    if (body.hasAccess) data.status = 'ACTIVE'
  }
  if (body.role === 'USER' || body.role === 'ADMIN') data.role = body.role
  // Redefinição de senha pelo Admin Master (não há recuperação automática por enquanto)
  if (typeof body.password === 'string') {
    const password = body.password
    if (password.length < 6) return jsonError('A senha precisa ter no mínimo 6 caracteres', 400)
    data.password = await hashPassword(password)
  }

  const user = await db.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, hasAccess: true, status: true, accessSource: true, createdAt: true },
  })
  return Response.json({ user })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return jsonError('Não autorizado', 401)
  const { id } = await params
  if (session.id === id) return jsonError('Você não pode excluir a si mesmo', 400)
  await db.user.delete({ where: { id } })
  return Response.json({ ok: true })
}
