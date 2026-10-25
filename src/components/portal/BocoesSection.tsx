'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Download, EyeOff, Link2, Loader2, SearchX, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatArtCode } from '@/lib/art-code'

type Bocao = { id: string; artId: string; code: number; title: string; note: string; imageUrl: string; artImageUrl: string; isRejected: boolean }
type BocaoPage = { bocoes: Bocao[]; total: number; page: number; hasMore: boolean }

export function BocoesSection({ search, demo, onSeeArt }: { search: string; demo: boolean; onSeeArt: (bocao: Bocao) => void }) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Bocao | null>(null)
  const [loadingId, setLoadingId] = useState('')
  useEffect(() => { setPage(1); setSelected(null) }, [search])
  const query = useQuery<BocaoPage>({
    queryKey: ['bocoes', search, page],
    queryFn: async () => {
      const res = await fetch(`/api/bocoes?q=${encodeURIComponent(search)}&page=${page}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Falha ao carregar os bocões.')
      return res.json()
    },
  })
  const download = async (b: Bocao) => {
    if (demo) return toast.info('Downloads estão bloqueados na conta Preview.')
    setLoadingId(b.id)
    try {
      const res = await fetch(`/api/bocoes/${b.id}/download`)
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Não foi possível baixar o bocão.') }
      const json = (res.headers.get('content-type') || '').includes('application/json')
      const data = json ? await res.json() : null
      const url = json ? data.url : URL.createObjectURL(await res.blob())
      const a = document.createElement('a')
      a.href = url
      a.download = json ? data.filename : `${formatArtCode(b.code)}-bocao.png`
      document.body.appendChild(a); a.click(); a.remove()
      if (!json) setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success(`Bocão ${formatArtCode(b.code)} preparado para download!`)
      qc.invalidateQueries({ queryKey: ['catalog'] })
      qc.invalidateQueries({ queryKey: ['arts'] })
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha no download.') }
    finally { setLoadingId('') }
  }
  const artButton = (b: Bocao) => <Button variant="outline" onClick={() => { setSelected(null); onSeeArt(b) }} className="flex-1 rounded-xl border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100"><Link2 className="mr-1 h-4 w-4"/> Ver arte principal</Button>
  const downloadButton = (b: Bocao) => <Button disabled={demo || loadingId === b.id} onClick={() => download(b)} className="flex-1 rounded-xl bg-orange-500 font-extrabold text-white hover:bg-orange-600">{demo ? <EyeOff className="mr-1 h-4 w-4"/> : loadingId === b.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <Download className="mr-1 h-4 w-4"/>}{demo ? 'Bloqueado na demo' : 'Baixar bocão'}</Button>
  return <section className="space-y-5" aria-label="Biblioteca exclusiva de bocões">
    <div className="rounded-2xl border border-orange-400/25 bg-gradient-to-r from-[#131d30] to-[#251b19] p-5 text-white sm:p-7">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-300">Complementos para canecas</span>
      <h1 className="mt-2 flex items-center gap-2 text-2xl font-black sm:text-3xl"><ImageIcon className="h-7 w-7 text-orange-400"/> Bocão</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Encontre o bocão correspondente à sua estampa usando o <strong className="text-white">mesmo código CG</strong>. Cada complemento é baixado separadamente da arte principal.</p>
      {search && <p className="mt-3 text-xs font-bold text-orange-300">Busca ativa: {search}</p>}
    </div>
    <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-slate-300"><span>{query.data?.total ?? '…'} {query.data?.total === 1 ? 'bocão disponível' : 'bocões disponíveis'}</span><span>Pesquise pelo CG ou título usando o campo de busca acima.</span></div>
    {query.isLoading && <div className="py-16 text-center text-slate-300"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin"/> Carregando complementos...</div>}
    {query.isError && <div role="alert" className="rounded-2xl bg-white p-6 text-zinc-800">Não foi possível carregar os bocões. <Button variant="outline" onClick={() => query.refetch()}>Tentar novamente</Button></div>}
    {!query.isLoading && !query.isError && !query.data?.bocoes.length && <div className="rounded-2xl border border-white/10 bg-[#121c2b] p-12 text-center"><SearchX className="mx-auto mb-4 h-10 w-10 text-orange-400"/><h2 className="text-lg font-black text-white">Nenhum bocão encontrado</h2><p className="mt-2 text-sm text-slate-400">Confira se o código CG está correto ou tente outra busca. Novos complementos serão adicionados aqui.</p></div>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{query.data?.bocoes.map((b) => <article key={b.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"><button type="button" className="block w-full bg-zinc-100 p-3" aria-label={`Ampliar bocão ${formatArtCode(b.code)}`} onClick={() => setSelected(b)}><img src={b.imageUrl} draggable={false} alt={`Bocão da arte ${b.title}`} className="aspect-[21/10] w-full object-contain"/></button><div className="space-y-3 p-4"><div className="flex items-center justify-between gap-2"><h2 className="line-clamp-2 text-sm font-extrabold text-zinc-900">{b.title}</h2><span className="shrink-0 rounded-lg bg-zinc-950 px-2 py-1 font-mono text-[11px] font-black text-orange-300">{formatArtCode(b.code)}</span></div>{b.note && <p className="line-clamp-2 text-xs text-zinc-500">{b.note}</p>}<div className="flex flex-col gap-2 sm:flex-row">{artButton(b)}{downloadButton(b)}</div></div></article>)}</div>
    {query.data && query.data.total > 24 && <div className="flex items-center justify-center gap-4"><Button disabled={page <= 1} variant="outline" onClick={() => setPage((v) => Math.max(1, v - 1))}>Anterior</Button><span className="text-xs font-bold text-slate-300">Página {page}</span><Button disabled={!query.data.hasMore} variant="outline" onClick={() => setPage((v) => v + 1)}>Próxima</Button></div>}
    <Dialog open={!!selected} onOpenChange={(value) => { if (!value) setSelected(null) }}><DialogContent className="max-h-[94dvh] max-w-4xl overflow-y-auto bg-[#121a2a] text-white"><DialogHeader><DialogTitle>Bocão — {selected && formatArtCode(selected.code)}</DialogTitle><DialogDescription>O código CG é o mesmo da estampa principal. Cada imagem tem seu próprio arquivo.</DialogDescription></DialogHeader>{selected && <div className="space-y-4"><div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-white p-3"><img className="aspect-[21/10] w-full object-contain" draggable={false} src={selected.artImageUrl} alt="Estampa principal"/><p className="mt-2 text-xs font-black text-zinc-800">Arte principal · {formatArtCode(selected.code)}</p></div><div className="rounded-xl bg-white p-3"><img className="aspect-[21/10] w-full object-contain" draggable={false} src={selected.imageUrl} alt="Bocão correspondente"/><p className="mt-2 text-xs font-black text-zinc-800">Complemento Bocão · {formatArtCode(selected.code)}</p></div></div>{demo && <p className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-200">Modo Preview: imagens protegidas e downloads bloqueados.</p>}{selected.note && <p className="text-sm text-slate-300">{selected.note}</p>}<div className="flex flex-col gap-2 sm:flex-row">{artButton(selected)}{downloadButton(selected)}</div></div>}</DialogContent></Dialog>
  </section>
}
