'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ChipScroller — faixa horizontal de chips que dá pra navegar de TODO jeito:
 *  - setas ◀ ▶ (aparecem só quando há mais conteúdo para aquele lado) — resolve no desktop,
 *    onde não existe "deslizar com o dedo";
 *  - arrastar com o mouse (click-and-drag) e roda do mouse / trackpad na horizontal;
 *  - deslizar com o dedo no celular (rolagem nativa);
 *  - degradê nas bordas avisando que continua.
 * O chip com data-active="true" é centralizado automaticamente quando `activeKey` muda.
 */
export function ChipScroller({
  children,
  activeKey,
  fadeFrom = 'from-zinc-950',
  className,
}: {
  children: ReactNode
  activeKey?: string | null
  /** cor de fundo do container pai (para o degradê das bordas) */
  fadeFrom?: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [update, children])

  // centraliza o chip ativo
  useEffect(() => {
    const el = ref.current
    const active = el?.querySelector<HTMLElement>('[data-active="true"]')
    if (el && active) {
      const target = active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2
      el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
    }
  }, [activeKey])

  const scrollByDir = (dir: 1 | -1) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className={cn('relative', className)}>
      <div
        ref={ref}
        onScroll={update}
        onWheel={(e) => {
          const el = ref.current
          if (!el) return
          // roda do mouse (vertical) vira rolagem horizontal quando a faixa tem overflow
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
            el.scrollLeft += e.deltaY
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') return
          const el = ref.current
          if (!el) return
          drag.current = { down: true, moved: false, startX: e.clientX, startLeft: el.scrollLeft }
        }}
        onPointerMove={(e) => {
          const d = drag.current
          const el = ref.current
          if (!d.down || !el) return
          const dx = e.clientX - d.startX
          if (Math.abs(dx) > 5) d.moved = true
          if (d.moved) el.scrollLeft = d.startLeft - dx
        }}
        onPointerUp={() => {
          drag.current.down = false
        }}
        onPointerLeave={() => {
          drag.current.down = false
        }}
        // se arrastou, não deixa o "click" selecionar um chip sem querer
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault()
            e.stopPropagation()
            drag.current.moved = false
          }
        }}
        className="no-scrollbar flex cursor-grab gap-2 overflow-x-auto pb-1 active:cursor-grabbing"
      >
        {children}
      </div>

      {canLeft && (
        <>
          <div className={cn('pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r to-transparent', fadeFrom)} aria-hidden />
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            aria-label="Ver datas anteriores"
            className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-lg transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}
      {canRight && (
        <>
          <div className={cn('pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l to-transparent', fadeFrom)} aria-hidden />
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            aria-label="Ver mais datas"
            className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 shadow-lg transition-colors hover:border-orange-500 hover:bg-orange-500 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}
