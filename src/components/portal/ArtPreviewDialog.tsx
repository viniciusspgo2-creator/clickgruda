'use client'

import { CalendarHeart, Check, Copy, Download, EyeOff, Flame, Heart, Loader2, Star, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ArtItem } from '@/lib/types'
import { formatArtCode } from '@/lib/art-code'
import { cn } from '@/lib/utils'

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
  if (!art) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cg-premium-preview flex max-h-[95dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col overflow-y-auto rounded-2xl border-white/10 bg-[#121a2a] p-0 text-slate-100 sm:rounded-3xl">
        <DialogHeader className="sr-only"><DialogTitle>{art.title}</DialogTitle><DialogDescription>Pré-visualização da estampa original, sem mockups</DialogDescription></DialogHeader>
        <div className="grid min-h-0 gap-0 lg:grid-cols-[minmax(0,1.8fr)_minmax(275px,1fr)]">
          <div className="flex min-h-[230px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#f7f2ec,#d9dde4)] p-3 sm:min-h-[390px] sm:p-6">
            <img src={art.imageUrl} alt={`Estampa completa: ${art.title}`} className={cn('block max-h-[63dvh] min-h-0 w-full object-contain', demo && 'blur-[8px] brightness-[0.7]')} />
            {demo && <span className="absolute rounded-xl bg-zinc-950/90 px-4 py-2 text-xs font-bold text-white"><EyeOff className="mr-1 inline h-4 w-4" /> Prévia protegida</span>}
          </div>
          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap gap-1.5">
              {art.isLaunch && <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase text-orange-700"><Flame className="h-3 w-3" /> Novo</span>}
              {art.isSelected && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black uppercase text-amber-800"><Star className="h-3 w-3" /> Selecionada</span>}
            </div>
            <div><h2 className="pr-5 text-xl font-black leading-tight tracking-tight text-white">{art.title}</h2><p className="mt-2 text-xs text-slate-400">Arte completa no formato original de visualização, sem aplicação em produto.</p></div>
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(formatArtCode(art.code)); toast.success('Código copiado!') } catch { toast.error('Não foi possível copiar o código.') } }} className="flex w-fit items-center gap-2 rounded-lg bg-zinc-950 px-3 py-2 font-mono text-xs font-bold text-orange-300" title="Copiar código da arte"><Copy className="h-3.5 w-3.5" /> {formatArtCode(art.code)}</button>
            <div className="flex flex-wrap gap-2">
              {art.category && <button onClick={() => { onCategory(art.category!.id); onOpenChange(false) }} className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 hover:bg-orange-100">{art.category.emoji} {art.category.name}</button>}
              {art.seasonalEvent && <button onClick={() => { onSeasonal(art.seasonalEvent!.id); onOpenChange(false) }} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"><CalendarHeart className="h-3.5 w-3.5" /> {art.seasonalEvent.name}</button>}
              {art.tags.map((tag) => <button key={tag.id} onClick={() => { onTag(tag.id); onOpenChange(false) }} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"><Tag className="h-3 w-3" /> {tag.name}</button>)}
            </div>
            <div className="mt-auto flex gap-2 border-t border-white/10 pt-4">
              <Button disabled={demo || downloadState === 'loading'} onClick={() => onDownload(art)} className="h-11 flex-1 rounded-xl bg-orange-500 font-black text-white hover:bg-orange-600">{demo ? <><EyeOff className="mr-2 h-4 w-4" /> Demo</> : downloadState === 'loading' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparando...</> : downloadState === 'done' ? <><Check className="mr-2 h-4 w-4" /> Baixar novamente</> : <><Download className="mr-2 h-4 w-4" /> Baixar arte</>}</Button>
              {!demo && <Button variant="outline" aria-label={art.favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} title={art.favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} onClick={() => onFavorite(art)} className="h-11 w-11 rounded-xl border-white/15 p-0"><Heart className={cn('h-4 w-4', art.favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} /></Button>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
