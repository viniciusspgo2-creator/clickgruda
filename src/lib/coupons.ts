import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export type Coupon = {
  code: string; type: 'PERCENT' | 'FIXED'; value: number; active: boolean
  minSubtotalCents: number; expiresAt: string | null; createdAt: string; updatedAt: string
}
export type CheckoutQuote = {
  subtotalCents: number; discountCents: number; amountCents: number
  coupon: Pick<Coupon, 'code' | 'type' | 'value'> | null
}
export type CheckoutContext = CheckoutQuote & { userId: string; createdAt: string }
type SettingsClient = Pick<Prisma.TransactionClient, 'setting'>
export const COUPON_PREFIX = 'coupon:'
export const CHECKOUT_PREFIX = 'checkout:'

export function normalizeCouponCode(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  const code = raw.trim().toUpperCase()
  if (code && !/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code)) throw new Error('Use um cupom de 3 a 32 caracteres, com letras, números, hífen ou sublinhado.')
  return code
}

export function validateCouponInput(input: Record<string, unknown>, previous?: Coupon): Coupon {
  const code = normalizeCouponCode(input.code ?? previous?.code) || `CG-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`
  const type = input.type ?? previous?.type ?? 'PERCENT'
  if (type !== 'PERCENT' && type !== 'FIXED') throw new Error('Tipo de desconto inválido.')
  const value = Number(input.value ?? previous?.value)
  if (!Number.isSafeInteger(value) || value < 1 || (type === 'PERCENT' ? value > 99 : value > 10000000)) throw new Error(type === 'PERCENT' ? 'Informe um percentual inteiro de 1 a 99.' : 'Informe um desconto em reais maior que zero.')
  const minSubtotalCents = Number(input.minSubtotalCents ?? previous?.minSubtotalCents ?? 0)
  if (!Number.isSafeInteger(minSubtotalCents) || minSubtotalCents < 0 || minSubtotalCents > 100000000) throw new Error('Valor mínimo de compra inválido.')
  const rawDate = input.expiresAt === undefined ? previous?.expiresAt : input.expiresAt
  const date = rawDate ? new Date(String(rawDate)) : null
  if (date && !Number.isFinite(date.getTime())) throw new Error('Data de validade inválida.')
  if (input.active !== undefined && typeof input.active !== 'boolean') throw new Error('Status do cupom inválido.')
  const now = new Date().toISOString()
  return { code, type, value, minSubtotalCents, active: input.active === undefined ? previous?.active ?? true : input.active === true,
    expiresAt: date?.toISOString() ?? null, createdAt: previous?.createdAt ?? now, updatedAt: now }
}

export function calculateCouponQuote(subtotalCents: number, coupon: Coupon | null, now = Date.now()): CheckoutQuote {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 100) throw new Error('O preço do acesso está inválido. Entre em contato com o suporte.')
  if (!coupon) return { subtotalCents, discountCents: 0, amountCents: subtotalCents, coupon: null }
  if (!coupon.active) throw new Error('Este cupom está desativado.')
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= now) throw new Error('Este cupom expirou.')
  if (subtotalCents < coupon.minSubtotalCents) throw new Error(`Este cupom exige uma compra de pelo menos ${(coupon.minSubtotalCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`)
  const discountCents = coupon.type === 'PERCENT' ? Math.round(subtotalCents * coupon.value / 100) : coupon.value
  const amountCents = subtotalCents - discountCents
  if (!Number.isSafeInteger(discountCents) || discountCents < 1 || amountCents < 100) throw new Error('Este desconto não se aplica ao preço atual. O valor final precisa ser de pelo menos R$ 1,00.')
  return { subtotalCents, discountCents, amountCents, coupon: { code: coupon.code, type: coupon.type, value: coupon.value } }
}

export async function getCoupon(code: string, client: SettingsClient = db): Promise<Coupon | null> {
  const row = await client.setting.findUnique({ where: { key: COUPON_PREFIX + code } })
  if (!row) return null
  try { const stored = JSON.parse(row.value); return { ...validateCouponInput(stored, stored), updatedAt: stored.updatedAt } } catch { return null }
}

export async function quoteCheckout(subtotalCents: number, rawCode: unknown, client: SettingsClient = db): Promise<CheckoutQuote> {
  const code = normalizeCouponCode(rawCode)
  const coupon = code ? await getCoupon(code, client) : null
  if (code && !coupon) throw new Error('Cupom não encontrado. Confira o código informado.')
  return calculateCouponQuote(subtotalCents, coupon)
}

export async function createCheckoutOrder(userId: string, provider: string, subtotalCents: number, code: unknown) {
  return db.$transaction(async tx => {
    // O preço e o desconto são recalculados no servidor no momento da cobrança.
    const quote = await quoteCheckout(subtotalCents, code, tx)
    const payment = await tx.payment.create({ data: { userId, provider, amountCents: quote.amountCents, status: 'PENDING', method: 'PIX' } })
    await tx.setting.create({ data: { key: CHECKOUT_PREFIX + payment.id, value: JSON.stringify({ ...quote, userId, createdAt: new Date().toISOString() } satisfies CheckoutContext) } })
    return { payment, quote }
  })
}

export async function getCheckoutContext(paymentId: string): Promise<CheckoutContext | null> {
  const row = await db.setting.findUnique({ where: { key: CHECKOUT_PREFIX + paymentId } })
  if (!row) return null
  try { return JSON.parse(row.value) as CheckoutContext } catch { return null }
}
