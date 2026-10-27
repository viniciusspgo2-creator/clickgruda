'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarHeart, Check, Sparkles, Layers3, FilterX, LayoutGrid, List, ImageOff, Images, Cloud, CreditCard, Eye, Image as ImageIcon, Lightbulb, Loader2, Pencil, Plus, QrCode, RotateCcw, Save, Search, Smile, Star, Tag as TagIcon, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { CATEGORY_ICONS, getCategoryIcon } from '@/lib/category-icons'
import { uploadArtFile } from '@/lib/art-upload'
import { formatArtCode } from '@/lib/art-code'
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog'
import { BulkEditArtsDialog, type BulkArtSelection } from '@/components/admin/BulkEditArtsDialog'
import { type AdminArtFilters, hasActiveAdminArtFilters } from '@/lib/admin-art-filters'
import type { ArtItem } from '@/lib/types'
import { cn } from '@/lib/utils'

/* ==================== BIBLIOTECA DE ÍCONES (seletor) ==================== */

/**
 * IconPicker — biblioteca de ícones padronizada para categorias.
 * Busca por rótulo em PT-BR + grade de ícones; o slug escolhido é salvo
 * em Category.icon e usado no portal, no catálogo compartilhado e aqui.
 */
function IconPicker({
  value,
  onChange,
  placeholder = 'Ícone',
}: {
  value: string
  onChange: (name: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    if (!s) return CATEGORY_ICONS
    return CATEGORY_ICONS.filter((i) => i.name.includes(s) || i.label.toLowerCase().includes(s))
  }, [search])

  const current = getCategoryIcon(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label="Escolher ícone da categoria"
          className="h-10 w-full justify-start gap-2.5 rounded-xl px-3 font-bold sm:w-28"
        >
          {current ? (
            <current.Icon className="h-5 w-5 text-orange-500" />
          ) : (
            <Smile className="h-5 w-5 text-zinc-400" />
          )}
          <span className="truncate text-xs">{current ? 'Trocar' : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,26rem)] rounded-2xl p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Buscar entre ${CATEGORY_ICONS.length} ícones... (café, festa, médica)`}
            className="h-9 rounded-xl border-zinc-200 pl-8 text-sm"
          />
        </div>
        <div className="mt-2.5 grid max-h-72 grid-cols-7 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-8">
          {filtered.map((icon) => {
            const selected = value === icon.name
            return (
              <button
                key={icon.name}
                type="button"
                title={icon.label}
                aria-label={`Ícone ${icon.label}`}
                onClick={() => {
                  onChange(icon.name)
                  setOpen(false)
                  setSearch('')
                }}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                  selected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-orange-100 hover:text-orange-600'
                )}
              >
                <icon.Icon className="h-4.5 w-4.5" />
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-6 text-center text-xs text-zinc-400">Nenhum ícone encontrado. Tente outra palavra (ex: festa, comida, animal).</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ==================== ARTS ==================== */

type ArtFormState = {
  id?: string
  title: string
  imageUrl: string
  originalKey?: string
  categoryId: string
  seasonalEventId: string
  tagNames: string[]
  isLaunch: boolean
  isSelected: boolean
  isRejected: boolean
}

const emptyForm: ArtFormState = {
  title: '',
  imageUrl: '',
  categoryId: 'none',
  seasonalEventId: 'none',
  tagNames: [],
  isLaunch: true,
  isSelected: false,
  isRejected: false,
}

export function AdminArtsSection() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editBulkOpen, setEditBulkOpen] = useState(false)
  const [deleteBulkOpen, setDeleteBulkOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingBulk, setDeletingBulk] = useState(false)
  const [creatingTag, setCreatingTag] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [allSelection, setAllSelection] = useState<{ filters: AdminArtFilters; count: number; excludedIds: Set<string> } | null>(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSeasonal, setFilterSeasonal] = useState('all')
  const [filterLaunch, setFilterLaunch] = useState('all')
  const [filterSelected, setFilterSelected] = useState('all')
  const [filterQuality, setFilterQuality] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [form, setForm] = useState<ArtFormState>(emptyForm)
  const [tagInput, setTagInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Lista paginada no servidor (40 por página) — funciona com milhares de artes
  const [page, setPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
      setAllSelection(null)
    }, 300)
    return () => clearTimeout(t)
  }, [search])
  const filters = useMemo<AdminArtFilters>(() => ({
    q: debouncedSearch, categoryId: filterCategory, seasonalEventId: filterSeasonal,
    launch: filterLaunch, selected: filterSelected, quality: filterQuality,
  }), [debouncedSearch, filterCategory, filterSeasonal, filterLaunch, filterSelected, filterQuality])
  const artsQ = useQuery<{ arts: ArtItem[]; total: number; page: number; pageSize: number; hasMore: boolean }>({
    queryKey: ['admin-arts', page, filters],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page) })
      if (filters.q) p.set('q', filters.q)
      if (filters.categoryId !== 'all') p.set('categoryId', filters.categoryId)
      if (filters.seasonalEventId !== 'all') p.set('seasonalEventId', filters.seasonalEventId)
      if (filters.launch !== 'all') p.set('launch', filters.launch)
      if (filters.selected !== 'all') p.set('selected', filters.selected)
      if (filters.quality !== 'all') p.set('quality', filters.quality)
      const response = await fetch(`/api/admin/arts?${p.toString()}`)
      if (!response.ok) throw new Error('Falha ao buscar artes.')
      return response.json()
    },
    placeholderData: keepPreviousData,
  })
  const catQ = useQuery<{ categories: { id: string; name: string; emoji: string; icon: string }[] }>({ queryKey: ['admin-categories'], queryFn: async () => (await fetch('/api/admin/categories')).json() })
  const evtQ = useQuery<{ events: { id: string; name: string; emoji: string }[] }>({ queryKey: ['admin-seasonal'], queryFn: async () => (await fetch('/api/admin/seasonal')).json() })
  const tagsQ = useQuery<{ tags: { id: string; name: string }[] }>({ queryKey: ['admin-tags'], queryFn: async () => (await fetch('/api/admin/tags')).json() })

  const openNew = () => {
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (art: ArtItem) => {
    setForm({
      id: art.id,
      title: art.title,
      imageUrl: art.imageUrl,
      categoryId: art.category?.id || 'none',
      seasonalEventId: art.seasonalEvent?.id || 'none',
      tagNames: art.tags.map((t) => t.name),
      isLaunch: art.isLaunch,
      isSelected: art.isSelected,
      isRejected: Boolean(art.isRejected),
    })
    setFormOpen(true)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const r = await uploadArtFile(file)
      setForm((f) => ({ ...f, imageUrl: r.imageUrl, originalKey: r.originalKey }))
      toast.success(r.r2 ? 'Original salvo no R2 (privado) e prévia WebP gerada!' : 'Imagem enviada!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha no upload.')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.title.trim()) return toast.error('Dê um título para a arte.')
    if (!form.imageUrl) return toast.error('Envie a imagem da arte antes de salvar.')
    setSaving(true)
    try {
      const body = {
        title: form.title,
        imageUrl: form.imageUrl,
        originalKey: form.originalKey,
        categoryId: form.categoryId === 'none' ? null : form.categoryId,
        seasonalEventId: form.seasonalEventId === 'none' ? null : form.seasonalEventId,
        tagNames: form.tagNames,
        isLaunch: form.isLaunch,
        isSelected: form.isSelected,
        isRejected: form.isRejected,
      }
      const res = await fetch(form.id ? `/api/admin/arts/${form.id}` : '/api/admin/arts', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Erro ao salvar.')
        return
      }
      toast.success(form.id ? 'Arte atualizada!' : 'Arte publicada! 🎉')
      setFormOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
      queryClient.invalidateQueries({ queryKey: ['arts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    } finally {
      setSaving(false)
    }
  }

  const createTagHere = async () => {
    const name = tagInput.trim().toLowerCase().slice(0, 60)
    if (!name) return toast.error('Escreva o nome da nova tag.')
    if (form.tagNames.includes(name)) { setTagInput(''); return }
    setCreatingTag(true)
    try {
      const exists = (tagsQ.data?.tags || []).some((t) => t.name === name)
      if (!exists) {
        const res = await fetch('/api/admin/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
        if (!res.ok && res.status !== 409) throw new Error((await res.json()).error || 'Falha ao criar tag')
        await queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      }
      setForm((f) => ({ ...f, tagNames: [...new Set([...f.tagNames, name])] }))
      setTagInput('')
      toast.success(exists ? 'Tag adicionada à arte.' : 'Nova tag criada e adicionada!')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao criar tag.') }
    finally { setCreatingTag(false) }
  }

  async function deleteSelectedArts() {
    if (deletingBulk || selectionCount === 0 || deleteConfirmation !== 'EXCLUIR') return
    setDeletingBulk(true)
    try {
      const res = await fetch('/api/admin/arts/bulk', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bulkSelection, expectedCount: bulkSelection.count, confirmation: 'EXCLUIR' }) })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Falha ao excluir as artes selecionadas.')
      toast.success(`${result.deleted} arte(s) excluída(s) do banco de dados.`)
      setDeleteBulkOpen(false); setDeleteConfirmation(''); onBulkApplied()
      setPage(1)
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Falha na exclusão.') }
    finally { setDeletingBulk(false) }
  }

  // Estrela rápida: marca/desmarca a arte como "Selecionada" direto na lista
  const toggleSelected = useMutation({
    mutationFn: async (art: ArtItem) => {
      const res = await fetch(`/api/admin/arts/${art.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSelected: !art.isSelected }),
      })
      if (!res.ok) throw new Error()
      return !art.isSelected
    },
    onSuccess: (now) => {
      queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
      queryClient.invalidateQueries({ queryKey: ['arts'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(now ? 'Arte adicionada às Selecionadas ⭐' : 'Arte removida das Selecionadas.')
    },
    onError: () => toast.error('Não foi possível atualizar a arte.'),
  })

  // Lançamentos podem ser ativados ou desativados sem abrir a janela de edição.
  const toggleLaunch = useMutation({
    mutationFn: async (art: ArtItem) => {
      const res = await fetch(`/api/admin/arts/${art.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLaunch: !art.isLaunch }),
      })
      if (!res.ok) throw new Error('Não foi possível alterar o lançamento.')
      return !art.isLaunch
    },
    onSuccess: (now) => {
      queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
      queryClient.invalidateQueries({ queryKey: ['arts'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(now ? 'Arte marcada como lançamento ✨' : 'Lançamento removido.')
    },
    onError: () => toast.error('Erro ao atualizar o lançamento.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/arts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: (_, id) => {
      setSelectedIds((previous) => { const next = new Set(previous); next.delete(id); return next })
      setAllSelection(null)
      queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      queryClient.invalidateQueries({ queryKey: ['arts'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Arte excluída.')
    },
    onError: () => toast.error('Erro ao excluir arte.'),
  })

  const arts = artsQ.data?.arts ?? []
  const totalArts = artsQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalArts / (artsQ.data?.pageSize || 40)))

  const selectionCount = allSelection ? Math.max(0, allSelection.count - allSelection.excludedIds.size) : selectedIds.size
  const isSelectedForBulk = (id: string) => allSelection ? !allSelection.excludedIds.has(id) : selectedIds.has(id)
  const selectedOnPage = arts.filter((art) => isSelectedForBulk(art.id)).length
  const allPageChecked = arts.length > 0 && selectedOnPage === arts.length
  const bulkSelection: BulkArtSelection = allSelection
    ? { scope: 'filter', filters: allSelection.filters, excludedIds: [...allSelection.excludedIds], count: selectionCount }
    : { scope: 'ids', ids: [...selectedIds], count: selectionCount }

  function toggleArtInBulk(id: string, checked: boolean) {
    if (allSelection) {
      setAllSelection((previous) => {
        if (!previous) return previous
        const excludedIds = new Set(previous.excludedIds)
        if (checked) excludedIds.delete(id)
        else excludedIds.add(id)
        return { ...previous, excludedIds }
      })
    } else {
      setSelectedIds((previous) => {
        const next = new Set(previous)
        if (checked) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }

  function toggleCurrentPage(checked: boolean) {
    if (allSelection) {
      setAllSelection((previous) => {
        if (!previous) return previous
        const excludedIds = new Set(previous.excludedIds)
        for (const art of arts) checked ? excludedIds.delete(art.id) : excludedIds.add(art.id)
        return { ...previous, excludedIds }
      })
    } else {
      setSelectedIds((previous) => {
        const next = new Set(previous)
        for (const art of arts) checked ? next.add(art.id) : next.delete(art.id)
        return next
      })
    }
  }

  function clearBulkSelection() { setSelectedIds(new Set()); setAllSelection(null) }
  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value); setPage(1); setAllSelection(null)
  }
  function onBulkApplied() {
    clearBulkSelection()
    queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    queryClient.invalidateQueries({ queryKey: ['admin-seasonal'] })
    queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
    queryClient.invalidateQueries({ queryKey: ['arts'] })
    queryClient.invalidateQueries({ queryKey: ['catalog'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título ou código (CG-0042)..."
          className="h-10 max-w-sm rounded-xl border-zinc-200 bg-white"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setBulkOpen(true)} variant="outline" className="h-10 rounded-xl border-orange-300 font-black text-orange-600 hover:bg-orange-50">
            <Images className="mr-1.5 h-4 w-4" /> Enviar várias (até 100)
          </Button>
          <Button onClick={openNew} className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25">
            <Plus className="mr-1.5 h-4 w-4" /> Nova arte
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
        <span className="mr-1 text-xs font-black text-zinc-500">Filtrar:</span>
        <Select value={filterCategory} onValueChange={(v) => changeFilter(setFilterCategory, v)}>
          <SelectTrigger className="h-9 w-[min(100%,190px)] rounded-xl text-xs"><SelectValue placeholder="Categorias" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="none">Sem categoria</SelectItem>
            {(catQ.data?.categories || []).map((c) => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeasonal} onValueChange={(v) => changeFilter(setFilterSeasonal, v)}>
          <SelectTrigger className="h-9 w-[min(100%,190px)] rounded-xl text-xs"><SelectValue placeholder="Sazonalidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as datas</SelectItem>
            <SelectItem value="none">Sem data sazonal</SelectItem>
            {(evtQ.data?.events || []).map((e) => <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterLaunch} onValueChange={(v) => changeFilter(setFilterLaunch, v)}>
          <SelectTrigger className="h-9 w-[148px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Lançamento: todos</SelectItem>
            <SelectItem value="yes">Apenas lançamentos</SelectItem>
            <SelectItem value="no">Não lançamentos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSelected} onValueChange={(v) => changeFilter(setFilterSelected, v)}>
          <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Selecionadas: todas</SelectItem>
            <SelectItem value="yes">Apenas selecionadas</SelectItem>
            <SelectItem value="no">Não selecionadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterQuality} onValueChange={(v) => changeFilter(setFilterQuality, v)}>
          <SelectTrigger className="h-9 w-[170px] rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Ambas bibliotecas</SelectItem><SelectItem value="approved">Biblioteca principal</SelectItem><SelectItem value="rejected">Artes reprovadas</SelectItem><SelectItem value="no-tags">Sem tags</SelectItem></SelectContent>
        </Select>
        {(hasActiveAdminArtFilters(filters) || search) && (
          <Button variant="ghost" size="sm" onClick={() => {
            setSearch(''); setDebouncedSearch(''); setFilterCategory('all'); setFilterSeasonal('all')
            setFilterLaunch('all'); setFilterSelected('all'); setFilterQuality('all'); setAllSelection(null); setPage(1)
          }} className="h-9 rounded-lg text-xs text-zinc-500"><FilterX className="mr-1.5 h-3.5 w-3.5" /> Limpar filtros</Button>
        )}
      </div>

      {/* Central de revisão: filtros seguros, sem apagar nem alterar arte automaticamente. */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-extrabold text-zinc-700"><ImageOff className="h-4 w-4 text-orange-500" /> Revisar cadastros</span>
        <button type="button" aria-pressed={filterCategory === 'none'} onClick={() => { changeFilter(setFilterCategory, filterCategory === 'none' ? 'all' : 'none'); setFilterQuality('all') }} className={cn('rounded-lg border px-3 py-2 text-xs font-bold transition-colors', filterCategory === 'none' ? 'border-orange-400 bg-orange-500 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-300 hover:text-orange-700')}>Sem categoria</button>
        <button type="button" aria-pressed={filterQuality === 'rejected'} onClick={() => changeFilter(setFilterQuality, filterQuality === 'rejected' ? 'all' : 'rejected')} className={cn('rounded-lg border px-3 py-2 text-xs font-bold', filterQuality === 'rejected' ? 'bg-orange-500 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600')}>Artes reprovadas</button>
        <button type="button" aria-pressed={filterQuality === 'no-tags'} onClick={() => { changeFilter(setFilterQuality, filterQuality === 'no-tags' ? 'all' : 'no-tags'); setFilterCategory('all') }} className={cn('rounded-lg border px-3 py-2 text-xs font-bold transition-colors', filterQuality === 'no-tags' ? 'border-orange-400 bg-orange-500 text-white' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-orange-300 hover:text-orange-700')}>Sem tags</button>
        <div className="ml-auto inline-flex shrink-0 gap-1 rounded-xl bg-zinc-100 p-1" role="group" aria-label="Visualização das artes">
          <button type="button" aria-pressed={viewMode === 'list'} aria-label="Visualizar artes em lista" title="Modo lista" onClick={() => setViewMode('list')} className={cn('flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold', viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')}><List className="h-4 w-4" /><span className="hidden sm:inline">Lista</span></button>
          <button type="button" aria-pressed={viewMode === 'grid'} aria-label="Visualizar artes em grade" title="Modo visual" onClick={() => setViewMode('grid')} className={cn('flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold', viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-800')}><LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Visual</span></button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 px-3.5 py-3 text-xs">
        <Checkbox
          checked={allPageChecked ? true : selectedOnPage > 0 ? 'indeterminate' : false}
          disabled={!arts.length || artsQ.isFetching}
          onCheckedChange={(v) => toggleCurrentPage(v === true)}
          aria-label="Selecionar artes desta página"
          className="border-orange-400 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
        />
        <span className="font-bold text-zinc-700">Selecionar página <span className="font-normal text-zinc-500">({arts.length} artes)</span></span>
        {totalArts > arts.length && !allSelection && (
          <button type="button" disabled={artsQ.isFetching} className="font-bold text-orange-600 underline-offset-2 hover:underline disabled:opacity-50"
            onClick={() => { setAllSelection({ filters: { ...filters }, count: totalArts, excludedIds: new Set() }); setSelectedIds(new Set()) }}>
            Selecionar todos os {totalArts.toLocaleString('pt-BR')} resultados{hasActiveAdminArtFilters(filters) ? ' filtrados' : ' do acervo'}
          </button>
        )}
        {allSelection && <span className="font-bold text-orange-700">Todos os resultados selecionados{allSelection.excludedIds.size ? `, exceto ${allSelection.excludedIds.size}` : ''}</span>}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {selectionCount > 0 && <span className="rounded-lg bg-white px-2.5 py-1.5 font-black text-orange-600">{selectionCount.toLocaleString('pt-BR')} selecionadas</span>}
          {selectionCount > 0 && <Button size="sm" variant="ghost" className="h-8 rounded-lg text-zinc-500" onClick={clearBulkSelection}>Limpar seleção</Button>}
          <Button size="sm" disabled={selectionCount === 0} variant="outline" className="h-9 rounded-lg border-red-300 font-black text-red-600 hover:bg-red-50" onClick={() => { setDeleteConfirmation(''); setDeleteBulkOpen(true) }}><Trash2 className="mr-1.5 h-4 w-4" /> Excluir selecionadas</Button>
          <Button size="sm" disabled={selectionCount === 0} className="h-9 rounded-lg bg-orange-500 px-3.5 font-black hover:bg-orange-600" onClick={() => setEditBulkOpen(true)}>
            <Layers3 className="mr-1.5 h-4 w-4" /> Editar em lote
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteBulkOpen} onOpenChange={(v) => { if (!deletingBulk) setDeleteBulkOpen(v) }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {selectionCount.toLocaleString('pt-BR')} artes permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>Esta ação remove as artes selecionadas, favoritos e registros de download relacionados do banco de dados. Não tem desfazer. Os arquivos no R2 não serão apagados automaticamente.</AlertDialogDescription></AlertDialogHeader>
          <Label htmlFor="confirm-delete-bulk" className="font-bold text-red-700">Digite EXCLUIR para confirmar</Label>
          <Input id="confirm-delete-bulk" value={deleteConfirmation} onChange={(e) => setDeleteConfirmation(e.target.value)} placeholder="EXCLUIR" autoComplete="off" />
          <AlertDialogFooter><AlertDialogCancel disabled={deletingBulk}>Cancelar</AlertDialogCancel>
            <Button disabled={deletingBulk || deleteConfirmation !== 'EXCLUIR'} onClick={deleteSelectedArts} className="bg-red-600 font-bold hover:bg-red-700">{deletingBulk ? 'Excluindo...' : 'Excluir definitivamente'}</Button>
          </AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <BulkEditArtsDialog
        open={editBulkOpen} onOpenChange={setEditBulkOpen}
        selection={bulkSelection}
        categories={catQ.data?.categories || []}
        events={evtQ.data?.events || []}
        onApplied={onBulkApplied}
      />

      <BulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        categories={catQ.data?.categories || []}
        events={evtQ.data?.events || []}
        knownTags={(tagsQ.data?.tags || []).map((t) => t.name)}
        onPublished={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-arts'] })
          queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
          queryClient.invalidateQueries({ queryKey: ['arts'] })
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
          queryClient.invalidateQueries({ queryKey: ['catalog'] })
        }}
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3 bg-zinc-50/70 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'divide-y divide-zinc-100'}>
          {artsQ.isLoading && <div className="p-6 text-sm text-zinc-400">Carregando artes...</div>}
          {artsQ.isError && <div className="p-6 text-sm text-red-500">Falha ao carregar as artes. <button className="font-bold underline" onClick={() => artsQ.refetch()}>Tentar novamente</button></div>}
          {arts.map((art) => viewMode === 'grid' ? (
            <div key={art.id} className={cn('relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md', isSelectedForBulk(art.id) ? 'border-orange-400 ring-2 ring-orange-100' : 'border-zinc-200')}>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[radial-gradient(circle_at_center,#fff9f3,#f2efeb)] p-2">
                <img src={art.imageUrl} alt={art.title} loading="lazy" className="h-full w-full object-contain" />
                <div className="absolute left-2.5 top-2.5 z-10 rounded-lg bg-white/95 p-2 shadow-sm"><Checkbox disabled={artsQ.isFetching} checked={isSelectedForBulk(art.id)} onCheckedChange={(v) => toggleArtInBulk(art.id, v === true)} aria-label={`Selecionar arte ${formatArtCode(art.code)} para edição em lote`} /></div>
                <button type="button" onClick={() => openEdit(art)} className="absolute bottom-2 right-2 rounded-lg bg-zinc-950/90 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-orange-600"><Pencil className="mr-1 inline h-3 w-3" /> Editar arte</button>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-3.5">
                <div className="flex items-start gap-2"><span className="shrink-0 rounded-md bg-zinc-950 px-1.5 py-1 font-mono text-[10px] font-black text-orange-300">{formatArtCode(art.code)}</span><h3 className="line-clamp-2 text-xs font-extrabold leading-snug text-zinc-900" title={art.title}>{art.title}</h3></div>
                <div className="flex min-h-6 flex-wrap gap-1">
                  {art.category ? <Badge className="bg-orange-50 text-[10px] font-bold text-orange-700">{art.category.emoji} {art.category.name}</Badge> : <Badge className="bg-rose-50 text-[10px] text-rose-600">Sem categoria</Badge>}
                  {art.seasonalEvent && <Badge variant="outline" className="text-[10px] text-zinc-600">{art.seasonalEvent.emoji} {art.seasonalEvent.name}</Badge>}
                  {art.isRejected && <Badge className="bg-red-100 text-[10px] text-red-700">Design reprovado</Badge>}
                  {art.tags.length === 0 && <Badge className="bg-amber-50 text-[10px] text-amber-700">Sem tags</Badge>}
                </div>
                <p className="line-clamp-1 text-[11px] text-zinc-500">{art.tags.map((tag) => `#${tag.name}`).join(' · ') || 'Adicione tags para facilitar a busca'}</p>
                <div className="mt-auto flex items-center gap-1 border-t border-zinc-100 pt-2">
                  <span className="mr-auto text-[11px] text-zinc-400">{art.downloadsCount} downloads</span>
                  <Button size="icon" variant="ghost" disabled={toggleSelected.isPending} onClick={() => toggleSelected.mutate(art)} aria-label={art.isSelected ? 'Remover das Selecionadas' : 'Marcar como Selecionada'} title="Selecionadas" className="h-8 w-8 rounded-lg text-zinc-400"><Star className={cn('h-4 w-4', art.isSelected && 'fill-amber-400 text-amber-500')} /></Button>
                  <Button size="icon" variant="ghost" disabled={toggleLaunch.isPending} onClick={() => toggleLaunch.mutate(art)} aria-label={art.isLaunch ? 'Remover dos lançamentos' : 'Marcar como lançamento'} title="Lançamento" className="h-8 w-8 rounded-lg text-zinc-400"><Sparkles className={cn('h-4 w-4', art.isLaunch && 'fill-orange-400 text-orange-500')} /></Button>
                  <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-50" aria-label="Excluir arte"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir “{art.title}”?</AlertDialogTitle><AlertDialogDescription>A arte deixa de aparecer para todos os clientes. Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => remove.mutate(art.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
                </div>
              </div>
            </div>
          ) : (
            <div key={art.id} className={cn('flex items-center gap-2.5 p-3 transition-colors hover:bg-zinc-50 sm:gap-4 sm:p-3.5', isSelectedForBulk(art.id) && 'bg-orange-50/50')}>
              <Checkbox
                disabled={artsQ.isFetching}
                checked={isSelectedForBulk(art.id)}
                onCheckedChange={(v) => toggleArtInBulk(art.id, v === true)}
                aria-label={`Selecionar arte ${formatArtCode(art.code)} para edição em lote`}
                className="border-zinc-300 data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
              />
              <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:h-12 sm:w-28">
                <img src={art.imageUrl} alt={art.title} className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-bold text-zinc-900">
                  <span className="shrink-0 rounded-md bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-orange-300">{formatArtCode(art.code)}</span>
                  <span className="min-w-0 truncate">{art.title}</span>
                  {art.isRejected && <Badge className="bg-red-100 text-[9px] text-red-700">Reprovada</Badge>}
                  {art.isLaunch && <Badge className="bg-orange-100 text-[9px] font-black uppercase text-orange-600">Novo</Badge>}
                  {art.isSelected && <Badge className="bg-amber-100 text-[9px] font-black uppercase text-amber-700">⭐ Selecionada</Badge>}
                  {art.seasonalEvent && <Badge variant="outline" className="text-[9px] font-black text-zinc-500">{art.seasonalEvent.emoji} {art.seasonalEvent.name}</Badge>}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-400">
                  <span className={cn('font-bold', art.category ? 'text-orange-500' : 'text-rose-600')}>{art.category?.emoji} {art.category?.name || 'Sem categoria'}</span>
                  {art.tags.length === 0 && <span className="font-bold text-amber-600">· Sem tags</span>}
                  <span>· {art.downloadsCount} downloads</span>
                  <span className="hidden sm:inline">· {art.tags.map((t) => `#${t.name}`).join(' ')}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={toggleSelected.isPending}
                  onClick={() => toggleSelected.mutate(art)}
                  aria-label={art.isSelected ? 'Remover das Selecionadas' : 'Marcar como Selecionada'}
                  title={art.isSelected ? 'Remover das Selecionadas' : 'Marcar como Selecionada'}
                  className="h-8 w-8 rounded-lg text-zinc-300 hover:bg-amber-50 hover:text-amber-500"
                >
                  <Star className={art.isSelected ? 'h-4 w-4 fill-amber-400 text-amber-500' : 'h-4 w-4'} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={toggleLaunch.isPending}
                  onClick={() => toggleLaunch.mutate(art)}
                  aria-label={art.isLaunch ? 'Remover dos lançamentos' : 'Marcar como lançamento'}
                  title={art.isLaunch ? 'Remover dos lançamentos' : 'Marcar como lançamento'}
                  className="h-8 w-8 rounded-lg text-zinc-300 hover:bg-orange-50 hover:text-orange-500"
                >
                  <Sparkles className={art.isLaunch ? 'h-4 w-4 fill-orange-400 text-orange-500' : 'h-4 w-4'} />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-orange-50 hover:text-orange-600" onClick={() => openEdit(art)} aria-label="Editar arte">
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir arte">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir "{art.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>A arte sai do ar imediatamente para todos os clientes.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600" onClick={() => remove.mutate(art.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {!artsQ.isLoading && arts.length === 0 && (
            <div className="p-10 text-center text-sm text-zinc-400">Nenhuma arte encontrada. Publique a primeira!</div>
          )}
        </div>
        {totalArts > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50 px-4 py-2.5 text-xs font-semibold text-zinc-500">
            <span>{totalArts} {totalArts === 1 ? 'arte' : 'artes'}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 rounded-lg">
                Anterior
              </Button>
              <span>Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={!artsQ.data?.hasMore} onClick={() => setPage((p) => p + 1)} className="h-8 rounded-lg">
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Form Dialog ---------- */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-zinc-950">
              {form.id ? 'Editar arte' : 'Nova arte no acervo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload */}
            <div>
              <Label className="text-xs font-black uppercase tracking-wide text-zinc-500">Imagem (21×9,5 recomendado)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadFile(f)
                }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-1.5 flex aspect-[21/9.5] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 transition-colors hover:border-orange-400 hover:bg-orange-50"
              >
                {form.imageUrl ? (
                   
                  <img src={form.imageUrl} alt="Prévia da arte" className="h-full w-full object-contain p-2" />
                ) : uploading ? (
                  <span className="flex flex-col items-center gap-2 text-sm font-bold text-orange-500">
                    <Loader2 className="h-6 w-6 animate-spin" /> Enviando...
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-1.5 text-sm font-bold text-orange-500">
                    <Upload className="h-6 w-6" /> Clique para enviar PNG, JPG ou WEBP
                    <span className="text-xs font-medium text-orange-400">máx. 15 MB · sobe direto pro Cloudflare R2 se configurado</span>
                  </span>
                )}
              </button>
              {/* URL externa (CDN) — alternativa ao upload, recomendada na Vercel */}
              <div className="mt-2">
                <Input
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="ou cole a URL da imagem (CDN externa) — https://..."
                  className="rounded-xl text-xs"
                  inputMode="url"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-zinc-500">Título</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex: Casal Flork — Amor de Verdade" className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-zinc-500">Categoria</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {(catQ.data?.categories || []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {(() => {
                          const iconDef = getCategoryIcon(c.icon)
                          return iconDef ? <iconDef.Icon className="h-4 w-4 text-orange-500" /> : <span>{c.emoji}</span>
                        })()}
                        {c.name}
                      </span>
                    </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wide text-zinc-500">Data sazonal</Label>
                <Select value={form.seasonalEventId} onValueChange={(v) => setForm((f) => ({ ...f, seasonalEventId: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {(evtQ.data?.events || []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wide text-zinc-500">Tags (Enter para adicionar)</Label>
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-white p-2.5">
                {form.tagNames.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-zinc-950 px-2.5 py-1 text-xs font-bold text-white">
                    #{t}
                    <button onClick={() => setForm((f) => ({ ...f, tagNames: f.tagNames.filter((x) => x !== t) }))} aria-label={`Remover tag ${t}`}>
                      <X className="h-3 w-3 text-zinc-400 hover:text-red-400" />
                    </button>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault()
                      const v = tagInput.trim().toLowerCase()
                      if (!form.tagNames.includes(v)) setForm((f) => ({ ...f, tagNames: [...f.tagNames, v] }))
                      setTagInput('')
                    }
                  }}
                  placeholder={form.tagNames.length === 0 ? 'ex: amor, café, mãe...' : ''}
                  className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-300"
                />
              </div>
              <Button size="sm" variant="outline" type="button" disabled={!tagInput.trim() || creatingTag} onClick={createTagHere} className="mt-2 h-9 rounded-xl font-bold text-orange-600"><Plus className="mr-1 h-3.5 w-3.5" />{creatingTag ? 'Criando tag...' : 'Criar/usar tag agora'}</Button>
              <p className="text-xs text-zinc-500">A tag será registrada sem sair deste cadastro.</p>
              {(tagsQ.data?.tags || []).filter((t) => !form.tagNames.includes(t.name)).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {(tagsQ.data?.tags || []).filter((t) => !form.tagNames.includes(t.name)).slice(0, 10).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setForm((f) => ({ ...f, tagNames: [...f.tagNames, t.name] }))}
                      className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500 transition-colors hover:bg-orange-100 hover:text-orange-600"
                    >
                      + #{t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-3">
              <div><p className="text-sm font-extrabold text-red-800">Design reprovado · sub-biblioteca</p><p className="text-xs text-zinc-600">Fica disponível apenas na coleção Artes reprovadas. Não aparece na biblioteca principal.</p></div>
              <Switch checked={form.isRejected} onCheckedChange={(v) => setForm((f) => ({ ...f, isRejected: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3">
              <div>
                <p className="text-sm font-bold text-zinc-800">Marcar como lançamento</p>
                <p className="text-xs text-zinc-400">Aparece na aba Lançamentos com selo NOVO</p>
              </div>
              <Switch checked={form.isLaunch} onCheckedChange={(v) => setForm((f) => ({ ...f, isLaunch: v }))} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-800">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" /> Marcar como Selecionada
                </p>
                <p className="text-xs text-zinc-500">Arte especial: aparece na aba Selecionadas do portal</p>
              </div>
              <Switch checked={form.isSelected} onCheckedChange={(v) => setForm((f) => ({ ...f, isSelected: v }))} />
            </div>

            <Button onClick={save} disabled={saving} className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {form.id ? 'Salvar alterações' : 'Publicar arte'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==================== CATEGORIES ==================== */

export function AdminCategoriesSection() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')

  const catQ = useQuery<{ categories: { id: string; name: string; emoji: string; icon: string; artCount: number }[] }>({
    queryKey: ['admin-categories'],
    queryFn: async () => (await fetch('/api/admin/categories')).json(),
  })

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      setName('')
      setIcon('')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Categoria criada!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao criar.'),
  })

  const updateIcon = useMutation({
    mutationFn: async ({ id, icon: newIcon }: { id: string; icon: string }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icon: newIcon }),
      })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Ícone atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar o ícone.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Categoria excluída.')
    },
    onError: () => toast.error('Erro ao excluir.'),
  })

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-600">Nova categoria</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Escreva o nome e escolha um ícone da biblioteca para deixar tudo padronizado.
        </p>
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
          <IconPicker value={icon} onChange={setIcon} placeholder="Ícone" />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && create.mutate()}
            placeholder="NOME DA CATEGORIA"
            className="h-10 flex-1 rounded-xl"
          />
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !name.trim()}
            className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black"
          >
            <Plus className="mr-1 h-4 w-4" /> Criar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {catQ.data?.categories.map((c) => {
          const iconDef = getCategoryIcon(c.icon)
          return (
            <div
              key={c.id}
              className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                {iconDef ? <iconDef.Icon className="h-5.5 w-5.5" /> : <span className="text-xl">{c.emoji}</span>}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-zinc-900">{c.name}</p>
                <p className="text-xs text-zinc-400">{c.artCount} artes</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <IconPicker
                  value={c.icon}
                  onChange={(newIcon) => updateIcon.mutate({ id: c.id, icon: newIcon })}
                  placeholder="Ícone"
                />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg text-zinc-300 hover:bg-red-50 hover:text-red-500"
                      aria-label="Excluir categoria"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir categoria {c.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        As artes desta categoria ficarão sem categoria (não serão apagadas).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600" onClick={() => remove.mutate(c.id)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ==================== TAGS ==================== */

export function AdminTagsSection() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const tagsQ = useQuery<{ tags: { id: string; name: string; artCount: number }[] }>({
    queryKey: ['admin-tags'],
    queryFn: async () => (await fetch('/api/admin/tags')).json(),
  })

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      setName('')
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Tag criada!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao criar.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Tag excluída.')
    },
    onError: () => toast.error('Erro ao excluir.'),
  })

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-600">
          <TagIcon className="h-4 w-4 text-orange-500" /> Nova tag
        </h3>
        <div className="mt-3 flex gap-2.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && create.mutate()}
            placeholder="ex: academia, música, anime..."
            className="h-10 flex-1 rounded-xl"
          />
          <Button onClick={() => create.mutate()} disabled={create.isPending || !name.trim()} className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black">
            <Plus className="mr-1 h-4 w-4" /> Criar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200 bg-white p-5">
        {tagsQ.data?.tags.length === 0 && <p className="text-sm text-zinc-400">Nenhuma tag ainda.</p>}
        {tagsQ.data?.tags.map((t) => (
          <span key={t.id} className="group flex items-center gap-1.5 rounded-full bg-zinc-100 py-1.5 pl-3 pr-1.5 text-sm font-bold text-zinc-600">
            #{t.name}
            <span className="text-[10px] font-black text-zinc-300">{t.artCount}</span>
            <button onClick={() => remove.mutate(t.id)} className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 hover:bg-red-100 hover:text-red-500" aria-label={`Excluir tag ${t.name}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ==================== SEASONAL ==================== */

export function AdminSeasonalSection() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<{ id: string } | null>(null)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [date, setDate] = useState('')

  const evtQ = useQuery<{ events: { id: string; name: string; emoji: string; month: number; day: number; rule?: string | null; nextDate: string; artCount: number; daysLeft: number }[] }>({
    queryKey: ['admin-seasonal'],
    queryFn: async () => (await fetch('/api/admin/seasonal')).json(),
  })

  const openNew = () => {
    setEditing(null)
    setName('')
    setEmoji('')
    setDate('')
    setDialogOpen(true)
  }

  const openEdit = (e: { id: string; name: string; emoji: string; month: number; day: number }) => {
    setEditing({ id: e.id })
    setName(e.name)
    setEmoji(e.emoji)
    setDate(`2024-${String(e.month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`)
    setDialogOpen(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const [, m, d] = date.split('-')
      const body = { name, emoji: emoji || '🎉', month: parseInt(m, 10), day: parseInt(d, 10) }
      const res = await fetch(editing ? `/api/admin/seasonal/${editing.id}` : '/api/admin/seasonal', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      setDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['admin-seasonal'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(editing ? 'Evento atualizado!' : 'Data sazonal criada!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar. Verifique a data.'),
  })

  const addDefaults = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/seasonal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-defaults' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data as { created: number }
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ['admin-seasonal'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success(d.created ? `${d.created} data(s) comemorativa(s) adicionada(s)!` : 'Todas as datas principais já estão cadastradas.')
    },
    onError: () => toast.error('Erro ao adicionar as datas.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/seasonal/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seasonal'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Evento excluído.')
    },
    onError: () => toast.error('Erro ao excluir.'),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">As datas aparecem na aba SAZONAL do portal, com contagem regressiva para a próxima.</p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={addDefaults.isPending}
            onClick={() => addDefaults.mutate()}
            className="h-10 rounded-xl border-orange-300 font-black text-orange-600 hover:bg-orange-50"
          >
            {addDefaults.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CalendarHeart className="mr-1.5 h-4 w-4" />}
            Adicionar datas principais
          </Button>
          <Button onClick={openNew} className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25">
            <Plus className="mr-1.5 h-4 w-4" /> Nova data
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {evtQ.data?.events.map((e) => (
          <div key={e.id} className="group flex items-center gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">{e.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-zinc-900">{e.name}</p>
              <p className="text-xs text-zinc-400">
                {new Date(e.nextDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}{e.rule ? ' (data móvel)' : ''} · {e.artCount} artes · em {e.daysLeft} dias
              </p>
            </div>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-zinc-400 hover:bg-orange-50 hover:text-orange-600" onClick={() => openEdit(e)} aria-label="Editar evento">
                <Pencil className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50" aria-label="Excluir evento">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir {e.name}?</AlertDialogTitle>
                    <AlertDialogDescription>As artes ligadas a esta data permanecem, só perdem o vínculo sazonal.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600" onClick={() => remove.mutate(e.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-zinc-950">
              <CalendarHeart className="h-5 w-5 text-orange-500" />
              {editing ? 'Editar data sazonal' : 'Nova data sazonal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[70px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-zinc-500">Emoji</Label>
                <Input value={emoji} onChange={(e) => setEmoji(e.target.value.slice(0, 2))} placeholder="🎄" className="rounded-xl text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-zinc-500">Nome do evento</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Dia do Advogado" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-zinc-500">Data (repete todo ano)</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim() || !date} className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black">
              {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==================== SETTINGS ==================== */

export function AdminSettingsSection() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  const settingsQ = useQuery<{ settings: Record<string, string>; effectiveProvider: string }>({
    queryKey: ['admin-settings'],
    queryFn: async () => (await fetch('/api/admin/settings')).json(),
  })

  if (settingsQ.data && !loaded) {
    setForm(settingsQ.data.settings)
    setLoaded(true)
  }

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      toast.success('Configurações salvas!')
    },
    onError: (e: Error) => toast.error(e.message || 'Erro ao salvar.'),
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const priceReal = ((parseInt(form.price_cents || '4790', 10) || 0) / 100).toFixed(2).replace('.', ',')

  if (!settingsQ.data) return <div className="h-72 animate-pulse rounded-2xl bg-zinc-200/70" />

  return (
    <div className="space-y-5">
      {/* Pagamentos */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-700">
          <CreditCard className="h-4.5 w-4.5 text-orange-500" /> Pagamentos &amp; Gateways
        </h3>
        <p className="mt-1 text-xs text-zinc-400">
          Gateway ativo agora:{' '}
          <Badge className={cn('font-black', settingsQ.data.effectiveProvider ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500')}>
            {settingsQ.data.effectiveProvider
              ? `${settingsQ.data.effectiveProvider} ATIVO`
              : 'SEM GATEWAY — PIX manual (WhatsApp)'}
          </Badge>
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-zinc-500">Gateway padrão</Label>
            <Select
              value={form.payment_provider === 'MERCADOPAGO' || form.payment_provider === 'ASAAS' ? form.payment_provider : 'AUTO'}
              onValueChange={(v) => set('payment_provider', v === 'AUTO' ? '' : v)}
            >
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">Automático — detecta pelas credenciais</SelectItem>
                <SelectItem value="MERCADOPAGO">Mercado Pago (PIX)</SelectItem>
                <SelectItem value="ASAAS">Asaas (PIX)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] leading-relaxed text-zinc-400">
              Ao salvar um Access Token/API Key aqui, a opção correspondente aparece automaticamente no checkout do cliente.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-zinc-500">Preço do acesso (R$)</Label>
            <Input
              value={priceReal}
              onChange={(e) => set('price_cents', String(Math.round(parseFloat(e.target.value.replace(',', '.') || '0') * 100)))}
              inputMode="decimal"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-zinc-500">Mercado Pago — Access Token</Label>
            <Input type="password" autoComplete="new-password" value={form.mercadopago_access_token || ''} onChange={(e) => set('mercadopago_access_token', e.target.value)} placeholder="APP_USR-..." className="rounded-xl font-mono text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-zinc-500">Asaas — API Key</Label>
            <Input value={form.asaas_api_key || ''} onChange={(e) => set('asaas_api_key', e.target.value)} placeholder="$aact_..." className="rounded-xl font-mono text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3 lg:col-span-2">
            <div>
              <p className="text-sm font-bold text-zinc-800">Asaas em modo Sandbox</p>
              <p className="text-xs text-zinc-400">Use sandbox para testar sem cobrar de verdade</p>
            </div>
            <Switch checked={form.asaas_sandbox === 'true'} onCheckedChange={(v) => set('asaas_sandbox', v ? 'true' : 'false')} />
          </div>

          {/* Pagamento manual via PIX */}
          <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 lg:col-span-2">
            <p className="flex items-center gap-2 text-sm font-black text-zinc-800">
              <QrCode className="h-4.5 w-4.5 text-orange-500" /> Pagamento manual — ativação manual
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Ideal para começar sem gateway: o cliente paga na sua chave PIX direto pela landing page e você ativa o
              acesso manualmente no menu <strong>Usuários</strong> deste painel.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-zinc-500">Chave PIX</Label>
                <Input
                  value={form.pix_key || ''}
                  onChange={(e) => set('pix_key', e.target.value)}
                  placeholder="e-mail, telefone ou chave aleatória"
                  className="rounded-xl font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-zinc-500">Titular da chave</Label>
                <Input
                  value={form.pix_holder || ''}
                  onChange={(e) => set('pix_holder', e.target.value)}
                  placeholder="Nome exibido no PIX"
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-orange-200 bg-white px-3.5 py-3">
              <div>
                <p className="text-sm font-bold text-zinc-800">Exibir pagamento manual na landing page</p>
                <p className="text-xs text-zinc-400">Mostra os métodos PIX · Mercado Pago · Asaas e a chave PIX com botão copiar</p>
              </div>
              <Switch checked={form.pix_manual_enabled === 'true'} onCheckedChange={(v) => set('pix_manual_enabled', v ? 'true' : 'false')} />
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-zinc-400">
          💡 Webhooks: configure <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px]">/api/payments/webhook/mercadopago</code> e{' '}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px]">/api/payments/webhook/asaas</code> nos painéis dos gateways.
        </p>
      </div>

      {/* R2 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-700">
          <Cloud className="h-4.5 w-4.5 text-orange-500" /> Cloudflare R2 (armazenamento das artes)
        </h3>
        <p className="mt-1 text-xs text-zinc-400">Com R2: o PNG original vai pro bucket privado (só baixa quem pagou, por link temporário) e o WebP leve vira a prévia pública. Requer CORS (PUT) no bucket.</p>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-3">
          <div>
            <p className="text-sm font-bold text-zinc-800">Usar Cloudflare R2</p>
            <p className="text-xs text-zinc-400">Requer endpoint, chaves, bucket e URL pública</p>
          </div>
          <Switch checked={form.r2_enabled === 'true'} onCheckedChange={(v) => set('r2_enabled', v ? 'true' : 'false')} />
        </div>

        {form.r2_enabled === 'true' && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {[
              ['r2_endpoint', 'Account Endpoint', 'https://<account_id>.r2.cloudflarestorage.com'],
              ['r2_access_key_id', 'Access Key ID', ''],
              ['r2_secret_access_key', 'Secret Access Key', ''],
              ['r2_bucket', 'Bucket das PRÉVIAS (público)', 'click-gruda'],
              ['r2_originals_bucket', 'Bucket dos ORIGINAIS PNG (privado — recomendado)', 'click-gruda-originais'],
              ['r2_public_url', 'URL pública (R2.dev ou domínio)', 'https://pub-xxxx.r2.dev'],
            ].map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs font-black uppercase text-zinc-500">{label}</Label>
                <Input value={form[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder={placeholder} className="rounded-xl font-mono text-xs" />
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={() => save.mutate()} disabled={save.isPending} className="h-12 w-full max-w-xs rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25">
        {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Salvar configurações
      </Button>
    </div>
  )
}


/* ==================== SUGESTÕES DE TEMA ==================== */

type SuggestionItem = {
  id: string
  message: string
  name: string
  contact: string
  status: string // NEW | SEEN | DONE
  createdAt: string
}

const SUGGESTION_STATUS: Record<string, { label: string; className: string }> = {
  NEW: { label: 'Nova', className: 'bg-orange-100 text-orange-700' },
  SEEN: { label: 'Vista', className: 'bg-zinc-100 text-zinc-600' },
  DONE: { label: 'Concluída', className: 'bg-emerald-100 text-emerald-700' },
}

export function AdminSuggestionsSection() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'SEEN' | 'DONE'>('ALL')

  const sugQ = useQuery<{ suggestions: SuggestionItem[] }>({
    queryKey: ['admin-suggestions'],
    queryFn: async () => (await fetch('/api/admin/suggestions')).json(),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] })
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('fail')
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      toast.success('Status atualizado!')
    },
    onError: () => toast.error('Erro ao atualizar status.'),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/suggestions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('fail')
      return res.json()
    },
    onSuccess: () => {
      invalidate()
      toast.success('Sugestão excluída.')
    },
    onError: () => toast.error('Erro ao excluir.'),
  })

  if (sugQ.isLoading) return <div className="h-72 animate-pulse rounded-2xl bg-zinc-200/70" />

  const all = sugQ.data?.suggestions ?? []
  const list = filter === 'ALL' ? all : all.filter((s) => s.status === filter)

  return (
    <div className="space-y-4">
      {/* filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {(['ALL', 'NEW', 'SEEN', 'DONE'] as const).map((f) => {
          const count = f === 'ALL' ? all.length : all.filter((s) => s.status === f).length
          const labels = { ALL: 'Todas', NEW: 'Novas', SEEN: 'Vistas', DONE: 'Concluídas' }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-black transition-all',
                filter === f
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25'
                  : 'border border-zinc-200 bg-white text-zinc-500 hover:border-orange-200 hover:text-orange-600'
              )}
            >
              {labels[f]}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px]',
                  filter === f ? 'bg-white/20' : 'bg-zinc-100'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-zinc-500">
            {all.length === 0
              ? 'Nenhuma sugestão recebida ainda. As ideias enviadas pela landing aparecem aqui.'
              : 'Nada neste filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((s) => {
            const badge = SUGGESTION_STATUS[s.status] ?? SUGGESTION_STATUS.NEW
            return (
              <div
                key={s.id}
                className={cn(
                  'rounded-2xl border bg-white p-4 shadow-sm transition-colors sm:p-5',
                  s.status === 'NEW' ? 'border-orange-200' : 'border-zinc-200'
                )}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      s.status === 'NEW' ? 'bg-orange-100' : 'bg-zinc-100'
                    )}
                  >
                    <Lightbulb className={cn('h-5 w-5', s.status === 'NEW' ? 'text-orange-600' : 'text-zinc-400')} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('text-[10px] font-black uppercase', badge.className)}>{badge.label}</Badge>
                      <span className="text-[11px] font-semibold text-zinc-400">
                        {new Date(s.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-zinc-800">
                      {s.message}
                    </p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {s.name || s.contact ? (
                        <>
                          {s.name && <span className="font-bold text-zinc-600">{s.name}</span>}
                          {s.name && s.contact && ' · '}
                          {s.contact && <span>{s.contact}</span>}
                        </>
                      ) : (
                        <span className="italic">Sugestão anônima</span>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
                    {s.status === 'NEW' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                        onClick={() => setStatus.mutate({ id: s.id, status: 'SEEN' })}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" /> Vista
                      </Button>
                    )}
                    {s.status !== 'DONE' ? (
                      <Button
                        size="sm"
                        className="h-8 rounded-lg bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600"
                        onClick={() => setStatus.mutate({ id: s.id, status: 'DONE' })}
                      >
                        <Check className="mr-1 h-3.5 w-3.5" /> Concluir
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-zinc-200 text-xs font-bold text-zinc-500 hover:bg-zinc-50"
                        onClick={() => setStatus.mutate({ id: s.id, status: 'NEW' })}
                      >
                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reabrir
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir sugestão">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir sugestão?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A ideia “{s.message.slice(0, 80)}
                            {s.message.length > 80 ? '…' : ''}” será removida definitivamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600" onClick={() => remove.mutate(s.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
