'use client'

import { motion } from 'framer-motion'
import { BadgeCheck, CalendarHeart, Check, Download, EyeOff, Flame, Heart, Loader2, Lock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ArtItem } from '@/lib/types'
import { formatArtCode } from '@/lib/art-code'

type DownloadState = 'idle' | 'loading' | 'done'

type ArtCardProps = {
  art: ArtItem
  locked?: boolean
  demo?: boolean
  downloadState?: DownloadState
  onDownload?: (art: ArtItem) => void
  onToggleFavorite?: (art: ArtItem) => void
}

export function ArtCard({ art, locked = false, demo = false, downloadState = 'idle', onDownload, onToggleFavorite }: ArtCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300',
          'hover:border-orange-300 hover:shadow-[0_24px_48px_-16px_rgba(234,88,12,0.28)]',
          'border-zinc-200'
        )}
      >
        {/* ---------- Art area: 21 x 9.5 ---------- */}
        <div className="relative aspect-[21/9.5] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_40%,#fdf7f2,#f6f3f0)]">
          { }
          <img
            src={art.imageUrl}
            alt={art.title}
            loading="lazy"
            className={cn(
              'absolute inset-0 h-full w-full object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-[1.035]',
              (locked || demo) && 'scale-105 blur-[7px] brightness-[0.72]'
            )}
          />

          {/* Badges */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            {art.isLaunch && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md shadow-orange-500/40">
                <Flame className="h-3 w-3" /> Novo
              </span>
            )}
            {art.isSelected && (
              <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-950 shadow-md shadow-amber-500/30">
                <Star className="h-3 w-3 fill-amber-950" /> Selecionada
              </span>
            )}
            {art.seasonalEvent && (
              <span className="flex items-center gap-1 rounded-full bg-zinc-950/85 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                <CalendarHeart className="h-3 w-3 text-orange-400" />
                {art.seasonalEvent.name}
              </span>
            )}
          </div>

          {/* Favorite heart */}
          {!locked && !demo && (
            <motion.button
              whileTap={{ scale: 1.45 }}
              whileHover={{ scale: 1.12 }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite?.(art)
              }}
              aria-label={art.favorited ? 'Remover dos favoritos' : 'Favoritar arte'}
              className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md ring-1 ring-zinc-200/70 backdrop-blur transition-colors hover:bg-white"
            >
              <Heart
                className={cn(
                  'h-4.5 w-4.5 transition-all duration-200',
                  art.favorited ? 'fill-red-500 text-red-500 drop-shadow-[0_2px_6px_rgba(239,68,68,0.55)]' : 'text-zinc-400'
                )}
              />
            </motion.button>
          )}

          {/* Locked overlay */}
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/35">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xl">
                <Lock className="h-5 w-5 text-orange-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white drop-shadow">
                Liberada no portal
              </span>
            </div>
          )}

          {/* Demo overlay: pré-visualização protegida (embaçada, sem download) */}
          {demo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-950/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-xl">
                <EyeOff className="h-5 w-5 text-orange-500" />
              </div>
              <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300 backdrop-blur">
                Modo demonstração
              </span>
            </div>
          )}

          {/* Downloaded check */}
          {downloadState === 'done' && !locked && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow"
            >
              <BadgeCheck className="h-3 w-3" /> Baixada
            </motion.span>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div className="space-y-2.5 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-sm font-bold text-zinc-900" title={art.title}>
              {art.title}
            </h3>
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-zinc-400">
              <Download className="h-3 w-3" />
              {art.downloadsCount}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {art.category && (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">
                {art.category.emoji} {art.category.name}
              </span>
            )}
            <span
              title="Código da arte — use na busca para achar rápido"
              className="rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide text-orange-300"
            >
              {formatArtCode(art.code)}
            </span>
            {art.tags.slice(0, 3).map((t) => (
              <span key={t.id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                #{t.name}
              </span>
            ))}
          </div>

          <Button
            size="sm"
            disabled={demo || downloadState === 'loading'}
            onClick={() => onDownload?.(art)}
            className={cn(
              'h-9 w-full gap-2 rounded-xl text-[13px] font-bold transition-all',
              demo
                ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                : locked
                  ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 hover:brightness-105'
            )}
          >
            {demo ? (
              <>
                <EyeOff className="h-4 w-4" /> Bloqueado na demo
              </>
            ) : downloadState === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Preparando...
              </>
            ) : locked ? (
              <>
                <Lock className="h-4 w-4" /> Desbloquear com acesso
              </>
            ) : downloadState === 'done' ? (
              <>
                <Check className="h-4 w-4" /> Baixar de novo
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Baixar arte
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
