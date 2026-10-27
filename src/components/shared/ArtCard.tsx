'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, Box, CalendarHeart, Copy, Download, Eye, EyeOff, Heart, Loader2, Lock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ArtItem } from '@/lib/types'
import { formatArtCode } from '@/lib/art-code'
import { formatArtTitle } from '@/lib/format-art-title'

type DownloadState = 'idle' | 'loading' | 'done'

type ArtCardProps = {
  art: ArtItem
  locked?: boolean
  demo?: boolean
  downloadState?: DownloadState
  onDownload?: (art: ArtItem) => void
  onToggleFavorite?: (art: ArtItem) => void
  onPreview?: (art: ArtItem) => void
  onOpenMockup?: (art: ArtItem) => void
}

/** Download e favoritos ficam acessíveis sem hover. Overlay: somente Studio e prévia ampliada. */
export function ArtCard({ art, locked = false, demo = false, downloadState = 'idle', onDownload, onToggleFavorite, onPreview, onOpenMockup }: ArtCardProps) {
  const title = formatArtTitle(art.title)
  const canDownload = !demo && !locked && downloadState !== 'loading'
  const downloadLabel = downloadState === 'loading' ? 'Preparando arquivo…' : downloadState === 'done' ? 'Baixar novamente' : 'Baixar arte'
  const code = formatArtCode(art.code)
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); toast.success('Código copiado!') }
    catch { toast.error('Não foi possível copiar o código.') }
  }

  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="cg-member-artcard group relative min-w-0">
      <div className="cg-art-card-surface relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#172338] transition-[transform,border-color,box-shadow] duration-200 ease-out">
        <div className="cg-art-visual relative aspect-[21/9.5] w-full shrink-0 overflow-hidden bg-[#eef0f3]">
          <img src={art.imageUrl} alt={title} loading="lazy" draggable={false} decoding="async" onContextMenu={demo ? event => event.preventDefault() : undefined} onDragStart={demo ? event => event.preventDefault() : undefined} className={cn('absolute inset-0 h-full w-full object-contain', locked && 'scale-105 blur-[7px] brightness-[.72]', demo && 'blur-[1px] brightness-[.98]')} />
          {!locked && onPreview && <button type="button" onClick={() => onPreview(art)} aria-label={`Ampliar arte ${title}`} className="absolute inset-0 z-[1] block h-full w-full cursor-zoom-in focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-orange-500" />}
          <div className="pointer-events-none absolute left-2 top-2 z-[3] flex max-w-[calc(100%-16px)] flex-wrap items-center gap-1">
            {art.isLaunch ? <span className="rounded-full border border-orange-400/25 bg-orange-500/95 px-2 py-1 text-[9px] font-semibold text-white shadow">Novo</span> : art.isSelected ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-950/85 px-2 py-1 text-[9px] font-semibold text-amber-100"><Star className="h-2.5 w-2.5" /> Selecionada</span> : null}
            {art.seasonalEvent && <span className="hidden max-w-[125px] items-center gap-1 truncate rounded-full border border-white/10 bg-zinc-950/70 px-2 py-1 text-[9px] font-medium text-white/90 sm:inline-flex"><CalendarHeart className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{art.seasonalEvent.name}</span></span>}
          </div>
          {downloadState === 'done' && !locked && <span className="pointer-events-none absolute bottom-2 left-2 z-[3] flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-1 text-[9px] font-bold text-white"><BadgeCheck className="h-3 w-3" /> Baixada</span>}
          {demo && <span className="pointer-events-none absolute bottom-2 left-2 z-[3] inline-flex items-center gap-1 rounded-full bg-zinc-950/85 px-2 py-1 text-[9px] font-bold text-orange-200"><EyeOff className="h-3 w-3" /> Prévia protegida</span>}
          {locked && <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-zinc-950/35"><Lock className="h-7 w-7 text-white" /></div>}
          {/* Somente as funções complementares aparecem com hover no desktop. */}
          <div className="cg-art-hover-actions pointer-events-none absolute inset-0 z-[4] flex-col items-center justify-center gap-1 bg-slate-950/65 p-1.5 backdrop-blur-[2px]" aria-label="Visualização e Studio">
            {onOpenMockup && <button type="button" onClick={() => onOpenMockup(art)} className="pointer-events-auto inline-flex min-h-8 w-full max-w-[215px] items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-2 py-1 text-center text-[11px] font-bold leading-snug text-white shadow-lg hover:bg-orange-400"><Box className="h-4 w-4 shrink-0" /> Abrir Studio 3D</button>}
            {!locked && onPreview && <button type="button" onClick={() => onPreview(art)} className="pointer-events-auto inline-flex min-h-8 w-full max-w-[215px] items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2 py-1 text-center text-[11px] font-semibold text-white hover:bg-white/25"><Eye className="h-4 w-4 shrink-0" /> Visualizar arte maior</button>}
          </div>
        </div>
        <div className="cg-art-info flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-3.5">
          <div className="flex min-w-0 items-start gap-2">
            <h3 className="line-clamp-2 min-h-9 min-w-0 flex-1 text-[12px] font-semibold leading-snug text-white sm:text-sm" title={art.title}>{title}</h3>
            {!demo && !locked && onToggleFavorite && (
              <button type="button" onClick={() => onToggleFavorite(art)} aria-pressed={!!art.favorited} aria-label={art.favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} title={art.favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'} className={cn('cg-art-favorite inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[.08] text-slate-200 transition-colors hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200 focus-visible:outline-2 focus-visible:outline-orange-400', art.favorited && 'border-rose-400/35 bg-rose-500/15 text-rose-300')}>
                <Heart className={cn('h-[17px] w-[17px]', art.favorited && 'fill-rose-500 text-rose-400')} />
              </button>
            )}
          </div>
          <div className="cg-art-meta flex min-w-0 flex-wrap items-center gap-1.5">
            {art.category && <span className="max-w-full truncate rounded-full border border-white/5 bg-orange-400/10 px-2 py-0.5 text-[9px] font-medium text-orange-200">{art.category.emoji} {art.category.name}</span>}
            <button type="button" onClick={copyCode} aria-label={`Copiar código ${code}`} title="Copiar código da arte" className="cg-art-code inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/[.055] px-2 py-1 font-mono text-[9px] text-slate-300 transition-colors hover:text-white"><Copy className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{code}</span></button>
            {art.tags.slice(0, 1).map(tag => <span key={tag.id} title={tag.name} className="max-w-[110px] truncate rounded-full bg-white/[.04] px-2 py-1 text-[9px] text-slate-400">#{tag.name}</span>)}
          </div>
          <div className="mt-auto flex min-w-0 flex-col gap-2 pt-1">
            <button type="button" disabled={!canDownload} onClick={() => onDownload?.(art)} aria-label={demo || locked ? 'Download disponível para assinantes' : downloadLabel} className="cg-art-download inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-2.5 py-2 text-center text-xs font-bold leading-tight text-white shadow-sm transition-colors hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 disabled:shadow-none sm:min-h-11 sm:text-[13px]">
              {downloadState === 'loading' ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : demo || locked ? <Lock className="h-4 w-4 shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
              <span className="min-w-0">{demo || locked ? 'Disponível para assinantes' : downloadLabel}</span>
            </button>
            {onOpenMockup && <button type="button" onClick={() => onOpenMockup(art)} className="cg-art-studio-touch hidden min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-orange-400/25 bg-orange-500/10 px-2 py-1.5 text-[11px] font-semibold text-orange-200 hover:bg-orange-500/20"><Box className="h-3.5 w-3.5" /> Ver no Studio 3D</button>}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
