'use client'

import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Check, ImagePlus, Link2, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatArtCode } from '@/lib/art-code'
import { uploadArtFile } from '@/lib/art-upload'

type LinkedArt = { id: string; code: number; title: string; imageUrl: string; bocaoId?: string | null }
type BocaoAdmin = { id: string; artId: string; imageUrl: string; originalKey: string | null; note: string; art: LinkedArt }
const initial = { id: '', artId: '', imageUrl: '', originalKey: '', note: '' }

export function AdminBocoesSection() {
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [artSearch, setArtSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  useEffect(() => { const t = setTimeout(() => { setDebounced(search); setPage(1) }, 300); return () => clearTimeout(t) }, [search])
  useEffect(() => { const t = setTimeout(() => setQuery(artSearch.trim()), 300); return () => clearTimeout(t) }, [artSearch])

  const bocoesQ = useQuery<{ bocoes: BocaoAdmin[]; total: number; hasMore: boolean }>({
    queryKey: ['admin-bocoes', debounced, page],
    queryFn: async () => { const res = await fetch(`/api/admin/bocoes?q=${encodeURIComponent(debounced)}&page=${page}`); if (!res.ok) throw new Error('Não foi possível carregar os bocões'); return res.json() },
  })
  const artsQ = useQuery<{ arts: LinkedArt[] }>({
    queryKey: ['admin-bocao-art-search', query],
    queryFn: async () => { const res = await fetch(`/api/admin/arts?q=${encodeURIComponent(query)}&page=1`); if (!res.ok) throw new Error('Erro ao pesquisar código CG'); return res.json() },
    enabled: open && query.length >= 2,
  })
  const selected = artsQ.data?.arts.find((a) => a.id === form.artId) || bocoesQ.data?.bocoes.find((b) => b.artId === form.artId)?.art
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-bocoes'] })
    queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
    queryClient.invalidateQueries({ queryKey: ['arts'] })
    queryClient.invalidateQueries({ queryKey: ['catalog'] })
    queryClient.invalidateQueries({ queryKey: ['bocoes'] })
  }
  const create = () => { setForm(initial); setArtSearch(''); setOpen(true) }
  const edit = (b: BocaoAdmin) => {
    setForm({ id: b.id, artId: b.artId, imageUrl: b.imageUrl, originalKey: b.originalKey || '', note: b.note })
    setArtSearch(formatArtCode(b.art.code)); setOpen(true)
  }
  const upload = async (file: File) => {
    setUploading(true)
    try { const result = await uploadArtFile(file); setForm((f) => ({ ...f, imageUrl: result.imageUrl, originalKey: result.originalKey || '' })); toast.success('Bocão enviado!') }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Erro no upload') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const save = async () => {
    if (!form.artId) return toast.error('Selecione a arte pelo código CG antes de salvar.')
    if (!form.imageUrl) return toast.error('Envie a imagem do bocão.')
    setSaving(true)
    try {
      const res = await fetch(form.id ? `/api/admin/bocoes/${form.id}` : '/api/admin/bocoes', {
        method: form.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artId: form.artId, imageUrl: form.imageUrl, originalKey: form.originalKey || null, note: form.note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar bocão.')
      toast.success(form.id ? 'Bocão atualizado!' : 'Bocão vinculado à arte!')
      setOpen(false); refresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao salvar') }
    finally { setSaving(false) }
  }
  const remove = async (b: BocaoAdmin) => {
    if (!window.confirm(`Excluir o bocão de ${formatArtCode(b.art.code)}? A arte principal será mantida.`)) return
    setDeletingId(b.id)
    try {
      const res = await fetch(`/api/admin/bocoes/${b.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir o complemento.')
      toast.success('Bocão removido. A arte principal foi preservada.'); refresh()
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Erro ao excluir') }
    finally { setDeletingId('') }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
      <div><div className="flex items-center gap-2"><Link2 className="h-5 w-5 text-orange-500"/><h2 className="text-xl font-black text-zinc-900">Biblioteca de Bocões</h2></div>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">Cada bocão fica associado a uma arte existente e exibe <strong>o mesmo código CG</strong>. Um complemento por código; arquivos e downloads separados.</p></div>
      <Button onClick={create} className="rounded-xl bg-orange-500 font-black text-white hover:bg-orange-600"><Plus className="mr-2 h-4 w-4"/> Cadastrar bocão</Button>
    </div>
    <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"><Search className="h-4 w-4 text-zinc-400"/><Input aria-label="Pesquisar bocões" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código CG-0042 ou título" className="border-0 shadow-none"/><span className="shrink-0 text-xs font-bold text-zinc-500">{bocoesQ.data?.total ?? '…'} bocões</span></div>
    {bocoesQ.isError && <p role="alert" className="text-sm font-semibold text-red-600">Erro ao carregar a lista. Confira se a migração foi aplicada no Neon.</p>}
    {!bocoesQ.isLoading && !bocoesQ.isError && !bocoesQ.data?.bocoes.length && <div className="rounded-xl bg-white p-12 text-center text-sm text-zinc-500">Nenhum bocão cadastrado. Clique em “Cadastrar bocão” para começar.</div>}
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{bocoesQ.data?.bocoes.map((b) => <div key={b.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 gap-2 bg-zinc-50 p-3"><div><img className="aspect-[21/10] w-full rounded-lg bg-white object-contain" src={b.art.imageUrl} alt="Arte principal"/><span className="text-[10px] font-semibold text-zinc-500">Estampa original</span></div><div><img className="aspect-[21/10] w-full rounded-lg bg-white object-contain" src={b.imageUrl} alt="Bocão"/><span className="text-[10px] font-semibold text-orange-600">Bocão</span></div></div>
      <div className="space-y-2 p-3"><span className="rounded-lg bg-zinc-900 px-2 py-1 font-mono text-xs font-black text-orange-300">{formatArtCode(b.art.code)}</span><p className="line-clamp-1 text-sm font-bold text-zinc-800" title={b.art.title}>{b.art.title}</p>{b.note && <p className="line-clamp-2 text-xs text-zinc-500">{b.note}</p>}
        <div className="flex gap-2"><Button size="sm" variant="outline" className="flex-1" onClick={() => edit(b)}><Pencil className="mr-1 h-3.5 w-3.5"/> Editar</Button><Button size="sm" variant="outline" className="text-red-600" disabled={deletingId === b.id} onClick={() => remove(b)}><Trash2 className="h-4 w-4"/></Button></div></div>
    </div>)}</div>
    {bocoesQ.data && bocoesQ.data.total > 30 && <div className="flex items-center justify-center gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1,v-1))}>Anterior</Button><span className="text-xs font-bold text-zinc-600">Página {page}</span><Button variant="outline" disabled={!bocoesQ.data.hasMore} onClick={() => setPage((v) => v+1)}>Próxima</Button></div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto bg-white text-zinc-900"><DialogHeader><DialogTitle>{form.id ? 'Editar bocão' : 'Cadastrar bocão'}</DialogTitle><DialogDescription>Pesquise a arte principal pelo código CG e anexe a imagem complementar. O código é herdado automaticamente.</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <div><label htmlFor="bocao-art-search" className="text-xs font-black uppercase text-zinc-500">Localizar arte pelo código CG</label><Input id="bocao-art-search" className="mt-1" placeholder="CG-0042 ou título da estampa" value={artSearch} onChange={(e) => { setArtSearch(e.target.value); setForm((f) => ({ ...f, artId: '' })) }}/></div>
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-zinc-200 p-2">
          {selected && !artsQ.data?.arts.some((a) => a.id === selected.id) && <p className="text-xs text-zinc-500">Arte atual: {formatArtCode(selected.code)} · {selected.title}</p>}
          {artsQ.isFetching && <p className="p-2 text-xs text-zinc-500">Buscando arte...</p>}
          {artsQ.data?.arts.map((art) => <button key={art.id} type="button" onClick={() => setForm((f) => ({ ...f, artId: art.id }))} className={`flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-orange-50 ${form.artId === art.id ? 'bg-orange-100 ring-1 ring-orange-300' : ''}`}><img src={art.imageUrl} alt="" className="h-11 w-20 shrink-0 rounded object-contain"/><div className="min-w-0 flex-1"><p className="font-mono text-xs font-black text-orange-700">{formatArtCode(art.code)}</p><p className="truncate text-xs text-zinc-700">{art.title}</p></div>{form.artId === art.id && <Check className="h-5 w-5 text-green-600"/>}{art.bocaoId && art.bocaoId !== form.id && <span className="text-[10px] text-red-600">Já possui bocão</span>}</button>)}
          {query.length < 2 && !form.artId && <p className="p-2 text-xs text-zinc-400">Digite pelo menos 2 caracteres para buscar.</p>}
        </div>
        <p className="rounded-xl bg-orange-50 p-3 text-xs font-bold text-orange-900"><Link2 className="mr-1 inline h-4 w-4"/>{form.artId && selected ? `Vínculo: ${formatArtCode(selected.code)} — ${selected.title}` : 'Selecione a arte principal para herdar o código CG.'}</p>
        <div><label className="text-xs font-black uppercase text-zinc-500">Arquivo do bocão</label><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]) }}/><button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-1 flex min-h-36 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 p-4 text-center text-sm font-bold text-orange-600">{form.imageUrl ? <img src={form.imageUrl} alt="Prévia do bocão" className="max-h-48 w-full object-contain"/> : uploading ? <Loader2 className="h-6 w-6 animate-spin"/> : <ImagePlus className="h-7 w-7"/>}<span className="mt-2"><Upload className="mr-1 inline h-4 w-4"/>{uploading ? 'Enviando...' : 'Selecionar arquivo PNG, JPG ou WEBP (até 15 MB)'}</span></button></div>
        <div><label htmlFor="bocao-note" className="text-xs font-black uppercase text-zinc-500">Observação opcional</label><Input id="bocao-note" value={form.note} maxLength={300} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Ex: aplique na região inferior da caneca"/></div>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}><X className="mr-1 h-4 w-4"/> Cancelar</Button><Button className="bg-orange-500 text-white hover:bg-orange-600" disabled={saving || uploading || !form.artId || !form.imageUrl || !!artsQ.data?.arts.find((a) => a.id === form.artId && !!a.bocaoId && a.bocaoId !== form.id)} onClick={save}>{saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin"/> : <Check className="mr-1 h-4 w-4"/>} Salvar bocão</Button></div>
      </div>
    </DialogContent></Dialog>
  </div>
}
