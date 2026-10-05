'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileDown,
  Loader2,
  MessageCircle,
  MonitorSmartphone,
  Save,
  SearchX,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

async function copyText(text: string, okMsg: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(okMsg)
  } catch {
    toast.error('Não consegui copiar. Selecione o texto e copie manualmente.')
  }
}

/* ============================================================
 * BUSCAS SEM RESULTADO — fila de temas para criar
 * ============================================================ */

type Miss = { id: string; query: string; count: number; users: number; status: string; lastAt: string }

export function AdminSearchMissesSection() {
  const queryClient = useQueryClient()
  const [showDone, setShowDone] = useState(false)
  const missQ = useQuery<{ misses: Miss[] }>({
    queryKey: ['admin-search-misses'],
    queryFn: async () => (await fetch('/api/admin/search-misses')).json(),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-search-misses'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'NEW' | 'DONE' }) => {
      const res = await fetch(`/api/admin/search-misses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: refresh,
    onError: () => toast.error('Não foi possível atualizar.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/search-misses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    },
    onSuccess: refresh,
    onError: () => toast.error('Não foi possível excluir.'),
  })

  const all = missQ.data?.misses ?? []
  const pending = all.filter((m) => m.status !== 'DONE')
  const done = all.filter((m) => m.status === 'DONE')
  const list = showDone ? done : pending

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
            <SearchX className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-zinc-900">O que os membros procuram e ainda não existe</p>
            <p className="text-xs text-zinc-500">
              Toda busca do portal que volta sem nenhuma arte entra aqui. Os temas mais pedidos (mais pessoas diferentes) ficam no topo — é a sua fila de criação.
            </p>
          </div>
        </div>
        {pending.length > 0 && (
          <Button
            variant="outline"
            onClick={() => copyText(pending.slice(0, 30).map((m, i) => `${i + 1}. ${m.query} (${m.users} ${m.users === 1 ? 'pessoa' : 'pessoas'})`).join('\n'), 'Lista copiada!')}
            className="h-10 shrink-0 rounded-xl border-orange-300 font-black text-orange-600 hover:bg-orange-50"
          >
            <Copy className="mr-1.5 h-4 w-4" /> Copiar os 30 mais pedidos
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowDone(false)}
          className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', !showDone ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200')}
        >
          Para criar ({pending.length})
        </button>
        <button
          onClick={() => setShowDone(true)}
          className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', showDone ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200')}
        >
          Já atendidas ({done.length})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {missQ.isLoading && <div className="p-6 text-sm text-zinc-400">Carregando...</div>}
        <div className="divide-y divide-zinc-100">
          {list.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3.5 hover:bg-zinc-50">
              <div className="flex h-10 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-orange-50">
                <span className="text-base font-black leading-none text-orange-600">{m.users}</span>
                <span className="text-[9px] font-bold uppercase text-orange-400">{m.users === 1 ? 'pessoa' : 'pessoas'}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900">{m.query}</p>
                <p className="text-xs text-zinc-400">
                  {m.count} {m.count === 1 ? 'busca' : 'buscas'} · última em {fmtDate(m.lastAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {m.status === 'DONE' ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus.mutate({ id: m.id, status: 'NEW' })} className="h-8 rounded-lg text-xs font-bold">
                    Reabrir
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ id: m.id, status: 'DONE' })}
                    className="h-8 rounded-lg bg-emerald-500 text-xs font-bold hover:bg-emerald-600"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Atendida
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove.mutate(m.id)}
                  aria-label="Excluir"
                  className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!missQ.isLoading && list.length === 0 && (
            <div className="p-10 text-center text-sm text-zinc-400">
              {showDone ? 'Nenhuma busca marcada como atendida ainda.' : 'Nenhuma busca sem resultado até agora. Quando alguém procurar algo que não existe, aparece aqui.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * LISTA DE ESPERA — Catálogo Digital
 * ============================================================ */

type WaitEntry = { id: string; name: string; email: string; whatsapp: string; notifiedAt: string | null; createdAt: string }

const DEFAULT_LAUNCH_MESSAGE =
  'Olá, {nome}! O Catálogo Digital da Click & Gruda acabou de ser lançado 🎉 Como você está na lista de espera, o seu preço de membro de R$ 78/ano está garantido. Quer ativar agora?'

export function AdminWaitlistSection() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState(DEFAULT_LAUNCH_MESSAGE)
  const [onlyPending, setOnlyPending] = useState(false)
  const waitQ = useQuery<{ entries: WaitEntry[] }>({
    queryKey: ['admin-waitlist'],
    queryFn: async () => (await fetch('/api/admin/waitlist')).json(),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-waitlist'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const mark = useMutation({
    mutationFn: async ({ ids, notified }: { ids: string[]; notified: boolean }) => {
      const res = await fetch('/api/admin/waitlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, notified }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: refresh,
    onError: () => toast.error('Não foi possível atualizar.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/waitlist?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    },
    onSuccess: refresh,
    onError: () => toast.error('Não foi possível remover.'),
  })

  const all = waitQ.data?.entries ?? []
  const pending = all.filter((e) => !e.notifiedAt)
  const list = onlyPending ? pending : all

  const waLink = (e: WaitEntry) => {
    const phone = e.whatsapp.startsWith('55') ? e.whatsapp : `55${e.whatsapp}`
    return `https://wa.me/${phone}?text=${encodeURIComponent(message.replaceAll('{nome}', e.name.split(' ')[0]))}`
  }

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`
    const rows = [['Nome', 'E-mail', 'WhatsApp', 'Entrou em', 'Avisado'], ...all.map((e) => [e.name, e.email, e.whatsapp, fmtDate(e.createdAt), e.notifiedAt ? 'Sim' : 'Não'])]
    const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(';')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'lista-de-espera-catalogo-digital.csv'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Na lista', all.length, 'bg-orange-50 text-orange-600'],
          ['Ainda não avisados', pending.length, 'bg-amber-50 text-amber-600'],
          ['Já avisados', all.length - pending.length, 'bg-emerald-50 text-emerald-600'],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-zinc-400">{label}</p>
            <p className={cn('mt-1 inline-block rounded-lg px-2.5 py-0.5 text-2xl font-black', cls as string)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <Label className="text-xs font-black uppercase tracking-wide text-zinc-500">
          Mensagem de lançamento <span className="font-medium normal-case text-zinc-400">— use {'{nome}'} para o primeiro nome</span>
        </Label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!pending.length}
            onClick={() => copyText(pending.map((e) => e.email).join(', '), `${pending.length} e-mails copiados!`)}
            className="h-9 rounded-xl text-xs font-bold"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar e-mails de quem falta avisar
          </Button>
          <Button variant="outline" disabled={!all.length} onClick={exportCsv} className="h-9 rounded-xl text-xs font-bold">
            <FileDown className="mr-1.5 h-3.5 w-3.5" /> Exportar CSV
          </Button>
          <Button
            disabled={!pending.length || mark.isPending}
            onClick={() => mark.mutate({ ids: pending.map((e) => e.id), notified: true })}
            className="h-9 rounded-xl bg-emerald-500 text-xs font-bold hover:bg-emerald-600"
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Marcar todos como avisados
          </Button>
        </div>
        <p className="text-[11px] text-zinc-400">
          O sistema ainda não envia e-mail automático: copie os e-mails para a sua ferramenta de envio, ou use o botão de WhatsApp de cada pessoa (a mensagem acima já vai pronta).
        </p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setOnlyPending(false)} className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', !onlyPending ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200')}>
          Todos ({all.length})
        </button>
        <button onClick={() => setOnlyPending(true)} className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', onlyPending ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200')}>
          Falta avisar ({pending.length})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {waitQ.isLoading && <div className="p-6 text-sm text-zinc-400">Carregando...</div>}
        <div className="divide-y divide-zinc-100">
          {list.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 p-3.5 hover:bg-zinc-50">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-bold text-zinc-900">
                  {e.name}
                  {e.notifiedAt && <Badge className="bg-emerald-100 text-[9px] font-black uppercase text-emerald-700">Avisado</Badge>}
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {e.email} · {e.whatsapp} · entrou em {fmtDate(e.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={waLink(e)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-600"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <Button variant="outline" size="sm" onClick={() => mark.mutate({ ids: [e.id], notified: !e.notifiedAt })} className="h-8 rounded-lg text-xs font-bold">
                  {e.notifiedAt ? 'Desmarcar' : 'Marcar avisado'}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)} aria-label="Remover da lista" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!waitQ.isLoading && list.length === 0 && (
            <div className="flex flex-col items-center p-10 text-center text-sm text-zinc-400">
              <ClipboardList className="mb-2 h-8 w-8 text-zinc-300" />
              Ninguém na lista ainda. O cadastro fica na caixa do Catálogo Digital, dentro do portal.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================================================
 * SEGURANÇA — limite de aparelhos + alertas de compartilhamento
 * ============================================================ */

type Device = { id: string; device: string; ip: string; lastSeenAt: string; createdAt: string }
type SecurityData = {
  settings: { max_devices: string; dl_daily_limit: string }
  alerts: {
    id: string
    type: 'DEVICES' | 'DOWNLOADS'
    detail: string
    resolved: boolean
    createdAt: string
    user: { id: string; name: string; email: string }
    devices: Device[]
  }[]
  multiDevice: { userId: string; name: string; email: string; devices: Device[] }[]
}

function DeviceList({ devices }: { devices: Device[] }) {
  if (!devices.length) return <p className="text-xs text-zinc-400">Nenhum aparelho ativo.</p>
  return (
    <ul className="space-y-1">
      {devices.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-x-3 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 font-bold text-zinc-700">
            <MonitorSmartphone className="h-3.5 w-3.5 text-orange-500" /> {d.device}
          </span>
          <span>IP {d.ip || '—'}</span>
          <span>visto {fmtDateTime(d.lastSeenAt)}</span>
        </li>
      ))}
    </ul>
  )
}

export function AdminSecuritySection() {
  const queryClient = useQueryClient()
  const secQ = useQuery<SecurityData>({
    queryKey: ['admin-security'],
    queryFn: async () => (await fetch('/api/admin/security')).json(),
  })
  const [form, setForm] = useState<SecurityData['settings'] | null>(null)
  const cfg = form ?? secQ.data?.settings

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-security'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: () => {
      toast.success('Regras de segurança salvas!')
      setForm(null)
      refresh()
    },
    onError: () => toast.error('Não foi possível salvar.'),
  })

  const resolve = useMutation({
    mutationFn: async ({ id, resolved }: { id: string; resolved: boolean }) => {
      const res = await fetch(`/api/admin/security/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      })
      if (!res.ok) throw new Error()
    },
    onSuccess: refresh,
    onError: () => toast.error('Não foi possível atualizar o alerta.'),
  })

  const revoke = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch('/api/admin/security/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error()
      return (await res.json()) as { revoked: number }
    },
    onSuccess: (d) => {
      toast.success(d.revoked ? `${d.revoked} aparelho(s) desconectado(s). A pessoa precisa entrar de novo.` : 'Nenhum aparelho ativo para desconectar.')
      refresh()
    },
    onError: () => toast.error('Não foi possível desconectar.'),
  })

  const alerts = secQ.data?.alerts ?? []
  const open = alerts.filter((a) => !a.resolved)
  const resolved = alerts.filter((a) => a.resolved)
  const multi = secQ.data?.multiDevice ?? []

  return (
    <div className="space-y-5">
      {/* Regras */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <p className="flex items-center gap-2 text-sm font-black text-zinc-900">
          <ShieldAlert className="h-4.5 w-4.5 text-orange-500" /> Regras de proteção
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          Cada login é um aparelho: passou do limite, o aparelho menos usado é desconectado. No limite diário de downloads, a pessoa vê um aviso amigável e volta no dia seguinte. Se ela bater o limite em 3+ dias da semana, abre um alerta aqui. Admin e conta demo ficam fora das regras. Use 0 para desligar uma regra.
        </p>
        {cfg && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(
              [
                ['max_devices', 'Aparelhos por conta', 'Padrão: 2 (ex.: celular + computador)'],
                ['dl_daily_limit', 'Downloads por dia (por conta)', 'Padrão: 500 · renova à meia-noite (Brasília) · 0 = sem limite'],
              ] as const
            ).map(([key, label, hint]) => (
              <div key={key} className="space-y-1">
                <Label className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{label}</Label>
                <Input
                  type="number"
                  min={0}
                  value={cfg[key]}
                  onChange={(e) => setForm({ ...cfg, [key]: e.target.value })}
                  className="h-10 rounded-xl"
                />
                <p className="text-[11px] text-zinc-400">{hint}</p>
              </div>
            ))}
          </div>
        )}
        <Button
          onClick={() => save.mutate()}
          disabled={!form || save.isPending}
          className="mt-4 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black"
        >
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar regras
        </Button>
      </div>

      {/* Alertas */}
      <div>
        <p className="mb-2 text-sm font-black text-zinc-900">
          Alertas abertos {open.length > 0 && <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">{open.length}</span>}
        </p>
        <div className="space-y-3">
          {open.map((a) => (
            <div key={a.id} className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-black text-zinc-900">
                    {a.user.name}
                    <Badge className={cn('text-[9px] font-black uppercase', a.type === 'DEVICES' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                      {a.type === 'DEVICES' ? 'Troca de aparelhos' : 'Uso pesado de downloads'}
                    </Badge>
                  </p>
                  <p className="text-xs text-zinc-400">{a.user.email} · {fmtDateTime(a.createdAt)}</p>
                  <p className="mt-1.5 text-sm text-zinc-600">{a.detail}</p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => revoke.mutate(a.user.id)}
                    disabled={revoke.isPending}
                    className="h-8 rounded-lg bg-red-500 text-xs font-bold hover:bg-red-600"
                  >
                    Desconectar tudo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: a.id, resolved: true })} className="h-8 rounded-lg text-xs font-bold">
                    Dispensar
                  </Button>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white p-3 ring-1 ring-zinc-100">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-zinc-400">Aparelhos ativos agora</p>
                <DeviceList devices={a.devices} />
              </div>
            </div>
          ))}
          {!secQ.isLoading && open.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-400">
              Nenhum alerta aberto. Quando um login for usado em aparelhos demais ou baixar em volume anormal, aparece aqui.
            </div>
          )}
        </div>
      </div>

      {/* Contas com vários aparelhos */}
      {multi.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-black text-zinc-900">
            <Users className="h-4 w-4 text-orange-500" /> Contas com mais de um aparelho ativo
          </p>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            {multi.map((m) => (
              <div key={m.userId} className="p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-zinc-900">
                    {m.name} <span className="font-normal text-zinc-400">· {m.email}</span>
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-black text-zinc-600">{m.devices.length} aparelhos</span>
                  </p>
                  <Button size="sm" variant="outline" onClick={() => revoke.mutate(m.userId)} className="h-7 rounded-lg text-[11px] font-bold">
                    Desconectar tudo
                  </Button>
                </div>
                <div className="mt-2">
                  <DeviceList devices={m.devices} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <details className="rounded-2xl border border-zinc-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-bold text-zinc-500">Alertas dispensados ({resolved.length})</summary>
          <div className="mt-3 divide-y divide-zinc-100">
            {resolved.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-2 text-xs text-zinc-500">
                <span className="min-w-0 truncate">
                  <b className="text-zinc-700">{a.user.name}</b> · {a.detail}
                </span>
                <Button size="sm" variant="ghost" onClick={() => resolve.mutate({ id: a.id, resolved: false })} className="h-7 shrink-0 text-[11px] font-bold">
                  Reabrir
                </Button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
