import { getSessionUser, jsonError } from '@/lib/auth'
import { isSafeOrigin } from '@/lib/security-guards'
import { ReceiptError, voidManualReceipt } from '@/lib/manual-receipts'
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'ADMIN') return jsonError('Não autorizado', 401)
  if (!isSafeOrigin(req)) return jsonError('Solicitação inválida', 403)
  const body = await req.json().catch(() => null),
    reason = typeof body?.reason === 'string' ? body.reason.trim() : ''
  if (reason.length < 5 || reason.length > 500)
    return jsonError('Informe o motivo da anulação (5 a 500 caracteres).', 400)
  try {
    return Response.json(
      await voidManualReceipt((await params).id, reason, admin.id),
    )
  } catch (e) {
    return e instanceof ReceiptError
      ? jsonError(e.message, e.status)
      : jsonError(
          'Não foi possível confirmar a anulação. Tente novamente.',
          503,
        )
  }
}
