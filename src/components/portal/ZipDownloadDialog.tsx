'use client'

import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Download, FileArchive, PartyPopper, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { downloadScopeAsZip, ZipLimitError, type ZipProgress, type ZipScope } from '@/lib/zip-download'
import type { CatalogData } from '@/lib/types'

type Option = { key: string; label: string; count: number; target: ZipScope }

/** Baixar em ZIP — por categoria, data comemorativa, lançamentos, selecionadas ou o acervo todo. */
export function ZipDownloadDialog({
  open,
  onOpenChange,
  catalog,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  catalog: CatalogData | undefined
}) {
  const queryClient = useQueryClient()
  const [choice, setChoice] = useState('')
  const [skip, setSkip] = useState(true)
  const [limitHit, setLimitHit] = useState<number | null>(null)
  const [phase, setPhase] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState<ZipProgress | null>(null)
  const [message, setMessage] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const general: Option[] = catalog
    ? [
        { key: 'all', label: 'Todo o acervo', count: catalog.counts.arts, target: { scope: 'all', label: 'click-gruda-acervo-completo' } },
        { key: 'launch', label: 'Lançamentos', count: catalog.counts.lancamentos, target: { scope: 'launch', label: 'click-gruda-lancamentos' } },
        { key: 'selected', label: 'Selecionadas', count: catalog.counts.selecionadas, target: { scope: 'selected', label: 'click-gruda-selecionadas' } },
      ]
    : []
  const cats: Option[] = (catalog?.categories || [])
    .filter((c) => c.artCount > 0)
    .map((c) => ({ key: `c:${c.id}`, label: c.name, count: c.artCount, target: { scope: 'category' as const, id: c.id, label: `click-gruda-${c.name}` } }))
  const evts: Option[] = (catalog?.events || [])
    .filter((e) => e.artCount > 0)
    .map((e) => ({ key: `e:${e.id}`, label: `${e.emoji} ${e.name}`, count: e.artCount, target: { scope: 'event' as const, id: e.id, label: `click-gruda-${e.name}` } }))
  const all = [...general, ...cats, ...evts]
  const selected = all.find((o) => o.key === choice)

  const start = async () => {
    if (!selected) return
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setPhase('running')
    setMessage('')
    setLimitHit(null)
    setProgress({ done: 0, total: selected.count, failed: 0, parts: 0, deferred: 0, skipped: 0, limitReached: false, limit: 0 })
    try {
      const final = await downloadScopeAsZip({ ...selected.target, skipDownloaded: skip }, setProgress, ctrl.signal)
      setProgress(final)
      setPhase('done')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch (e) {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      if (e instanceof ZipLimitError) {
        setPhase('idle')
        setProgress(null)
        setLimitHit(e.limit || catalog?.quota?.limit || 500)
      } else if (e instanceof DOMException && e.name === 'AbortError') {
        setPhase('idle')
        setMessage('Download cancelado.')
      } else {
        setPhase('error')
        setMessage(e instanceof Error ? e.message : 'Erro ao gerar o ZIP.')
      }
    }
  }

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  const big = (selected?.count || 0) > 250

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && phase === 'running') return // não fecha no meio do download
        onOpenChange(o)
        if (!o) setTimeout(() => (setPhase('idle'), setProgress(null), setMessage(''), setLimitHit(null)), 250)
      }}
    >
      <DialogContent className="max-w-md rounded-3xl border-zinc-200 bg-white p-0 sm:p-0" aria-describedby="zip-desc">
        <DialogHeader className="rounded-t-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-white">
            <FileArchive className="h-5 w-5" /> Baixar em ZIP
          </DialogTitle>
          <DialogDescription id="zip-desc" className="text-sm font-medium text-orange-50">
            Escolha o que levar para o seu computador como backup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 pt-5">
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">O que baixar</p>
            <Select value={choice} onValueChange={setChoice} disabled={phase === 'running'}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Escolha uma categoria ou data comemorativa..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  <SelectLabel>Geral</SelectLabel>
                  {general.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label} · {o.count}</SelectItem>
                  ))}
                </SelectGroup>
                {evts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Datas comemorativas</SelectLabel>
                    {evts.map((o) => (
                      <SelectItem key={o.key} value={o.key}>{o.label} · {o.count}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {cats.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Categorias</SelectLabel>
                    {cats.map((o) => (
                      <SelectItem key={o.key} value={o.key}>{o.label} · {o.count}</SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {catalog?.quota && catalog.quota.limit > 0 && (
            <p className="text-xs font-semibold text-zinc-500">
              Hoje você já baixou <b className="text-zinc-800">{catalog.quota.used}</b> de {catalog.quota.limit} artes
              {' '}· restam <b className="text-orange-600">{Math.max(0, catalog.quota.limit - catalog.quota.used)}</b>. O limite renova à meia-noite.
            </p>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-zinc-200 px-3.5 py-2.5">
            <input
              type="checkbox"
              checked={skip}
              disabled={phase === 'running'}
              onChange={(e) => setSkip(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-orange-500"
            />
            <span className="text-xs leading-relaxed text-zinc-600">
              <b className="text-zinc-800">Pular artes que eu já baixei</b>
              <br />
              Assim, se o limite do dia acabar, amanhã você continua de onde parou.
            </span>
          </label>

          {phase === 'idle' && selected && (
            <div className="rounded-xl bg-zinc-50 px-3.5 py-3 text-xs leading-relaxed text-zinc-500">
              {selected.count} {selected.count === 1 ? 'arte' : 'artes'} em alta qualidade (PNG original).{' '}
              {big
                ? 'É bastante arte: o download vem em vários ZIPs (cerca de 120 MB cada) e o navegador pode pedir permissão para baixar vários arquivos — aceite.'
                : 'Se passar de ~120 MB, o download vem dividido em partes.'}{' '}
              Mantenha esta janela aberta até terminar.
            </div>
          )}

          {(phase === 'running' || phase === 'done') && progress && (
            <div>
              <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 flex items-center justify-between text-xs font-semibold text-zinc-500">
                <span>
                  {progress.done} de {progress.total} artes{progress.parts > 0 ? ` · ${progress.parts} ZIP${progress.parts > 1 ? 's' : ''} salvo${progress.parts > 1 ? 's' : ''}` : ''}
                </span>
                <span>{pct}%</span>
              </p>
              {phase === 'running' && progress.current && <p className="mt-1 truncate text-[11px] text-zinc-400">{progress.current}</p>}
            </div>
          )}

          {phase === 'done' && progress && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Pronto! {progress.done - progress.failed} artes salvas em {progress.parts} {progress.parts === 1 ? 'arquivo ZIP' : 'arquivos ZIP'}.
                {progress.failed > 0 && ` ${progress.failed} não puderam ser baixadas — tente de novo para pegar as que faltaram.`}
              </span>
            </div>
          )}

          {phase === 'done' && progress && progress.deferred > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-800">
              <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Você chegou ao limite de {progress.limit} downloads de hoje! Para não sobrecarregar o sistema, ele renova à meia-noite.
                Ainda faltam {progress.deferred} artes desta seleção: volte amanhã e clique em “Baixar ZIP” de novo
                {skip ? ' — continuamos de onde parou.' : ' (marque “Pular artes que eu já baixei” para continuar de onde parou).'}
              </span>
            </div>
          )}

          {limitHit !== null && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm font-semibold text-amber-800">
              <PartyPopper className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Você chegou ao limite de {limitHit} downloads de hoje! 🎉 Para não sobrecarregar o sistema, ele renova à meia-noite. Volte amanhã e baixe mais {limitHit}.
              </span>
            </div>
          )}

          {(phase === 'error' || message) && message && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-xs font-bold text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {message}
            </div>
          )}

          <div className="flex gap-2">
            {phase === 'running' ? (
              <Button variant="outline" onClick={() => abortRef.current?.abort()} className="h-11 flex-1 rounded-xl border-red-200 font-bold text-red-600 hover:bg-red-50">
                <X className="mr-1.5 h-4 w-4" /> Cancelar
              </Button>
            ) : (
              <Button
                onClick={start}
                disabled={!selected}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25"
              >
                <Download className="mr-2 h-4 w-4" />
                {phase === 'done' ? 'Baixar de novo' : 'Baixar ZIP'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
