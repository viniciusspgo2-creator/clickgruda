'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronDown, Hash, Search, X } from 'lucide-react'
import type { CatalogData } from '@/lib/types'
import { cn } from '@/lib/utils'

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

/** Tags em um seletor compacto e pesquisável, mesmo com centenas de opções. */
export function TagFilterPanel({
  tags,
  selected,
  onChange,
}: {
  tags: CatalogData['tags']
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const matching = useMemo(() => {
    const needle = normalize(search.trim().replace(/^#/, ''))
    return tags
      .filter((tag) => !needle || normalize(tag.name).includes(needle))
      .sort((a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)) || b.artCount - a.artCount || a.name.localeCompare(b.name, 'pt-BR'))
  }, [search, selected, tags])
  const visible = showAll || search ? matching : matching.slice(0, 35)

  return (
    <section className="mt-5 border-t border-zinc-100 pt-4" aria-label="Filtros por tags">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-zinc-50"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Hash className="h-4 w-4" /></span>
        <span className="flex-1"><span className="block text-sm font-extrabold text-zinc-800">Filtrar por tags</span><span className="block text-[11px] text-zinc-400">{tags.length} temas disponíveis</span></span>
        {selected.length > 0 && <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">{selected.length}</span>}
        <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform', expanded && 'rotate-180')} />
      </button>

      {selected.length > 0 && !expanded && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {tags.filter((tag) => selected.includes(tag.id)).map((tag) => (
            <button key={tag.id} type="button" onClick={() => onChange(selected.filter((id) => id !== tag.id))} title="Remover filtro" className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 hover:bg-orange-100">#{tag.name}<X className="h-3 w-3" /></button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setShowAll(false) }} placeholder="Buscar uma tag..." aria-label="Buscar tags" className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-8 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
            {search && <button type="button" aria-label="Limpar busca de tags" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="mt-2 max-h-52 space-y-0.5 overflow-y-auto pr-1 scrollbar-thin">
            {visible.map((tag) => {
              const active = selected.includes(tag.id)
              return (
                <button key={tag.id} type="button" aria-pressed={active} onClick={() => onChange(active ? selected.filter((id) => id !== tag.id) : [...selected, tag.id])} className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors', active ? 'bg-orange-100 font-bold text-orange-700' : 'text-zinc-600 hover:bg-white hover:text-zinc-900')}>
                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', active ? 'border-orange-500 bg-orange-500 text-white' : 'border-zinc-300 bg-white')}>{active && <Check className="h-3 w-3" />}</span>
                  <span className="min-w-0 flex-1 truncate">#{tag.name}</span>
                  <span className="text-[10px] text-zinc-400">{tag.artCount}</span>
                </button>
              )
            })}
            {!matching.length && <p className="px-2 py-5 text-center text-xs text-zinc-500">Nenhuma tag encontrada. Tente outro termo.</p>}
          </div>
          {!search && matching.length > 35 && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 w-full rounded-lg py-2 text-xs font-bold text-orange-600 hover:bg-orange-50">
              {showAll ? 'Mostrar principais' : `Ver todas as ${matching.length} tags`}
            </button>
          )}
          {selected.length > 0 && <button type="button" onClick={() => onChange([])} className="mt-1 w-full rounded-lg py-2 text-xs font-semibold text-zinc-500 hover:bg-white hover:text-red-600">Remover filtros de tags ({selected.length})</button>}
        </div>
      )}
    </section>
  )
}
