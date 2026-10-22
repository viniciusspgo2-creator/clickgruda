'use client'

import { ArrowRight, CalendarHeart, Flame, LayoutGrid, Sparkles, Star, TrendingUp } from 'lucide-react'
import type { CatalogData } from '@/lib/types'
import type { PortalTab, SortMode } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Atalhos reais para filtros existentes. Não cria "coleções" fictícias nem mockups. */
export function DiscoveryShelf({
  catalog,
  onTab,
  onCategory,
  onSeasonal,
  activeCategories,
}: {
  catalog?: CatalogData
  onTab: (tab: PortalTab, sort?: SortMode) => void
  onCategory: (id: string) => void
  onSeasonal: (eventId: string) => void
  activeCategories: string[]
}) {
  const categories = [...(catalog?.categories || [])].filter((c) => c.artCount > 0)
    .sort((a, b) => b.artCount - a.artCount || a.name.localeCompare(b.name, 'pt-BR')).slice(0, 10)
  const event = catalog?.nextEvent
  const shortcuts = [
    { label: 'Lançamentos', detail: 'Artes com selo NOVO', Icon: Flame, onClick: () => onTab('lancamentos') },
    { label: 'Escolhas da equipe', detail: 'Curadoria especial', Icon: Star, onClick: () => onTab('selecionadas') },
    { label: 'Mais baixadas', detail: 'Preferidas da comunidade', Icon: TrendingUp, onClick: () => onTab('todas', 'baixadas') },
    ...(event && event.artCount > 0 ? [{ label: event.name, detail: `${event.artCount} artes da data`, Icon: CalendarHeart, onClick: () => onSeasonal(event.id) }] : []),
  ]

  return (
    <section className="mb-6 space-y-4" aria-label="Explore a biblioteca por temas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-600"><Sparkles className="h-3.5 w-3.5" /> Descubra novas ideias</div>
          <h2 className="mt-1 text-lg font-black tracking-tight text-zinc-900 sm:text-xl">Encontre a arte ideal para cada projeto</h2>
        </div>
        <span className="text-xs font-semibold text-zinc-400">Explore sem sair da biblioteca</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {shortcuts.map(({ label, detail, Icon, onClick }) => (
          <button key={label} type="button" onClick={onClick} className="group flex min-h-[92px] items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md sm:p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-extrabold leading-tight text-zinc-900">{label}</span><span className="mt-1 block text-[11px] leading-tight text-zinc-500">{detail}</span></span>
            <ArrowRight className="hidden h-3.5 w-3.5 text-zinc-400 group-hover:text-orange-500 sm:block" />
          </button>
        ))}
      </div>
      {categories.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-orange-500" /><h3 className="text-sm font-extrabold text-zinc-800">Explorar por categoria</h3><span className="ml-auto text-[11px] font-medium text-zinc-400">{catalog?.categories.length || 0} categorias</span></div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const active = activeCategories.includes(category.id)
              return (
                <button key={category.id} type="button" onClick={() => onCategory(category.id)} aria-pressed={active} className={cn('inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors', active ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-orange-300 hover:bg-orange-50')}>
                  <span className="text-base" aria-hidden="true">{category.emoji}</span> {category.name}
                  <span className={cn('text-[10px]', active ? 'text-white/80' : 'text-zinc-400')}>{category.artCount}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
