import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'
import { COUPON_PREFIX, CHECKOUT_PREFIX, validateCouponInput, type Coupon, type CheckoutContext } from '@/lib/coupons'

async function allowed() { const user = await getSessionUser(); return user?.role === 'ADMIN' }

export async function GET() {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const [rows, orders] = await Promise.all([
    db.setting.findMany({ where: { key: { startsWith: COUPON_PREFIX } } }),
    db.setting.findMany({ where: { key: { startsWith: CHECKOUT_PREFIX } } }),
  ])
  const contexts = new Map<string, CheckoutContext>()
  for (const row of orders) { try { const value = JSON.parse(row.value) as CheckoutContext; if (value.coupon) contexts.set(row.key.slice(CHECKOUT_PREFIX.length), value) } catch { /* registro inválido não entra nas estatísticas */ } }
  const paid = contexts.size ? await db.payment.findMany({ where: { id: { in: [...contexts.keys()] }, status: 'APPROVED' }, select: { id: true } }) : []
  const totals = new Map<string, { uses: number; discountsCents: number }>()
  for (const payment of paid) {
    const context = contexts.get(payment.id)!
    const code = context.coupon!.code
    const total = totals.get(code) || { uses: 0, discountsCents: 0 }
    total.uses++; total.discountsCents += context.discountCents; totals.set(code, total)
  }
  const coupons = rows.flatMap(row => { try { const coupon = JSON.parse(row.value) as Coupon; return [{ ...coupon, ...(totals.get(coupon.code) || { uses: 0, discountsCents: 0 }) }] } catch { return [] } })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return Response.json({ coupons })
}

export async function POST(req: Request) {
  if (!(await allowed())) return jsonError('Acesso restrito ao master', 401)
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('Dados do cupom inválidos.', 400)
  try {
    const coupon = validateCouponInput(body)
    await db.setting.create({ data: { key: COUPON_PREFIX + coupon.code, value: JSON.stringify(coupon) } })
    return Response.json({ coupon }, { status: 201 })
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') return jsonError('Já existe um cupom com este código.', 409)
    return jsonError(error instanceof Error ? error.message : 'Não foi possível criar o cupom.', 400)
  }
}
