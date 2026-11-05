'use client'

import { ArrowRight, Flame, Lightbulb, Sparkles, Star, TrendingUp } from 'lucide-react'
import type { PortalTab, SortMode } from '@/lib/store'

/** Atalhos reais para filtros existentes. Não cria "coleções" fictícias nem mockups. */
export function DiscoveryShelf({
  onTab,
  onSuggest,
}: {
  onTab: (tab: PortalTab, sort?: SortMode) => void
  onSuggest: () => void
}) {
  const shortcuts = [
    { label: 'Lançamentos', detail: 'Artes com selo NOVO', Icon: Flame, onClick: () => onTab('lancamentos') },
    { label: 'Escolhas da equipe', detail: 'Curadoria especial', Icon: Star, onClick: () => onTab('selecionadas') },
    { label: 'Mais baixadas', detail: 'Preferidas da comunidade', Icon: TrendingUp, onClick: () => onTab('todas', 'baixadas') },
    { label: 'Sugerir uma arte', detail: 'Dê sua sugestão', Icon: Lightbulb, onClick: onSuggest },
  ]

  return (
    <section className="cg-discovery mb-7 space-y-5" aria-label="Explore a biblioteca por temas">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-orange-400"><Sparkles className="h-3.5 w-3.5" /> Descubra novas ideias</div>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-50 sm:text-2xl">Encontre a arte ideal para cada projeto</h2>
        </div>
        <span className="text-xs font-medium text-slate-400">Explore sem sair da biblioteca</span>
      </div>
      <div className="cg-discovery-grid grid grid-cols-2 gap-3 xl:grid-cols-4">
        {shortcuts.map(({ label, detail, Icon, onClick }) => (
          <button key={label} type="button" onClick={onClick} className="cg-discovery-tile group relative flex min-h-[110px] items-center gap-3 overflow-hidden rounded-2xl p-3 text-left sm:p-4">
            <span className="cg-discovery-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-extrabold leading-tight text-white">{label}</span><span className="mt-1 block text-[11px] leading-tight text-slate-400">{detail}</span></span>
            <ArrowRight className="hidden h-3.5 w-3.5 text-slate-500 group-hover:text-orange-400 sm:block" />
          </button>
        ))}
      </div>

    </section>
  )
}
