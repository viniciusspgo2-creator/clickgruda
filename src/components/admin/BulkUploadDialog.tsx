'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Loader2, Rocket, Trash2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getCategoryIcon } from '@/lib/category-icons'
import { ALLOWED_ART_EXT, MAX_ART_SIZE, uploadArtFile } from '@/lib/art-upload'
import { cn } from '@/lib/utils'

export const BULK_MAX = 100

type Category = { id: string; name: string; emoji: string; icon: string }
type EventOpt = { id: string; name: string; emoji: string }

type Item = {
  uid: string
  file: File
  previewUrl: string
  title: string
  categoryId: string
  seasonalEventId: string
  tagNames: string[]
  tagInput: string
  isLaunch: boolean
  status: 'idle' | 'working' | 'done' | 'error'
  error?: string
}

/** "casal_flork-amor.PNG" -> "Casal flork amor" */
function titleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : ''
}

let uidCounter = 0
const nextUid = () => `b${Date.now()}_${uidCounter++}`

/**
 * BulkUploadDialog — envia até 20 artes de uma vez e deixa preencher
 * título / categoria / data sazonal / tags / lançamento de CADA arte separadamente.
 * "Aplicar em todas" ajuda quando o lote inteiro é do mesmo tema.
 */
export function BulkUploadDialog({
  open,
  onOpenChange,
  categories,
  events,
  knownTags,
  onPublished,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  categories: Category[]
  events: EventOpt[]
  knownTags: string[]
  onPublished: () => void
}) {
  const [items, setItems] = useState<Item[]>([])
  const [publishing, setPublishing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<Item[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const revokeAll = useCallback((list: Item[]) => list.forEach((i) => URL.revokeObjectURL(i.previewUrl)), [])

  // limpa as URLs de prévia ao desmontar
  useEffect(() => () => revokeAll(itemsRef.current), [revokeAll])

  const patch = (uid: string, partial: Partial<Item>) =>
    setItems((list) => list.map((i) => (i.uid === uid ? { ...i, ...partial } : i)))

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList)
    const room = BULK_MAX - items.length
    if (room <= 0) {
      toast.error(`Máximo de ${BULK_MAX} artes por vez. Publique estas e envie as próximas.`)
      return
    }
    const valid: File[] = []
    let rejected = 0
    for (const f of incoming) {
      const ext = (f.name.split('.').pop() || '').toLowerCase()
      if (!ALLOWED_ART_EXT.includes(ext) || f.size > MAX_ART_SIZE || f.size === 0) rejected++
      else valid.push(f)
    }
    const accepted = valid.slice(0, room)
    const overflow = valid.length - accepted.length
    if (rejected) toast.error(`${rejected} arquivo(s) ignorado(s): use PNG, JPG ou WEBP de até 10MB.`)
    if (overflow > 0) toast.error(`Limite de ${BULK_MAX} por vez: ${overflow} arquivo(s) ficaram de fora.`)
    if (!accepted.length) return
    setItems((list) => [
      ...list,
      ...accepted.map<Item>((file) => ({
        uid: nextUid(),
        file,
        previewUrl: URL.createObjectURL(file),
        title: titleFromFilename(file.name),
        categoryId: 'none',
        seasonalEventId: 'none',
        tagNames: [],
        tagInput: '',
        isLaunch: true,
        status: 'idle',
      })),
    ])
  }

  const remove = (uid: string) => {
    setItems((list) => {
      const target = list.find((i) => i.uid === uid)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return list.filter((i) => i.uid !== uid)
    })
  }

  const applyToAll = (partial: Partial<Pick<Item, 'categoryId' | 'seasonalEventId' | 'isLaunch'>>) =>
    setItems((list) => list.map((i) => (i.status === 'done' ? i : { ...i, ...partial })))

  const addTag = (uid: string, raw: string) => {
    const v = raw.trim().toLowerCase().replace(/^#/, '')
    if (!v) return
    setItems((list) =>
      list.map((i) => (i.uid === uid && !i.tagNames.includes(v) ? { ...i, tagNames: [...i.tagNames, v], tagInput: '' } : i.uid === uid ? { ...i, tagInput: '' } : i))
    )
  }

  const pending = items.filter((i) => i.status !== 'done')
  const doneCount = items.filter((i) => i.status === 'done').length

  const publishAll = async () => {
    const toSend = itemsRef.current.filter((i) => i.status !== 'done')
    const missing = toSend.find((i) => !i.title.trim())
    if (missing) {
      toast.error('Toda arte precisa de um título. Confira os campos em vermelho.')
      setItems((list) => list.map((i) => (i.status !== 'done' && !i.title.trim() ? { ...i, status: 'error', error: 'Dê um título para esta arte.' } : i)))
      return
    }
    setPublishing(true)
    let ok = 0
    let fail = 0
    // sequencial: o R2/Vercel agradecem e a ordem de código das artes segue a ordem da lista
    for (const it of toSend) {
      patch(it.uid, { status: 'working', error: undefined })
      try {
        const up = await uploadArtFile(it.file)
        const res = await fetch('/api/admin/arts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: it.title.trim(),
            imageUrl: up.imageUrl,
            originalKey: up.originalKey,
            categoryId: it.categoryId === 'none' ? null : it.categoryId,
            seasonalEventId: it.seasonalEventId === 'none' ? null : it.seasonalEventId,
            tagNames: it.tagNames,
            isLaunch: it.isLaunch,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Erro ao salvar a arte.')
        patch(it.uid, { status: 'done' })
        ok++
      } catch (err) {
        patch(it.uid, { status: 'error', error: err instanceof Error ? err.message : 'Falha ao enviar.' })
        fail++
      }
    }
    setPublishing(false)
    if (ok) onPublished()
    if (fail === 0) {
      toast.success(`${ok} ${ok === 1 ? 'arte publicada' : 'artes publicadas'}! 🎉`)
      revokeAll(itemsRef.current)
      setItems([])
      onOpenChange(false)
    } else {
      toast.error(`${ok} publicada(s), ${fail} com erro. Corrija e clique em publicar de novo — as que deram certo não repetem.`)
    }
  }

  const handleOpenChange = (o: boolean) => {
    if (!o && publishing) return // não fecha no meio do envio
    if (!o && items.length > 0 && doneCount === 0) {
      // fechou sem publicar nada: descarta a fila
      revokeAll(items)
      setItems([])
    }
    if (!o && doneCount > 0) {
      const keep = items.filter((i) => i.status !== 'done')
      items.filter((i) => i.status === 'done').forEach((i) => URL.revokeObjectURL(i.previewUrl))
      setItems(keep)
    }
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[94vh] max-w-4xl overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-zinc-950">Enviar várias artes de uma vez</DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Até {BULK_MAX} por vez (PNG, JPG ou WEBP · 10MB cada). Preencha título, categoria e tags de cada arte — ou use “Aplicar em todas”.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {/* Dropzone */}
        <button
          type="button"
          disabled={publishing}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragOver ? 'border-orange-500 bg-orange-100' : 'border-orange-300 bg-orange-50/50 hover:border-orange-400 hover:bg-orange-50'
          )}
        >
          <Upload className="h-6 w-6 text-orange-500" />
          <span className="text-sm font-black text-orange-600">Clique ou arraste as artes aqui</span>
          <span className="text-xs font-medium text-orange-400">
            {items.length}/{BULK_MAX} selecionadas
          </span>
        </button>

        {items.length > 0 && (
          <>
            {/* Aplicar em todas */}
            <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3.5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Aplicar categoria em todas</Label>
                <Select onValueChange={(v) => applyToAll({ categoryId: v })}>
                  <SelectTrigger className="h-9 rounded-xl bg-white text-xs"><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Aplicar data sazonal em todas</Label>
                <Select onValueChange={(v) => applyToAll({ seasonalEventId: v })}>
                  <SelectTrigger className="h-9 rounded-xl bg-white text-xs"><SelectValue placeholder="Escolher..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1.5">
                <Switch
                  checked={pending.length > 0 && pending.every((i) => i.isLaunch)}
                  onCheckedChange={(v) => applyToAll({ isLaunch: v })}
                />
                <span className="text-xs font-bold text-zinc-600">Todas como lançamento</span>
              </div>
            </div>

            {/* Lista de artes */}
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div
                  key={it.uid}
                  className={cn(
                    'rounded-2xl border bg-white p-3 shadow-sm sm:p-3.5',
                    it.status === 'done' && 'border-emerald-300 bg-emerald-50/40',
                    it.status === 'error' && 'border-red-300 bg-red-50/40',
                    it.status === 'idle' && 'border-zinc-200',
                    it.status === 'working' && 'border-orange-300'
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative aspect-[21/9.5] w-full shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 sm:w-52">
                      <img src={it.previewUrl} alt={`Prévia ${idx + 1}`} loading="lazy" decoding="async" className="h-full w-full object-contain p-1" />
                      <span className="absolute left-1.5 top-1.5 rounded-md bg-zinc-900/85 px-1.5 py-0.5 text-[10px] font-black text-white">#{idx + 1}</span>
                      {it.status === 'working' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/70">
                          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                        </span>
                      )}
                      {it.status === 'done' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-emerald-50/80">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1 space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Título</Label>
                          <Input
                            value={it.title}
                            disabled={it.status === 'done' || publishing}
                            onChange={(e) => patch(it.uid, { title: e.target.value, ...(it.status === 'error' ? { status: 'idle', error: undefined } : {}) })}
                            placeholder="Ex: Casal Flork — Amor de Verdade"
                            className="h-9 rounded-xl text-sm"
                          />
                        </div>
                        {it.status !== 'done' && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={publishing}
                            onClick={() => remove(it.uid)}
                            aria-label={`Remover arte ${idx + 1}`}
                            className="mt-5 h-9 w-9 shrink-0 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Categoria</Label>
                          <Select value={it.categoryId} disabled={it.status === 'done' || publishing} onValueChange={(v) => patch(it.uid, { categoryId: v })}>
                            <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem categoria</SelectItem>
                              {categories.map((c) => {
                                const iconDef = getCategoryIcon(c.icon)
                                return (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center gap-2">
                                      {iconDef ? <iconDef.Icon className="h-4 w-4 text-orange-500" /> : <span>{c.emoji}</span>}
                                      {c.name}
                                    </span>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Data sazonal</Label>
                          <Select value={it.seasonalEventId} disabled={it.status === 'done' || publishing} onValueChange={(v) => patch(it.uid, { seasonalEventId: v })}>
                            <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              {events.map((e) => (
                                <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-wide text-zinc-500">Tags (Enter ou vírgula)</Label>
                        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-1.5">
                          {it.tagNames.map((t) => (
                            <span key={t} className="flex items-center gap-1 rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-bold text-white">
                              #{t}
                              {it.status !== 'done' && (
                                <button
                                  type="button"
                                  onClick={() => patch(it.uid, { tagNames: it.tagNames.filter((x) => x !== t) })}
                                  aria-label={`Remover tag ${t}`}
                                >
                                  <X className="h-3 w-3 text-zinc-400 hover:text-red-400" />
                                </button>
                              )}
                            </span>
                          ))}
                          <input
                            value={it.tagInput}
                            disabled={it.status === 'done' || publishing}
                            onChange={(e) => {
                              const v = e.target.value
                              if (v.includes(',')) {
                                v.split(',').forEach((part) => addTag(it.uid, part))
                              } else patch(it.uid, { tagInput: v })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                addTag(it.uid, it.tagInput)
                              }
                            }}
                            onBlur={() => it.tagInput.trim() && addTag(it.uid, it.tagInput)}
                            list="bulk-known-tags"
                            placeholder={it.tagNames.length === 0 ? 'ex: amor, café, mãe...' : ''}
                            className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-300"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                          <Switch
                            checked={it.isLaunch}
                            disabled={it.status === 'done' || publishing}
                            onCheckedChange={(v) => patch(it.uid, { isLaunch: v })}
                          />
                          Lançamento (selo NOVO)
                        </label>
                        {it.status === 'done' && (
                          <span className="flex items-center gap-1 text-xs font-black text-emerald-600">
                            <Check className="h-3.5 w-3.5" /> Publicada
                          </span>
                        )}
                        {it.status === 'error' && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> {it.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <datalist id="bulk-known-tags">
              {knownTags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>

            <div className="sticky bottom-0 -mx-1 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur">
              <p className="text-xs font-bold text-zinc-500">
                {publishing
                  ? `Publicando... ${doneCount} de ${items.length}`
                  : `${pending.length} ${pending.length === 1 ? 'arte pronta' : 'artes prontas'} para publicar`}
              </p>
              <Button
                onClick={publishAll}
                disabled={publishing || pending.length === 0}
                className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 font-black shadow-md shadow-orange-500/25"
              >
                {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                Publicar {pending.length} {pending.length === 1 ? 'arte' : 'artes'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
