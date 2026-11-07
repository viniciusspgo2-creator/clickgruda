'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, ChevronDown, Copy, Download, ExternalLink, Layers3, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { STUDIO_URL, WHATSAPP, WHATSAPP_MESSAGES } from '@/lib/site'
import type { CatalogData } from '@/lib/types'

type Bonus = {
  state: string
  code: string | null
  entitlement?: string
  trialEndsAt?: string
  active?: boolean
  adminBlocked?: boolean
}
type Props = {
  userId: string
  isTrial: boolean
  quota: CatalogData['quota']
  quotaReady: boolean
  quotaError: boolean
  onRetryQuota: () => void
  onExplore: () => void
}

function deadline(value?: string) {
  const stamp = value ? Date.parse(value) : NaN
  return Number.isFinite(stamp) ? stamp : null
}
function dateBR(value?: string) {
  const stamp = deadline(value)
  return stamp == null ? 'Prazo indisponível' : new Date(stamp).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
  })
}
function remaining(stamp: number | null, now: number) {
  if (stamp == null) return null
  const minutes = Math.max(0, Math.ceil((stamp - now) / 60000))
  if (!minutes) return 'Prazo encerrado'
  const hours = Math.floor(minutes / 60), days = Math.floor(hours / 24)
  return days ? `${days}d ${hours % 24}h restantes` : `${hours}h ${minutes % 60}min restantes`
}

