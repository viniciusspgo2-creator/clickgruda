'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Eye, Fingerprint, MousePointerClick, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Range = 'today' | '7d' | '30d' | 'custom'
type AnalyticsData = {
  range: Range
  start: string
  end: string
  views: number
  uniqueVisitors: number
  clicks: number
  faq: number
  clickRate: number
  trend: { day: string; views: number; uniqueVisitors: number; clicks: number }[]
  topClicks: { location: string; count: number }[]
  browserExcluded: boolean
  ignoredIps: string[]
  currentIp: string | null
}

const periods: { value: Range; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'custom', label: 'Personalizado' },
]
const dateBR = (s: string) => s.slice(8, 10) + '/' + s.slice(5, 7)
const money = (n: number | undefined) => n === undefined ? '—' : n.toLocaleString('pt-BR')

export function LandingAnalyticsPanel() {
  const qc = useQueryClient()
  const [range, setRange] = useState<Range>('30d')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [ipText, setIpText] = useState<string | null>(null)
  const ready = range !== 'custom' || Boolean(start && end && start <= end)
  const analyticsQ = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', range, start, end],
    enabled: ready,
    queryFn: async () => {
      const p = new URLSearchParams({ range })
      if (range === 'custom') { p.set('start', start); p.set('end', end) }
      const res = await fetch(`/api/admin/analytics?${p.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Não foi possível consultar as métricas.')
      return res.json()
    },
    staleTime: 30_000,
  })
  const analytics = analyticsQ.data
  const ipValue = ipText ?? analytics?.ignoredIps.join('\n') ?? ''
  const save = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/admin/analytics/ignore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Não foi possível salvar.')
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-analytics'] })
      toast.success('Preferências de visitas atualizadas.')
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'Falha ao salvar.'),
  })

  const toggleBrowser = () => {
    if (!analytics) return
    let visitorId = window.localStorage.getItem('cg-anon-visitor')
    if (!visitorId) {
      visitorId = window.crypto.randomUUID()
      window.localStorage.setItem('cg-anon-visitor', visitorId)
    }
    const enabled = !analytics.browserExcluded
    save.mutate({ action: 'browser', enabled, visitorId }, {
      onSuccess: () => {
        if (enabled) window.localStorage.setItem('cg-analytics-opt-out', '1')
        else window.localStorage.removeItem('cg-analytics-opt-out')
      },
    })
  }

  const saveIps = () => {
    const ips = ipValue.split(/[\n,;]+/).map(v => v.trim()).filter(Boolean)
    save.mutate({ action: 'ips', ips }, { onSuccess: () => setIpText(null) })
  }

  const cards = [
    { label: 'Total de visitas', value: analytics?.views, icon: Eye, helper: 'Aberturas registradas da landing' },
    { label: 'Visitantes únicos', value: analytics?.uniqueVisitors, icon: Users, helper: 'Navegadores distintos estimados' },
    { label: 'Cliques nos CTAs', value: analytics?.clicks, icon: MousePointerClick, helper: 'Interações nos botões rastreados' },
    { label: 'Cliques por visita', value: analytics ? `${analytics.clickRate.toLocaleString('pt-BR')}%` : '—', icon: TrendingUp, helper: 'Cliques ÷ visitas, não vendas' },
  ]

  return (
    <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Analytics da landing page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black text-zinc-900"><TrendingUp className="h-5 w-5 text-orange-500"/> Estatísticas da landing</h3>
          <p className="mt-1 text-xs text-zinc-500">Acompanhe o interesse real do público, sem inflar suas próprias visitas.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-xl bg-zinc-100 p-1">
          {periods.map(p => <button key={p.value} type="button" onClick={() => setRange(p.value)} aria-pressed={range === p.value}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${range === p.value ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-600 hover:bg-white/70'}`}>{p.label}</button>)}
        </div>
      </div>

      {range === 'custom' && <div className="flex flex-wrap items-end gap-2 rounded-xl bg-zinc-50 p-3">
        <label className="text-xs font-bold text-zinc-600">De <Input type="date" value={start} max={end || undefined} onChange={e => setStart(e.target.value)} className="mt-1 bg-white" /></label>
        <label className="text-xs font-bold text-zinc-600">Até <Input type="date" value={end} min={start || undefined} onChange={e => setEnd(e.target.value)} className="mt-1 bg-white" /></label>
        <p className="pb-2 text-xs text-zinc-400">Máximo de 366 dias. Datas no horário de Brasília.</p>
      </div>}

      {analyticsQ.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{analyticsQ.error instanceof Error ? analyticsQ.error.message : 'Erro ao carregar estatísticas.'}</p>}
      {range === 'custom' && !ready && <p className="text-xs text-zinc-500">Selecione a data inicial e final para visualizar o relatório.</p>}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(c => <div key={c.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
          <div className="flex items-center gap-2"><c.icon className="h-4 w-4 text-orange-500"/><span className="text-xs font-semibold text-zinc-600">{c.label}</span></div>
          <p className="mt-2 text-2xl font-black text-zinc-900 sm:text-3xl">{analyticsQ.isLoading ? '…' : typeof c.value === 'number' ? money(c.value) : (c.value ?? '—')}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{c.helper}</p>
        </div>)}
      </div>

      <div className="rounded-xl border border-zinc-200 p-3 sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-extrabold text-zinc-800">Evolução de visitas e interações</h4>
          <span className="text-xs text-zinc-400">{analytics ? `${dateBR(analytics.start)} a ${dateBR(analytics.end)}` : 'Visão do período'}</span>
        </div>
        {analytics?.trend?.length ? <div className="h-64 w-full" role="img" aria-label="Gráfico de visitas, visitantes únicos diários e cliques por dia">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.trend} margin={{ top: 8, right: 12, left: -18, bottom: 6 }}>
              <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="4 4" />
              <XAxis dataKey="day" tickFormatter={dateBR} minTickGap={22} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip labelFormatter={v => typeof v === 'string' ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : String(v)} formatter={v => typeof v === 'number' ? v.toLocaleString('pt-BR') : String(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" name="Visitas" dataKey="views" stroke="#f97316" strokeWidth={2.5} dot={analytics.trend.length <= 7} isAnimationActive={false}/>
              <Line type="monotone" name="Únicos por dia" dataKey="uniqueVisitors" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false}/>
              <Line type="monotone" name="Cliques" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div> : <p className="py-14 text-center text-xs text-zinc-500">Não há dados nesse período.</p>}
      </div>

      <div className="flex flex-wrap items-start gap-2 text-xs text-zinc-500"><span className="font-bold text-zinc-700">Botões mais clicados:</span>{analytics?.topClicks?.length ? analytics.topClicks.map(item => <span key={item.location} className="rounded-lg bg-orange-50 px-2 py-1 font-semibold text-orange-700">{item.location}: {money(item.count)}</span>) : 'Ainda não há cliques registrados.'}</div>

      <div className="space-y-3 rounded-xl border border-orange-200 bg-orange-50/50 p-4">
        <h4 className="flex items-center gap-2 text-sm font-black text-zinc-900"><ShieldCheck className="h-4 w-4 text-orange-500" /> Excluir minhas visitas</h4>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="max-w-xl"><p className="text-sm font-semibold text-zinc-800">Não contabilizar este navegador</p><p className="text-xs text-zinc-600">Funciona também quando você sair do Admin. Administradores logados já são ignorados automaticamente. Pode repetir em outros navegadores.</p></div>
          <Button size="sm" disabled={save.isPending || !analytics} onClick={toggleBrowser} variant={analytics?.browserExcluded ? 'outline' : 'default'} className={analytics?.browserExcluded ? 'border-orange-300 text-orange-700' : 'bg-orange-500 text-white hover:bg-orange-600'}>
            <Fingerprint className="mr-2 h-4 w-4"/>{analytics?.browserExcluded ? 'Desativar exclusão' : 'Excluir este navegador'}
          </Button>
        </div>
        {analytics?.browserExcluded && <p className="text-xs font-bold text-emerald-700">Ativo: as visitas deste navegador não entram no painel.</p>}
        <div className="border-t border-orange-200 pt-3">
          <label htmlFor="analytics-ip-list" className="block text-sm font-semibold text-zinc-800">IPs para ignorar (opcional)</label>
          <p className="mt-1 text-xs text-zinc-600">Um IP por linha. Útil para o escritório, mas o IP pode mudar. {analytics?.currentIp ? `IP detectado nesta conexão: ${analytics.currentIp}.` : 'Não foi possível identificar seu IP nesta conexão.'}</p>
          <textarea id="analytics-ip-list" rows={2} placeholder="Ex.: 203.0.113.10" value={ipValue} onChange={e => setIpText(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-800 outline-none focus:border-orange-400" />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={save.isPending || !analytics} onClick={saveIps}>Salvar IPs ignorados</Button>
            {analytics?.currentIp && <button type="button" className="text-xs font-bold text-orange-700 underline" onClick={() => setIpText([...ipValue.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean), analytics.currentIp!].filter((s, i, arr) => arr.indexOf(s) === i).join('\n'))}>Adicionar meu IP</button>}
          </div>
        </div>
      </div>
      <p className="text-[11px] leading-relaxed text-zinc-500">Dados coletados desde a ativação do contador. Visitantes únicos são estimativas por navegador, não pessoas; bloqueadores e trocas de navegador podem alterar a contagem. Os totais do gráfico são por dia; somar os únicos diários não corresponde necessariamente aos únicos de todo o período. A exclusão de IP vale para eventos futuros. Desativar a exclusão deste navegador volta a considerar também seu histórico anterior. Este controle afeta as métricas internas, não as configurações do Google Analytics.</p>
    </section>
  )
}
