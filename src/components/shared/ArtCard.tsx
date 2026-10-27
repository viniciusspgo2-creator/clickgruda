'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, Box, CalendarHeart, Check, Copy, Download, Eye, EyeOff, Heart, Loader2, Lock, Star } from 'lucide-react'
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

/** Arte original intacta; as ações aparecem no hover ou em faixa compacta no touch. */
export function ArtCard({ art, locked = false, demo = false, downloadState = 'idle', onDownload, onToggleFavorite, onPreview, onOpenMockup }: ArtCardProps) {
  const title = formatArtTitle(art.title)
  const canDownload = !demo && !locked && downloadState !== 'loading'
  const downloadLabel = downloadState === 'loading' ? 'Preparando…' : downloadState === 'done' ? 'Baixar novamente' : 'Baixar rápido'
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(formatArtCode(art.code)); toast.success('Código copiado!') }
    catch { toast.error('Não foi possível copiar o código.') }
  }
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="cg-member-artcard group relative min-w-0">
      <div className="cg-art-card-surface relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#172338] transition-[transform,border-color,box-shadow] duration-200 ease-out">
        <div className="cg-art-visual relative aspect-[21/9.5] w-full overflow-hidden bg-[#eef0f3]">
          <img src={art.imageUrl} alt={title} loading="lazy" draggable={false} decoding="async" onContextMenu={demo ? event => event.preventDefault() : undefined} onDragStart={demo ? event => event.preventDefault() : undefined} className={cn('absolute inset-0 h-full w-full object-contain', locked && 'scale-105 blur-[7px] brightness-[.72]', demo && 'blur-[.5px] brightness-[.99]')} />
          {!locked && onPreview && <button type="button" onClick={() => onPreview(art)} aria-label={`Ampliar arte ${title}`} className="absolute inset-0 z-[1] block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-orange-500" />}
          <div className="pointer-events-none absolute left-2 top-2 z-[3] flex max-w-[85%] flex-wrap items-center gap-1">
            {art.isLaunch ? <span className="rounded-full border border-orange-400/25 bg-orange-500/90 px-2 py-1 text-[9px] font-semibold text-white shadow">Novo</span> : art.isSelected ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-900/80 px-2 py-1 text-[9px] font-semibold text-amber-100"><Star className="h-2.5 w-2.5" /> Selecionada</span> : null}
            {art.seasonalEvent && <span className="hidden items-center gap-1 rounded-full border border-white/10 bg-zinc-950/65 px-2 py-1 text-[9px] font-medium text-white/85 sm:inline-flex"><CalendarHeart className="h-2.5 w-2.5" />{art.seasonalEvent.name}</span>}
          </div>
          {downloadState === 'done' && !locked && <span className="pointer-events-none absolute bottom-2 left-2 z-[3] flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[9px] font-bold text-white"><BadgeCheck className="h-3 w-3" /> Baixada</span>}
          {demo && <span className="pointer-events-none absolute bottom-2 left-2 z-[3] inline-flex items-center gap-1 rounded-full bg-zinc-950/85 px-2 py-1 text-[9px] font-bold text-orange-200"><EyeOff className="h-3 w-3" /> Prévia protegida</span>}
          {locked && <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-zinc-950/35"><Lock className="h-7 w-7 text-white" /></div>}
          {/* O gerador é externo: abrir seu fluxo real, sem alegar importação automática. */}
          <div className="cg-art-hover-actions pointer-events-none absolute inset-0 z-[4] hidden flex-col items-center justify-center gap-2 bg-slate-950/65 px-3 backdrop-blur-[3px]" aria-label="Ações da arte">
            {onOpenMockup && <button type="button" onClick={() => onOpenMockup(art)} className="pointer-events-auto inline-flex min-h-9 w-full max-w-[190px] items-center justify-center gap-1.5 rounded-xl bg-[#f97316] px-2 text-center text-[11px] font-bold text-white hover:bg-[#fb923c]"><Box className="h-3.5 w-3.5" /> Abrir Studio 3D</button>}
            <div className="flex items-center gap-1.5">
              {!locked && onPreview && <button type="button" onClick={() => onPreview(art)} title="Ampliar arte" aria-label={`Ampliar ${title}`} className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/25"><Eye className="h-4 w-4" /></button>}
              <button type="button" disabled={!canDownload} onClick={() => onDownload?.(art)} title={demo ? 'Disponível para assinantes' : downloadLabel} className="pointer-events-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/15 px-2.5 text-[11px] font-bold text-white hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50">{downloadState === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : demo || locked ? <Lock className="h-4 w-4" /> : <Download className="h-4 w-4" />}<span className="hidden 2xl:inline">{demo ? 'Bloqueado' : downloadLabel}</span></button>
              {!locked && !demo && onToggleFavorite && <button type="button" onClick={() => onToggleFavorite(art)} aria-label={art.favorited ? 'Remover dos favoritos' : 'Favoritar'} title={art.favorited ? 'Remover dos favoritos' : 'Favoritar'} className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white hover:bg-white/25"><Heart className={cn('h-4 w-4', art.favorited && 'fill-rose-500 text-rose-400')} /></button>}
            </div>
          </div>
        </div>
        <div className="cg-art-info flex flex-col gap-2 p-3 sm:p-3.5">
          <h3 className="line-clamp-2 min-h-9 text-[12px] font-semibold leading-snug text-white sm:text-sm" title={art.title}>{title}</h3>
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {art.category && <span className="max-w-full truncate rounded-full border border-white/5 bg-orange-400/10 px-2 py-0.5 text-[9px] font-medium text-orange-200">{art.category.emoji} {art.category.name}</span>}
            <button type="button" onClick={copyCode} aria-label={`Copiar código ${formatArtCode(art.code)}`} title="Copiar código da arte" className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-white/[.055] px-2 py-1 font-mono text-[9px] text-white/60 transition-colors hover:text-white"><Copy className="h-2.5 w-2.5" /> {formatArtCode(art.code)}</button>
            {art.tags.slice(0, 1).map(tag => <span key={tag.id} title={tag.name} className="max-w-[100px] truncate rounded-full bg-white/[.04] px-2 py-1 text-[9px] text-white/45">#{tag.name}</span>)}
          </div>
          {/* Botões compactos são permanentes em touch; desktop usa overlay por hover/foco. */}
          <div className="cg-art-touch-actions hidden gap-1.5 pt-1">
            {onOpenMockup && <button type="button" onClick={() => onOpenMockup(art)} className="cg-art-mockup-touch inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg bg-orange-500/15 px-1.5 py-2 text-[10px] font-bold text-orange-200"><Box className="h-3.5 w-3.5 shrink-0" /> Mockup 3D</button>}
            {!locked && onPreview && <button type="button" aria-label="Ampliar arte" onClick={() => onPreview(art)} className="inline-flex w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70"><Eye className="h-3.5 w-3.5" /></button>}
            <button type="button" disabled={!canDownload} aria-label={demo ? "Download disponível após assinatura" : downloadState === "loading" ? "Preparando download" : "Baixar arte"} onClick={() => onDownload?.(art)} className="inline-flex w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/80 disabled:opacity-40">{demo || locked ? <Lock className="h-3.5 w-3.5" /> : downloadState === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}</button>
            {!demo && !locked && onToggleFavorite && <button type="button" aria-label={art.favorited ? 'Remover dos favoritos' : 'Favoritar'} onClick={() => onToggleFavorite(art)} className="inline-flex w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70"><Heart className={cn('h-3.5 w-3.5', art.favorited && 'fill-rose-500 text-rose-400')} /></button>}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
