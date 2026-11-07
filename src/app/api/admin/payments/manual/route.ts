import { getSessionUser, jsonError } from '@/lib/auth'
import { isSafeOrigin } from '@/lib/security-guards'
import {
  receiptInput,
  ReceiptError,
  registerManualReceipt,
} from '@/lib/manual-receipts'
import { deliverStudioBonus } from '@/lib/studio-bonus'
import { db } from '@/lib/db'
export const runtime = 'nodejs'
export async function GET(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 100)
  const users = await db.user.findMany({
    where: {
      role: 'USER',
      isDemo: false,
      isPreview: false,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    take: 30,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      hasAccess: true,
    },
  })
  return Response.json(
    { users },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
export async function POST(req: Request) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  if (!isSafeOrigin(req)) return jsonError('Solicitação inválida', 403)
  const raw = await req.text()
  if (Buffer.byteLength(raw) > 8192)
    return jsonError('Solicitação muito grande', 413)
  try {
    const parsed = receiptInput.safeParse(JSON.parse(raw))
    if (!parsed.success)
      return jsonError(
        'Confira valor, data, forma de pagamento e comprovante. Confirme que o valor foi recebido fora dos gateways.',
        400,
      )
    const result = await registerManualReceipt(parsed.data, admin.id)
    await deliverStudioBonus(parsed.data.userId).catch(() => {})
    return Response.json(result, {
      status: result.duplicate ? 200 : 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    if (e instanceof SyntaxError) return jsonError('Dados inválidos', 400)
    if (e instanceof ReceiptError) return jsonError(e.message, e.status)
    return jsonError(
      'Não foi possível confirmar o lançamento. Tente novamente com os mesmos dados.',
      503,
    )
  }
}
