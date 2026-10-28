'use client'
import { useState } from 'react'
import { Check, Loader2, TicketPercent, X } from 'lucide-react'
import type { CheckoutQuote } from '@/lib/coupons'
import { formatBRL } from '@/lib/types'

export function CouponEntry({ subtotalCents, value, onChange, disabled = false }: {
  subtotalCents: number; value: CheckoutQuote | null; onChange: (value: CheckoutQuote | null) => void; disabled?: boolean
}) {
  const [code, setCode] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const apply = async () => {
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/payments/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ couponCode: code }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Confira o cupom.')
      onChange(data); setCode(data.coupon?.code || code)
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível validar o cupom.'); onChange(null) }
    finally { setLoading(false) }
  }
  return <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
    <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-bold text-zinc-800" aria-expanded={open}><TicketPercent className="h-4 w-4 text-orange-600" /> Tenho um cupom de desconto</button>
    {(open || value?.coupon) && <>
      {!value?.coupon && <div className="mt-3 flex gap-2"><label className="sr-only" htmlFor="checkout-coupon">Código do cupom</label><input id="checkout-coupon" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }} onKeyDown={e => { if (e.key === 'Enter' && code.trim() && !loading && !disabled) { e.preventDefault(); apply() } }} placeholder="Digite o código" maxLength={32} autoComplete="off" disabled={disabled || loading} className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-orange-500" /><button type="button" onClick={apply} disabled={!code.trim() || loading || disabled} className="rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}</button></div>}
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      {value?.coupon && <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><span className="flex items-center gap-2 font-bold"><Check className="h-4 w-4" /> {value.coupon.code} aplicado</span><button type="button" disabled={disabled} aria-label="Remover cupom" onClick={() => { onChange(null); setError('') }}><X className="h-4 w-4" /></button></div>}
      {value?.coupon && <dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between text-zinc-500"><dt>Subtotal</dt><dd>{formatBRL(subtotalCents)}</dd></div><div className="flex justify-between font-semibold text-emerald-700"><dt>Desconto</dt><dd>− {formatBRL(value.discountCents)}</dd></div><div className="flex justify-between border-t border-zinc-200 pt-2 font-black text-zinc-900"><dt>Total</dt><dd>{formatBRL(value.amountCents)}</dd></div></dl>}
    </>}
  </div>
}
