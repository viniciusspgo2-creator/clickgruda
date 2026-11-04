import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { COUPON_PREFIX, getCoupon, normalizeCouponCode, validateCouponInput } from '@/lib/coupons'

export async function PATCH(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const user = await getSessionUser()
  if (user?.role !== 'ADMIN') return jsonError('Acesso restrito ao master', 401)
  try {
    const code = normalizeCouponCode((await params).code)
    const previous = await getCoupon(code)
    if (!previous) return jsonError('Cupom não encontrado.', 404)
    const body = await req.json().catch(() => null)
    if (!body || typeof body.active !== 'boolean') return jsonError('Informe o status do cupom.', 400)
    const coupon = validateCouponInput({ active: body.active }, previous)
    await db.setting.update({ where: { key: COUPON_PREFIX + code }, data: { value: JSON.stringify(coupon) } })
    return Response.json({ coupon })
  } catch (error) { return jsonError(error instanceof Error ? error.message : 'Cupom inválido.', 400) }
}
