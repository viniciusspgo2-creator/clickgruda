'use client'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Loader2, Plus, RefreshCw, TicketPercent } from 'lucide-react'
import { toast } from 'sonner'
import { formatBRL } from '@/lib/types'
import type { Coupon } from '@/lib/coupons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type CouponRow = Coupon & { uses: number; discountsCents: number }
export function AdminCouponsSection() {
  const qc = useQueryClient()
  const [code, setCode] = useState('')
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
  const [amount, setAmount] = useState('10')
  const [expiresAt, setExpiresAt] = useState('')
  const [minimum, setMinimum] = useState('')
  const query = useQuery<{ coupons: CouponRow[] }>({ queryKey: ['admin-coupons'], queryFn: async () => { const r = await fetch('/api/admin/coupons'); if (!r.ok) throw new Error('Não foi possível carregar os cupons.'); return r.json() } })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-coupons'] })
  const create = useMutation({
    mutationFn: async () => {
      const value = Number(amount.replace(',', '.')) * (type === 'FIXED' ? 100 : 1)
      const r = await fetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, type, value: type === 'FIXED' ? Math.round(value) : value, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null, minSubtotalCents: Math.round(Number(minimum.replace(',', '.') || 0) * 100) }) })
      const data = await r.json(); if (!r.ok) throw new Error(data.error); return data
    },
    onSuccess: data => { toast.success(`Cupom ${data.coupon.code} criado.`); setCode(''); refresh() },
    onError: (e: Error) => toast.error(e.message || 'Confira os dados do cupom.'),
  })
  const toggle = useMutation({ mutationFn: async (coupon: CouponRow) => {
    const r = await fetch(`/api/admin/coupons/${encodeURIComponent(coupon.code)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !coupon.active }) })
    const data = await r.json(); if (!r.ok) throw new Error(data.error)
  }, onSuccess: () => { refresh(); toast.success('Status do cupom atualizado.') }, onError: (e: Error) => toast.error(e.message) })
  const generate = () => setCode(`CG-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`)
  return <div className="max-w-6xl space-y-6">
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-6"><h2 className="flex items-center gap-2 text-xl font-black text-zinc-950"><TicketPercent className="h-6 w-6 text-orange-600" /> Cupons de desconto</h2><p className="mt-2 text-sm leading-relaxed text-zinc-600">Crie códigos para suas campanhas. O cliente aplica no checkout e o PIX é gerado com o valor final do desconto.</p></section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h3 className="text-base font-black text-zinc-900">Criar um cupom</h3>
      <form className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" onSubmit={e => { e.preventDefault(); create.mutate() }}>
        <div className="space-y-2 sm:col-span-2 lg:col-span-1"><Label htmlFor="coupon-code">Código</Label><div className="flex gap-2"><Input id="coupon-code" value={code} maxLength={32} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex.: BEMVINDO10" className="min-w-0 font-mono" /><Button type="button" variant="outline" onClick={generate} aria-label="Gerar código aleatório"><RefreshCw className="h-4 w-4" /></Button></div><p className="text-xs text-zinc-500">Deixe vazio para gerar automaticamente.</p></div>
        <div className="space-y-2"><Label htmlFor="coupon-type">Tipo de desconto</Label><select id="coupon-type" value={type} onChange={e => setType(e.target.value as typeof type)} className="h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"><option value="PERCENT">Porcentagem (%)</option><option value="FIXED">Valor em reais (R$)</option></select></div>
        <div className="space-y-2"><Label htmlFor="coupon-amount">Desconto {type === 'PERCENT' ? '(%)' : '(R$)'}</Label><Input id="coupon-amount" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" required /></div>
        <div className="space-y-2"><Label htmlFor="coupon-expires">Validade (opcional)</Label><Input id="coupon-expires" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="coupon-minimum">Compra mínima em R$ (opcional)</Label><Input id="coupon-minimum" value={minimum} onChange={e => setMinimum(e.target.value)} inputMode="decimal" placeholder="Sem mínimo" /></div>
        <div className="flex items-end"><Button type="submit" disabled={create.isPending} className="h-10 w-full bg-orange-600 font-bold text-white">{create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Criar cupom</Button></div>
      </form><p className="mt-4 text-xs leading-relaxed text-zinc-500">Cupons não são cumulativos. O valor final precisa ser de pelo menos R$ 1,00. As utilizações abaixo contam apenas pagamentos aprovados; não há limite de utilizações por código nesta versão.</p>
    </section>
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <h3 className="border-b border-zinc-100 p-5 text-base font-black text-zinc-900">Seus cupons</h3>
      {query.isError ? <p className="p-5 text-sm text-red-600">{query.error.message}</p> : query.isLoading ? <p className="p-5 text-sm text-zinc-500">Carregando cupons…</p> : !query.data?.coupons.length ? <p className="p-6 text-sm text-zinc-500">Você ainda não criou um cupom. Use o formulário acima para começar.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-zinc-50 text-xs text-zinc-500"><tr>{['Código', 'Desconto', 'Validade', 'Compras aprovadas', 'Status', 'Ação'].map(label => <th key={label} className="px-5 py-3">{label}</th>)}</tr></thead><tbody>{query.data.coupons.map(coupon => {
        const expired = coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()
        return <tr key={coupon.code} className="border-t border-zinc-100"><td className="px-5 py-4 font-mono font-bold">{coupon.code}<button className="ml-2 text-zinc-400" aria-label={`Copiar cupom ${coupon.code}`} onClick={async () => { try { await navigator.clipboard.writeText(coupon.code); toast.success('Cupom copiado.') } catch { toast.error('Copie o código exibido.') } }}><Copy className="h-3.5 w-3.5" /></button></td><td className="px-5 py-4">{coupon.type === 'PERCENT' ? `${coupon.value}%` : formatBRL(coupon.value)}</td><td className="px-5 py-4 text-xs">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString('pt-BR') : 'Sem vencimento'}</td><td className="px-5 py-4">{coupon.uses}<span className="mt-1 block text-xs text-zinc-500">{formatBRL(coupon.discountsCents)} em descontos</span></td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${!coupon.active || expired ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-50 text-emerald-700'}`}>{!coupon.active ? 'Desativado' : expired ? 'Expirado' : 'Ativo'}</span></td><td className="px-5 py-4"><button disabled={toggle.isPending} onClick={() => toggle.mutate(coupon)} className="text-xs font-bold text-orange-700 disabled:opacity-40">{coupon.active ? 'Desativar' : 'Ativar'}</button></td></tr>
      })}</tbody></table></div>}
    </section>
  </div>
}