export function MemberAccessSummary({ userId, isTrial, quota, quotaReady, quotaError, onRetryQuota, onExplore }: Props) {
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const queryKey = ['studio-bonus', userId, isTrial] as const
  useEffect(() => {
    if (!isTrial && !quota?.expiresAt) return
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [isTrial, quota?.expiresAt])
  const query = useQuery<{ bonus: Bonus | null }>({
    queryKey,
    queryFn: async () => {
      const response = await fetch('/api/account/studio', { cache: 'no-store' })
      if (!response.ok) throw Error('Não foi possível consultar seu bônus.')
      const data = await response.json()
      return data
    },
    refetchInterval: 30000,
    staleTime: 15000,
    retry: 1,
  })
  const bonus = query.data?.bonus
  const bonusDeadline = bonus?.entitlement === 'TRIAL' ? deadline(bonus.trialEndsAt) : null
  const bonusExpired = bonusDeadline != null && bonusDeadline <= now
  const blocked = bonus?.state === 'blocked' || bonus?.entitlement === 'REVOKED' || bonus?.adminBlocked
  const bonusAvailable = bonus?.state === 'ready' && !blocked && !bonusExpired && bonus.active === true
  const libraryDeadline = deadline(quota?.expiresAt ?? undefined)
  const libraryExpired = Boolean(quota?.expired) || (libraryDeadline != null && libraryDeadline <= now)
  const ended = Boolean(quota?.exhausted) || libraryExpired
  const complete = quotaReady && !quotaError && !quota && !isTrial
  const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300 disabled:opacity-50'

  async function requestCode() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/account/studio', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'Não foi possível atualizar seu código.')
      qc.setQueryData(queryKey, data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Tente novamente.')
    } finally { setBusy(false) }
  }

  return <section id="member-access-summary" className="border-b border-white/10 bg-[#111b2b] px-4 py-5 text-white sm:px-7" aria-labelledby="member-access-title">
    <div className="mx-auto max-w-[1600px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-orange-300">Tudo começa na Biblioteca</p>
          <h2 tabIndex={-1} id="member-access-title" className="mt-1 text-lg font-extrabold">Resumo do seu acesso</h2>
        </div>
        {isTrial && <a href="/comprar" className={`${actionClass} bg-orange-500 text-white hover:bg-orange-400`}>Ativar acesso completo <ArrowRight size={16} aria-hidden="true" /></a>}
        {complete && <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200"><ShieldCheck size={15} aria-hidden="true" /> Acesso completo</span>}
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:p-5" aria-label="Seu acesso à Biblioteca">
          <h3 className="flex items-center gap-2 text-sm font-extrabold"><Download size={17} className="text-orange-300" aria-hidden="true" /> Biblioteca de artes</h3>
          {quotaError ? <div className="mt-3"><p role="alert" className="text-sm text-orange-100">Não foi possível consultar seu saldo.</p><button type="button" onClick={onRetryQuota} className={`${actionClass} mt-2 border border-white/15 text-white`}>Tentar novamente</button></div> : !quotaReady ? <p className="mt-3 text-sm text-slate-300">Consultando seus downloads…</p> : quota ? <>
            <p className="mt-3 text-2xl font-extrabold tabular-nums">{libraryExpired ? 0 : quota.remaining} <span className="text-sm font-medium text-slate-300">downloads restantes</span></p>
            <p className="mt-1 text-xs text-slate-300">{quota.used} de {quota.limit} downloads utilizados{isTrial ? ' no teste grátis' : ''}.</p>
            <progress className="mt-3 h-2 w-full overflow-hidden rounded-full accent-orange-400" value={Math.min(quota.used, quota.limit)} max={Math.max(1, quota.limit)} aria-label="Downloads utilizados" />
            {quota.expiresAt && <div className="mt-3 text-xs leading-6 text-slate-300"><p className="font-bold text-orange-200" aria-live="off">{remaining(deadline(quota.expiresAt), now)}</p><p>Disponíveis até {dateBR(quota.expiresAt)} (Brasília).</p></div>}
            {ended && <p role="status" className="mt-3 rounded-xl border border-orange-300/20 bg-orange-400/10 p-3 text-sm leading-6 text-orange-100">{libraryExpired ? 'O prazo para baixar as artes terminou.' : `Você utilizou os ${quota.limit} downloads disponíveis.`} {isTrial ? 'Ative o acesso completo para continuar baixando sem a cota do teste.' : 'Consulte o suporte para conferir as condições do seu acesso.'}</p>}
          </> : isTrial ? <p className="mt-3 text-sm text-slate-300">Não foi possível conferir o prazo do teste. Atualize a página para consultar seu saldo.</p> : <>
            <p className="mt-3 text-xl font-extrabold text-emerald-200">Downloads ilimitados</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Sua Biblioteca está liberada, sem a cota ou o prazo do teste grátis.</p>
          </>}
          <button type="button" onClick={onExplore} className={`${actionClass} mt-3 border border-white/15 text-white hover:bg-white/10`}>Explorar artes <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 sm:p-5" aria-label="Seu bônus Studio e Editor">
          <h3 className="flex items-center gap-2 text-sm font-extrabold"><Layers3 size={17} className="text-orange-300" aria-hidden="true" /> Seu Studio · Mockup + Editor</h3>
          {query.isPending ? <p className="mt-3 flex items-center gap-2 text-sm text-slate-300"><Loader2 size={15} className="animate-spin" aria-hidden="true" /> Consultando seu código…</p> : query.isError ? <div className="mt-3"><p role="alert" className="text-sm text-orange-100">Não foi possível consultar o código. Seus dados não foram alterados.</p><button type="button" onClick={() => query.refetch()} className={`${actionClass} mt-2 border border-white/15 text-white`}><RefreshCw size={15} aria-hidden="true" /> Tentar novamente</button></div> : !bonus ? <p className="mt-3 text-sm leading-6 text-slate-300">O bônus ainda não está disponível nesta conta. <a className="underline underline-offset-4" href={WHATSAPP.link(WHATSAPP_MESSAGES.support)} target="_blank" rel="noopener noreferrer">Consultar suporte</a></p> : <>
            <p className="mt-3 text-sm font-bold text-orange-200">{blocked ? 'Acesso ao bônus bloqueado' : bonus.state === 'pending' ? 'Sincronizando seu código' : bonusExpired ? 'O teste dos bônus terminou' : bonus.entitlement === 'TRIAL' ? remaining(bonusDeadline, now) ?? 'Teste dos bônus' : bonus.state === 'unlinked' ? 'Obtenha seu código na Biblioteca' : 'Incluídos no seu acesso completo'}</p>
            {blocked ? <p className="mt-2 text-sm leading-6 text-slate-300">Fale com o suporte para conferir a liberação do bônus.</p> : bonus.state === 'pending' ? <p role="status" className="mt-2 text-sm leading-6 text-slate-300">Estamos atualizando seu acesso. A sincronização mantém seu código e a data original do teste.</p> : bonus.entitlement === 'TRIAL' ? <p className="mt-2 text-xs leading-6 text-slate-300">{bonusExpired ? 'Ative o pacote completo da Biblioteca para continuar com os bônus.' : `Disponíveis até ${dateBR(bonus.trialEndsAt)} (Brasília). O prazo é independente dos downloads da Biblioteca.`}</p> : <p className="mt-2 text-sm leading-6 text-slate-300">{bonus.state === 'unlinked' ? 'Gere seu código abaixo para abrir o Studio e o Editor.' : 'O código acompanha seu pacote, sem a validade de 7 dias do teste.'}</p>}
            {bonus.code && <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Seu código de ativação do Studio</p><p id="studio-access-code" className="mt-1 break-all font-mono text-sm font-bold tracking-wide" tabIndex={-1}>{bonus.code}</p></div>}
            <div className="mt-3 flex flex-wrap gap-2">
              {bonus.code && !blocked && !bonusExpired && <button type="button" className={`${actionClass} border border-white/15 text-white hover:bg-white/10`} onClick={async () => { try { await navigator.clipboard.writeText(bonus.code!); toast.success('Código copiado!') } catch { toast.error('Selecione o código para copiar.') } }}><Copy size={15} aria-hidden="true" /> Copiar código</button>}
              {!blocked && (bonus.state === 'unlinked' || bonus.state === 'pending') && <button type="button" disabled={busy} onClick={requestCode} className={`${actionClass} bg-orange-500 text-white`}>{busy ? 'Sincronizando…' : isTrial ? 'Atualizar código' : 'Gerar meu código'}</button>}
              {bonusAvailable && bonus.code && <a href={STUDIO_URL} target="_blank" rel="noopener noreferrer" className={`${actionClass} bg-orange-500 text-white hover:bg-orange-400`}>Acessar Studio · Mockup + Editor <ExternalLink size={15} aria-hidden="true" /></a>}
            </div>
            {error && <p role="alert" className="mt-2 text-sm text-red-200">{error}</p>}
          </>}
        </div>
      </div>
      {ended && isTrial && bonusAvailable && bonus?.entitlement === 'TRIAL' && bonusDeadline != null && <p role="status" className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100">O teste de downloads da Biblioteca terminou. Seu Studio e Editor continuam disponíveis até {dateBR(bonus?.trialEndsAt)} (Brasília). Você pode usar o mesmo código até essa data.</p>}
      {isTrial && <details open={quota?.used === 0 && !ended} className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-100">Primeiros passos na Biblioteca <ChevronDown size={16} aria-hidden="true" /></summary>
        <ol className="mt-3 grid gap-4 text-sm leading-6 text-slate-300 md:grid-cols-3">
          <li><p className="flex items-center gap-2 font-bold text-white"><Check size={14} className="text-orange-300" aria-hidden="true" /> 1. Escolha sua arte</p><p className="mt-1">Use a busca e as categorias. O botão Explorar artes leva você até o acervo.</p></li>
          <li><p className="flex items-center gap-2 font-bold text-white"><Check size={14} className="text-orange-300" aria-hidden="true" /> 2. Faça seu download</p><p className="mt-1">Na arte escolhida, use Baixar. Cada download, inclusive repetição, conta na cota do teste.</p></li>
          <li><p className="flex items-center gap-2 font-bold text-white"><Check size={14} className="text-orange-300" aria-hidden="true" /> 3. Conheça os bônus</p><p className="mt-1">Copie seu código e abra o Studio e o Editor. Ative o pacote completo quando quiser continuar.</p></li>
        </ol>
      </details>}
    </div>
  </section>
}
