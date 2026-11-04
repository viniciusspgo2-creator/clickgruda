'use client'

export function paginationPages(page: number, total: number): (number | 'gap-left' | 'gap-right')[] {
  const last = Math.max(1, total)
  const current = Math.min(last, Math.max(1, page))
  const nearby = new Set([1, last, current - 2, current - 1, current, current + 1, current + 2].filter(value => value >= 1 && value <= last))
  const pages = [...nearby].sort((a, b) => a - b)
  const result: (number | 'gap-left' | 'gap-right')[] = []
  pages.forEach((value, index) => { if (index && value - pages[index - 1] > 1) result.push(value < current ? 'gap-left' : 'gap-right'); result.push(value) })
  return result
}

export function NumberedPagination({ page, totalPages, onChange, busy = false }: { page: number; totalPages: number; onChange: (page: number) => void; busy?: boolean }) {
  const go = (value: number) => onChange(Math.min(totalPages, Math.max(1, value)))
  return <nav aria-label="Páginas das artes" className="flex flex-wrap items-center justify-end gap-1.5">
    <button type="button" onClick={() => go(page - 1)} disabled={page <= 1 || busy} className="min-h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 disabled:opacity-40">Anterior</button>
    {paginationPages(page, totalPages).map(value => typeof value === 'number' ? <button key={value} type="button" aria-label={`Ir para a página ${value}`} aria-current={page === value ? 'page' : undefined} onClick={() => go(value)} disabled={busy} className={`min-h-9 min-w-9 rounded-lg border px-2 text-xs font-bold focus-visible:outline-2 focus-visible:outline-orange-500 disabled:opacity-50 ${page === value ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-400'}`}>{value}</button> : <span key={value} className="px-1 text-zinc-400" aria-hidden>…</span>)}
    <button type="button" onClick={() => go(page + 1)} disabled={page >= totalPages || busy} className="min-h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-bold text-zinc-700 disabled:opacity-40">Próxima</button>
  </nav>
}
