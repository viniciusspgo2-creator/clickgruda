'use client'

import { useEffect, useState } from 'react'

import { CalendarHeart, Check, Copy, Download, EyeOff, Flame, Heart, Loader2, Star, Tag, ZoomIn, ZoomOut, RotateCcw, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ArtItem } from '@/lib/types'
import { formatArtCode } from '@/lib/art-code'
import { cn } from '@/lib/utils'
import { DemoConversionActions } from '@/components/portal/DemoConversionActions'

/** Mostra a prévia já cadastrada: sem mockups, cortes ou geração de arquivos. */
export function ArtPreviewDialog({
  art, open, onOpenChange, demo, downloadState, onDownload, onFavorite, onCategory, onTag, onSeasonal,
}: {
  art: ArtItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  demo: boolean
  downloadState: 'idle' | 'loading' | 'done'
  onDownload: (art: ArtItem) => void
  onFavorite: (art: ArtItem) => void
  onCategory: (id: string) => void
  onTag: (id: string) => void
  onSeasonal: (id: string) => void
}) {
  const [zoom, setZoom] = useState(1)
  useEffect(() => { setZoom(1) }, [art?.id, open])
  if (!art) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onContextMenu={demo ? event => event.preventDefault() : undefined} className="cg-premium-preview flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-[min(96vw,1480px)] flex-col overflow-y-auto rounded-2xl border-white/10 bg-[#121a2a] p-0 text-slate-100 sm:rounded-3xl">
        <DialogHeader className="sr-only"><DialogTitle>{art.title}</DialogTitle><DialogDescription>Prévia visual. O download da arte é feito pelo botão Baixar arte.</DialogDescription></DialogHeader>
        <div className="grid min-h-0 gap-0 lg:grid-cols-[minmax(0,2.45fr)_minmax(265px,.85fr)]">
          <div className="cg-preview-visual relative flex min-h-[300px] flex-col overflow-hidden bg-[#e5e8ee] sm:min-h-[65dvh]">
            <span className="cg-preview-watermark-note absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-extrabold text-slate-800 shadow-md sm:left-4 sm:top-4">
              <Info className="h-3.5 w-3.5 text-orange-600" /> <span className="cg-preview-note-label">SOMENTE PRÉVIA</span>
            </span>
            <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg" aria-label="Controles da ampliação">
              <button type="button" onClick={() => setZoom((z) => Math.max(1, Number((z - 0.25).toFixed(2))))} disabled={zoom === 1} title="Diminuir zoom" aria-label="Diminuir zoom" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-35"><ZoomOut className="h-4 w-4" /></button>
              <span className="w-12 text-center text-xs font-extrabold text-slate-800">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))} disabled={zoom >= 3} title="Aumentar zoom" aria-label="Aumentar zoom" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 disabled:opacity-35"><ZoomIn className="h-4 w-4" /></button>
              <button type="button" onClick={() => setZoom(1)} title="Restaurar tamanho" aria-label="Restaurar tamanho" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"><RotateCcw className="h-4 w-4" /></button>
            </div>
            <div className="cg-preview-stage relative flex min-h-[350px] flex-1 items-center justify-center overflow-auto p-2 sm:min-h-[65dvh] sm:p-5">
              <img src={art.imageUrl} alt={`Estampa completa: ${art.title}`} draggable={false} onDoubleClick={() => setZoom((z) => z === 1 ? 1.75 : 1)} style={{ transform: `scale(${zoom})` }} className={cn('cg-preview-art block max-h-[76dvh] w-full max-w-full select-none object-contain transition-transform duration-200', demo && 'blur-[1.5px] brightness-[0.98]')} />
              {demo && <span className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-zinc-950/85 px-4 py-2 text-xs font-bold text-white shadow-lg"><EyeOff className="mr-1 inline h-4 w-4" /> Prévia protegida</span>}
            </div>
            {!demo && <a href={art.imageUrl} target="_blank" rel="noopener noreferrer" className="cg-preview-open absolute bottom-3 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:bg-white"><ExternalLink className="h-3.5 w-3.5"/> Abrir esta prévia em outra aba</a>}
          </div>
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap gap-1.5">
              {art.isLaunch && <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase text-orange-700"><Flame className="h-3 w-3" /> Novo</span>}
              {art.isSelected && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-800"><Star className="h-3 w-3" /> Selecionada</span>}
            </div>
            <div><h2 className="pr-5 text-xl font-black leading-tight tracking-tight text-white">{art.title}</h2><p className="mt-2 text-xs text-slate-400">Confira a composição e os detalhes da arte antes de baixar.</p></div>
            <div className="cg-preview-download-notice flex items-start gap-3 rounded-2xl border border-orange-400/35 bg-orange-400/[.085] p-4" role="note" aria-label="Aviso importante sobre a qualidade da prévia">
              <Info className="cg-preview-notice-icon mt-0.5 h-5 w-5 shrink-0 text-orange-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="cg-preview-notice-title text-base font-extrabold leading-snug text-orange-200">Prévia de visualização — NÃO utilizar na produção</p>
                <p className="cg-preview-notice-description mt-2 text-sm leading-relaxed text-slate-100">{demo ? 'Na demonstração, mostramos amostras reduzidas, com marca-d’água e nitidez limitada. Elas permitem conhecer os estilos e a organização do acervo. O arquivo para produção fica disponível para download após a ativação do seu acesso.' : <>
                  A imagem exibida aqui serve somente para conferir a estampa e <strong className="font-extrabold text-white">pode estar em baixa resolução.</strong>
                  {' '}<strong className="font-extrabold text-orange-200">Não use a prévia para impressão ou personalização.</strong>
                  {' '}Para obter o arquivo disponibilizado para produção, clique no botão <strong className="font-extrabold text-white">Baixar arte</strong> abaixo.
                </>}</p>
              </div>
            </div>
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(formatArtCode(art.code)); toast.success('Código copiado!') } catch { toast.error('Não foi possível copiar o código.') } }} className="flex w-fit items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 font-mono text-xs font-bold text-orange-300" title="Copiar código da arte"><Copy className="h-3.5 w-3.5" /> {formatArtCode(art.code)}</button>
            <div className="flex flex-wrap gap-2">
              {art.category && <button onClick={() => { onCategory(art.category!.id); onOpenChange(false) }} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100">{art.category.emoji} {art.category.name}</button>}
              {art.seasonalEvent && <button onClick={() => { onSeasonal(art.seasonalEvent!.id); onOpenChange(false) }} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"><CalendarHeart className="h-3.5 w-3.5" /> {art.seasonalEvent.name}</button>}
              {art.tags.map((tag) => <button key={tag.id} onClick={() => { onTag(tag.id); onOpenChange(false) }} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"><Tag className="h-3 w-3" /> {tag.name}</button>)}
            </div>
            <div className="mt-auto flex gap-2 border-t border-white/10 pt-4">
              <Button disabled={demo || downloadState === 'loading'} onClick={() => onDownload(art)} className="h-12 flex-1 rounded-xl bg-orange-500 font-black text-white hover:bg-orange-600">{demo ? <><EyeOff className="mr-2 h-4 w-4" /> Demo</> : downloadState === 'loading' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando...</> : downloadState === 'done' ? <><Check className="mr-2 h-4 w-4" /> Baixar novamente</> : <><Download className="mr-2 h-4 w-4" /> Baixar arte</>}</Button>
              {!demo && <Button variant="outline" aria-label={art.favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} title={art.favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => onFavorite(art)} className="h-11 w-11 rounded-xl border-white/15 p-0"><Heart className={cn('h-4 w-4', art.favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} /></Button>}
            </div>
            {demo && <DemoConversionActions />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
