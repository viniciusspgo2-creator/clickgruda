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
  Wand2,
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
 * SEGURANÇA — sessões e acessos individuais
 * ============================================================ */

type Device = { id: string; device: string; ip: string; lastSeenAt: string; createdAt: string }
type SecurityData = {
  settings: { max_devices: string }
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
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-security'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

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
          Cada conta de cliente permite um dispositivo conectado por vez, mais os adicionais contratados e habilitados em Usuários → Gerenciar acesso. Ao exceder o limite, a sessão anterior é encerrada. Reincidências geram alertas para análise; o bloqueio da conta é decidido pela equipe.
        </p>
        <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-600"><strong className="text-zinc-900">Regra padrão: 1 dispositivo por vez.</strong><br />Adicionais de R$ 14,90 são habilitados individualmente no cadastro do cliente após a confirmação da contratação. Administradores e demonstrações têm regras próprias.</div>
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

/* ============================================================
 * MELHORIAS DE ARTE — artes enviadas p/ melhorar a qualidade
 * ============================================================ */

type EnhanceRequest = {
  id: string
  imageUrl: string
  fileName: string
  note: string
  status: string
  createdAt: string
  userName: string
  userEmail: string
}

export function AdminEnhanceSection() {
  const queryClient = useQueryClient()
  const [showDone, setShowDone] = useState(false)
  const reqQ = useQuery<{ requests: EnhanceRequest[] }>({
    queryKey: ['admin-enhance-requests'],
    queryFn: async () => (await fetch('/api/admin/enhance-requests')).json(),
  })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-enhance-requests'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'NEW' | 'DONE' }) => {
      const res = await fetch(`/api/admin/enhance-requests/${id}`, {
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
      const res = await fetch(`/api/admin/enhance-requests/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    },
    onSuccess: refresh,
    onError: () => toast.error('Não foi possível excluir.'),
  })

  const all = reqQ.data?.requests ?? []
  const pending = all.filter((r) => r.status !== 'DONE')
  const done = all.filter((r) => r.status === 'DONE')
  const list = showDone ? done : pending

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/60 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-orange-400">
            <Wand2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-zinc-900">Artes enviadas para melhorar a qualidade</p>
            <p className="text-xs text-zinc-500">
              Os assinantes mandam aqui as artes próprias que estão pixelizadas ou em baixa qualidade. Abra a imagem, melhore a qualidade e devolva para o assinante pelo contato dele.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setShowDone(false)}
          className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', !showDone ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200')}
        >
          Para melhorar ({pending.length})
        </button>
        <button
          onClick={() => setShowDone(true)}
          className={cn('rounded-full px-3.5 py-1.5 text-xs font-bold', showDone ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-500 ring-1 ring-zinc-200')}
        >
          Concluídas ({done.length})
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {reqQ.isLoading && <div className="p-6 text-sm text-zinc-400">Carregando...</div>}
        <div className="divide-y divide-zinc-100">
          {list.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 p-3.5 hover:bg-zinc-50">
              <a
                href={r.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir imagem em tamanho real"
                className="block h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100"
              >
                <img src={r.imageUrl} alt={r.fileName || 'Arte enviada'} className="h-full w-full object-contain" />
              </a>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-900">
                  {r.userName || 'Assinante'} <span className="font-normal text-zinc-400">· {r.userEmail}</span>
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {r.fileName || 'arquivo'} · {fmtDateTime(r.createdAt)}
                </p>
                {r.note && <p className="mt-1 rounded-lg bg-zinc-50 px-2 py-1 text-xs text-zinc-600">{r.note}</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs font-bold">
                  <a href={r.imageUrl} target="_blank" rel="noopener noreferrer">
                    Abrir imagem
                  </a>
                </Button>
                {r.status === 'DONE' ? (
                  <Button variant="outline" size="sm" onClick={() => setStatus.mutate({ id: r.id, status: 'NEW' })} className="h-8 rounded-lg text-xs font-bold">
                    Reabrir
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setStatus.mutate({ id: r.id, status: 'DONE' })}
                    className="h-8 rounded-lg bg-emerald-500 text-xs font-bold hover:bg-emerald-600"
                  >
                    <Check className="mr-1 h-3.5 w-3.5" /> Concluir
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => remove.mutate(r.id)}
                  aria-label="Excluir pedido"
                  className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {!reqQ.isLoading && list.length === 0 && (
            <div className="p-10 text-center text-sm text-zinc-400">
              {showDone ? 'Nenhum pedido marcado como concluído ainda.' : 'Nenhum pedido por enquanto. Quando um assinante enviar uma arte para melhorar, aparece aqui.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
