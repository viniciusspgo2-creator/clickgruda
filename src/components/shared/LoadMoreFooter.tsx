'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Loader2 } from 'lucide-react'

/**
 * Rodapé da lista de artes — modelo HÍBRIDO (o mais recomendado para catálogos):
 *  1. as primeiras páginas carregam sozinhas conforme a pessoa rola (fluidez);
 *  2. depois de `autoPages` páginas, a rolagem PARA e aparece o botão "Carregar mais"
 *     (a pessoa decide continuar, o rodapé do site continua alcançável e a página não fica pesada);
 *  3. mostra "X de Y artes" + barra de progresso (a pessoa sabe onde está) e um botão "Voltar ao topo".
 * Cada clique em "Carregar mais" libera mais `autoPages` páginas automáticas.
 */
export function LoadMoreFooter({
  loaded,
  total,
  pagesLoaded,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  resetKey,
  autoPages = 3,
}: {
  loaded: number
  total: number
  pagesLoaded: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
  /** muda quando a busca/filtro muda — volta ao início (rolagem automática liberada de novo) */
  resetKey: string
  autoPages?: number
}) {
  const [auto, setAuto] = useState({ key: resetKey, limit: autoPages })
  const limit = auto.key === resetKey ? auto.limit : autoPages
  const autoMode = pagesLoaded < limit
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [showTop, setShowTop] = useState(false)

  // rolagem automática só enquanto estiver dentro do limite de páginas
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage || !autoMode) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: '600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, autoMode, isFetchingNextPage, fetchNextPage, pagesLoaded])

  // botão "voltar ao topo" depois de rolar bastante
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 1400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0

  return (
    <>
      <div ref={sentinelRef} className="flex flex-col items-center gap-3 py-10">
        {total > 0 && (
          <div className="w-full max-w-xs text-center">
            <p className="text-xs font-semibold text-zinc-400">
              Você viu <b className="text-zinc-600">{loaded}</b> de <b className="text-zinc-600">{total}</b> {total === 1 ? 'arte' : 'artes'}
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {isFetchingNextPage ? (
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" /> Carregando mais artes...
          </span>
        ) : hasNextPage && !autoMode ? (
          <button
            type="button"
            onClick={() => {
              setAuto({ key: resetKey, limit: pagesLoaded + autoPages })
              fetchNextPage()
            }}
            className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-orange-500 bg-white px-8 text-sm font-black text-orange-600 shadow-sm transition-all hover:bg-orange-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
          >
            Carregar mais artes <ChevronDown className="h-4 w-4" />
          </button>
        ) : !hasNextPage && loaded > 0 ? (
          <span className="text-xs font-semibold text-zinc-300">Isso é tudo por aqui ✨</span>
        ) : null}
      </div>

      {showTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar ao topo"
          className="fixed bottom-5 left-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-lg transition-all hover:border-orange-500 hover:bg-orange-500 hover:text-white print:hidden"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  )
}
