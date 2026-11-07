'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'

export function CaktoReconciliationDialog({ purchaseId, email, reference }: { purchaseId: string; email: string; reference: string | null }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false), [amount, setAmount] = useState(''), [date, setDate] = useState(''), [evidence, setEvidence] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function save() {
    const clean = amount.trim().replace(',', '.')
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(clean) || !date || !confirmed) { setError('Confira o valor recebido, a data e a confirmação.'); return }
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/admin/payments/cakto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purchaseId, amountCents: Math.round(Number(clean) * 100), paidAt: new Date(date + 'T00:00:00-03:00').toISOString(), evidence, confirmedCakto: true }) })
      const d = await r.json()
      if (!r.ok) throw Error(d.error || 'Não foi possível conciliar.')
      for (const key of ['admin-stats', 'admin-payments', 'admin-cakto-audit']) qc.invalidateQueries({ queryKey: [key] })
      toast.success(d.duplicate ? 'Esta compra já estava conciliada.' : 'Valor Cakto conciliado no faturamento.')
      setOpen(false)
    } catch (e) { setError(e instanceof Error ? e.message : 'Sem conexão. Tente novamente.') }
    finally { setBusy(false) }
  }
  return <>
    <Button size="sm" variant="outline" onClick={() => { setAmount(''); setDate(''); setEvidence(''); setConfirmed(false); setError(''); setOpen(true) }}>Conferir valor Cakto</Button>
    <Dialog open={open} onOpenChange={v => { if (!busy) setOpen(v) }}><DialogContent className="max-h-[90dvh] overflow-y-auto bg-white text-zinc-900"><DialogHeader><DialogTitle>Conciliar valor da compra Cakto</DialogTitle><DialogDescription>Esta compra já foi aprovada pela Cakto, mas o valor não foi salvo na integração antiga. Confira o pedido no painel Cakto e informe os dados reais em reais (BRL). A conta do cliente mantém suas permissões.</DialogDescription></DialogHeader>
      <p className="rounded-lg bg-zinc-100 p-3 text-sm break-all">{email}<br />Pedido: {reference}</p>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); save() }}>
        <div><Label htmlFor="cakto-amount">Valor cobrado (R$)</Label><Input id="cakto-amount" required inputMode="decimal" value={amount} disabled={busy} onChange={e => setAmount(e.target.value)} /></div>
        <div><Label htmlFor="cakto-date">Data do pagamento</Label><Input id="cakto-date" type="date" required value={date} disabled={busy} onChange={e => setDate(e.target.value)} /></div>
        <div><Label htmlFor="cakto-evidence">Referência do comprovante conferido</Label><Input id="cakto-evidence" required minLength={5} maxLength={300} value={evidence} disabled={busy} onChange={e => setEvidence(e.target.value)} /></div>
        <label className="flex gap-3 text-sm"><input type="checkbox" required checked={confirmed} disabled={busy} onChange={e => setConfirmed(e.target.checked)} /><span>Conferi este pedido na Cakto e confirmo o valor e a data recebidos em BRL.</span></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Confirmando…' : 'Confirmar conciliação'}</Button>
      </form>
    </DialogContent></Dialog>
  </>
}
