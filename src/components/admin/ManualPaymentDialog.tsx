'use client'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatBRL } from '@/lib/types'
import { toast } from 'sonner'
type Customer = {
  id: string
  name: string
  email?: string
  hasAccess?: boolean
  status?: string
}
const methods = {
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência',
  CASH: 'Dinheiro',
  CARD: 'Cartão fora da Cakto',
  OTHER: 'Outro',
}
export function ManualPaymentDialog({ user }: { user?: Customer }) {
  const qc = useQueryClient(),
    [open, setOpen] = useState(false),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState<Customer | null>(user ?? null)
  const [amount, setAmount] = useState(''),
    [paidAt, setPaidAt] = useState(''),
    [method, setMethod] = useState('PIX'),
    [reference, setReference] = useState(''),
    [note, setNote] = useState(''),
    [activate, setActivate] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [requestId, setRequestId] = useState('')
  const customers = useQuery<{ users: Customer[] }>({
    queryKey: ['manual-payment-customers', search],
    enabled: open && !user,
    queryFn: async () => {
      const r = await fetch(
        '/api/admin/payments/manual?q=' + encodeURIComponent(search),
      )
      if (!r.ok) throw Error('Não foi possível buscar os clientes.')
      return r.json()
    },
  })
  function start() {
    setSelected(user ?? null)
    setSearch('')
    setAmount('')
    setPaidAt(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
      }).format(new Date()),
    )
    setMethod('PIX')
    setReference('')
    setNote('')
    setActivate(false)
    setConfirmed(false)
    setError('')
    setRequestId(crypto.randomUUID())
    setOpen(true)
  }
  async function save() {
    setError('')
    const clean = amount.trim().replace(',', '.')
    if (
      !/^\d{1,7}(\.\d{1,2})?$/.test(clean) ||
      !selected ||
      !paidAt ||
      !confirmed
    ) {
      setError(
        'Selecione o cliente e confira valor, data e confirmação do recebimento.',
      )
      return
    }
    const amountCents = Math.round(Number(clean) * 100)
    if (amountCents < 1 || amountCents > 100_000_000) {
      setError('Informe um valor entre R$ 0,01 e R$ 1.000.000,00.')
      return
    }
    setBusy(true)
    try {
      const r = await fetch('/api/admin/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          userId: selected.id,
          amountCents,
          paidAt: new Date(paidAt + 'T00:00:00-03:00').toISOString(),
          method,
          reference,
          note,
          activateAccess: activate,
          confirmedOutsideGateway: confirmed,
        }),
      })
      const d = await r.json()
      if (!r.ok)
        throw Error(
          d.error ||
            'Não foi possível registrar. Tente novamente com os mesmos dados.',
        )
      for (const key of [
        'admin-payments',
        'admin-stats',
        'admin-users',
        'catalog',
        'auth-me',
      ])
        qc.invalidateQueries({ queryKey: [key] })
      toast.success(
        d.duplicate
          ? 'Este pagamento já estava registrado.'
          : `${formatBRL(amountCents)} registrado no faturamento.`,
      )
      setOpen(false)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Sem conexão. Tente novamente com os mesmos dados.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-9 rounded-lg font-bold"
        onClick={start}
      >
        <Receipt className="mr-1.5 h-4 w-4" />
        Registrar pagamento
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v)
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white text-zinc-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar pagamento recebido</DialogTitle>
            <DialogDescription>
              Para recebimentos fora dos gateways. O valor aprovado entra na
              receita total. Liberar acesso por cortesia continua disponível em
              Usuários.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
            className="space-y-4"
          >
            {user ? (
              <p className="rounded-xl bg-zinc-100 p-3 text-sm">
                <b>{user.name}</b>
                <span className="block text-zinc-600">{user.email}</span>
              </p>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="receipt-search">
                  Buscar cliente pelo nome ou e-mail
                </Label>
                <Input
                  id="receipt-search"
                  value={search}
                  disabled={busy}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Label htmlFor="receipt-user">Cliente</Label>
                <select
                  id="receipt-user"
                  required
                  disabled={busy || customers.isLoading}
                  className="h-11 w-full rounded-lg border bg-white px-2 text-sm"
                  value={selected?.id || ''}
                  onChange={(e) =>
                    setSelected(
                      customers.data?.users.find(
                        (u) => u.id === e.target.value,
                      ) ?? null,
                    )
                  }
                >
                  <option value="">Selecione o cliente</option>
                  {selected &&
                    !customers.data?.users.some(
                      (u) => u.id === selected.id,
                    ) && (
                      <option value={selected.id}>
                        {selected.name} · {selected.email}
                      </option>
                    )}
                  {customers.data?.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.email}
                    </option>
                  ))}
                </select>
                {customers.isError && (
                  <p role="alert" className="text-sm text-red-700">
                    Não foi possível buscar clientes. Tente novamente.
                  </p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="receipt-amount">Valor recebido (R$)</Label>
                <Input
                  id="receipt-amount"
                  inputMode="decimal"
                  placeholder="47,90"
                  required
                  disabled={busy}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="receipt-date">Data do recebimento</Label>
                <Input
                  id="receipt-date"
                  type="date"
                  required
                  disabled={busy}
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-method">Forma de pagamento</Label>
              <select
                id="receipt-method"
                disabled={busy}
                className="h-11 w-full rounded-lg border bg-white px-2 text-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {Object.entries(methods).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-reference">
                Identificador do comprovante
              </Label>
              <Input
                id="receipt-reference"
                minLength={3}
                maxLength={100}
                required
                disabled={busy}
                placeholder="Ex.: ID da transferência ou recibo interno único"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-note">Observação (opcional)</Label>
              <Input
                id="receipt-note"
                maxLength={500}
                disabled={busy}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                disabled={busy || selected?.status === 'BLOCKED'}
                checked={activate}
                onChange={(e) => setActivate(e.target.checked)}
                className="mt-1"
              />
              <span>
                Também liberar o acesso completo deste cliente
                {selected?.status === 'BLOCKED' && (
                  <span className="block text-red-700">
                    Conta bloqueada; analise as permissões antes de liberar.
                  </span>
                )}
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm">
              <input
                type="checkbox"
                required
                disabled={busy}
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1"
              />
              <span>
                Conferi o recebimento e confirmo que este valor não foi
                registrado pela Cakto ou por outro gateway.
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Confirmando…' : 'Confirmar pagamento recebido'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function VoidManualPaymentDialog({ paymentId }: { paymentId: string }) {
  const qc = useQueryClient(),
    [open, setOpen] = useState(false),
    [reason, setReason] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  async function save() {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/admin/payments/manual/' + paymentId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const d = await r.json()
      if (!r.ok) throw Error(d.error)
      for (const key of ['admin-stats', 'admin-payments'])
        qc.invalidateQueries({ queryKey: [key] })
      toast.success('Lançamento anulado. Histórico preservado.')
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Tente novamente.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setReason('')
          setError('')
          setOpen(true)
        }}
      >
        Anular lançamento
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!busy) setOpen(v)
        }}
      >
        <DialogContent className="bg-white text-zinc-900">
          <DialogHeader>
            <DialogTitle>Anular lançamento manual</DialogTitle>
            <DialogDescription>
              O valor será retirado da receita total e a correção ficará
              registrada. As permissões da conta continuam sendo gerenciadas em
              Usuários.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="void-reason">Motivo da correção</Label>
          <Input
            id="void-reason"
            value={reason}
            minLength={5}
            maxLength={500}
            disabled={busy}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button onClick={save} disabled={busy || reason.trim().length < 5}>
            {busy ? 'Confirmando…' : 'Confirmar anulação'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
