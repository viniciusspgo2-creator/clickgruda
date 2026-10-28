'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCheck, Layers3, Loader2, ShieldCheck, Sparkles, Tags } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AdminArtFilters } from '@/lib/admin-art-filters'
import { hasActiveAdminArtFilters } from '@/lib/admin-art-filters'

export type BulkArtSelection =
  | { scope: 'ids'; ids: string[]; count: number }
  | { scope: 'filter'; filters: AdminArtFilters; excludedIds: string[]; count: number }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: BulkArtSelection
  categories: { id: string; name: string; emoji: string }[]
  events: { id: string; name: string; emoji: string }[]
  onApplied: (updated: number) => void
}

const selectionValue = (value: string) => value === 'yes' ? true : value === 'no' ? false : undefined

export function BulkEditArtsDialog({ open, onOpenChange, selection, categories, events, onApplied }: Props) {
  const [category, setCategory] = useState('keep')
  const [seasonal, setSeasonal] = useState('keep')
  const [launch, setLaunch] = useState('keep')
  const [selected, setSelected] = useState('keep')
  const [rejected, setRejected] = useState('keep')
  const [tagText, setTagText] = useState('')
  const [tagMode, setTagMode] = useState<'add' | 'remove'>('add')
  const [review, setReview] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setCategory('keep'); setSeasonal('keep'); setLaunch('keep'); setSelected('keep'); setRejected('keep'); setRejected('keep')
    setTagText(''); setTagMode('add'); setReview(false); setConfirmation('')
  }, [open])

  const tagNames = useMemo(() => [...new Set(tagText.split(/[,;\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))], [tagText])
  const changes = useMemo(() => {
    const result: {
      categoryId?: string | null
      seasonalEventId?: string | null
      isLaunch?: boolean
      isSelected?: boolean
      isRejected?: boolean
      tagNames?: string[]
      tagMode?: 'add' | 'remove'
    } = {}
    if (category !== 'keep') result.categoryId = category === 'none' ? null : category
    if (seasonal !== 'keep') result.seasonalEventId = seasonal === 'none' ? null : seasonal
    if (selectionValue(launch) !== undefined) result.isLaunch = selectionValue(launch)
    if (selectionValue(selected) !== undefined) result.isSelected = selectionValue(selected)
    if (selectionValue(rejected) !== undefined) result.isRejected = selectionValue(rejected)
    if (tagNames.length) { result.tagNames = tagNames; result.tagMode = tagMode }
    return result
  }, [category, seasonal, launch, selected, rejected, tagNames, tagMode])
  const hasChanges = Object.keys(changes).length > 0
  const needsStrongConfirmation = selection.count > 100 || (selection.scope === 'filter' && !hasActiveAdminArtFilters(selection.filters))

  const summary = [
    category === 'keep' ? null : `Categoria: ${category === 'none' ? 'remover' : categories.find((c) => c.id === category)?.name || 'desconhecida'}`,
    seasonal === 'keep' ? null : `Data sazonal: ${seasonal === 'none' ? 'remover' : events.find((e) => e.id === seasonal)?.name || 'desconhecida'}`,
    launch === 'keep' ? null : `Lançamento: ${launch === 'yes' ? 'marcar' : 'desmarcar'}`,
    rejected === 'keep' ? null : `Biblioteca: ${rejected === 'yes' ? 'artes reprovadas' : 'principal'}`,
    selected === 'keep' ? null : `Selecionada: ${selected === 'yes' ? 'marcar' : 'desmarcar'}`,
    tagNames.length ? `${tagMode === 'add' ? 'Adicionar' : 'Remover'} tags: ${tagNames.map((t) => `#${t}`).join(', ')}` : null,
  ].filter(Boolean)

  async function apply() {
    if (saving || !hasChanges || !selection.count || (needsStrongConfirmation && confirmation !== 'ALTERAR')) return
    setSaving(true)
    try {
      const response = await fetch('/api/admin/arts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...selection, expectedCount: selection.count, changes, confirmedLarge: needsStrongConfirmation && confirmation === 'ALTERAR' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar as alterações.')
      toast.success(`${result.updated} ${result.updated === 1 ? 'arte atualizada' : 'artes atualizadas'} com sucesso!`)
      onApplied(result.updated)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao alterar o lote.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!saving) onOpenChange(value) }}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-zinc-950">
            <Layers3 className="h-5 w-5 text-orange-500" /> {review ? 'Revisar edição em lote' : 'Editar artes em lote'}
          </DialogTitle>
          <DialogDescription>
            {selection.count.toLocaleString('pt-BR')} {selection.count === 1 ? 'arte será atualizada' : 'artes serão atualizadas'}.
            {selection.scope === 'filter' ? ' Seleção por resultados filtrados.' : ' Seleção manual (inclusive de outras páginas).'}
          </DialogDescription>
        </DialogHeader>

        {!review ? (
          <div className="space-y-5 pt-1">
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3 text-xs leading-relaxed text-orange-900">
              <strong>Modo seguro:</strong> escolha apenas os campos que deseja mudar. Tudo que estiver em <strong>Manter sem alterações</strong> será preservado nas artes.
              É possível combinar categoria e data sazonal.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="font-bold">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">— Manter sem alterações</SelectItem>
                    <SelectItem value="none">Remover categoria</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.emoji} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Data sazonal</Label>
                <Select value={seasonal} onValueChange={setSeasonal}>
                  <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">— Manter sem alterações</SelectItem>
                    <SelectItem value="none">Remover sazonalidade</SelectItem>
                    {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.emoji} {e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 font-bold"><Sparkles className="h-4 w-4 text-orange-500" /> Lançamento</Label>
                <Select value={launch} onValueChange={setLaunch}>
                  <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">— Manter sem alterações</SelectItem>
                    <SelectItem value="yes">Marcar como lançamento (NOVO)</SelectItem>
                    <SelectItem value="no">Remover de lançamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">⭐ Selecionadas</Label>
                <Select value={selected} onValueChange={setSelected}>
                  <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">— Manter sem alterações</SelectItem>
                    <SelectItem value="yes">Marcar como selecionada</SelectItem>
                    <SelectItem value="no">Remover das selecionadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50/50 p-3"><Label className="font-bold text-red-800">Mover para sub-biblioteca</Label><Select value={rejected} onValueChange={setRejected}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="keep">Manter biblioteca atual</SelectItem><SelectItem value="yes">Marcar design reprovado</SelectItem><SelectItem value="no">Voltar para biblioteca principal</SelectItem></SelectContent></Select></div>
            <div className="space-y-2 rounded-xl border border-zinc-200 p-3">
              <Label className="flex items-center gap-2 font-bold"><Tags className="h-4 w-4 text-orange-500" /> Tags em lote <span className="font-normal text-zinc-400">(opcional)</span></Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={tagMode} onValueChange={(value) => setTagMode(value as 'add' | 'remove')}>
                  <SelectTrigger className="w-full rounded-xl sm:w-36"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="add">Adicionar</SelectItem><SelectItem value="remove">Remover</SelectItem></SelectContent>
                </Select>
                <Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder="Ex: pai, família, presente" className="rounded-xl" />
              </div>
              <p className="text-[11px] text-zinc-500">Separe por vírgulas. Adicionar mantém as tags existentes; remover apaga apenas as informadas.</p>
            </div>
            {tagNames.length > 20 && <p className="text-xs font-bold text-red-500">Limite de 20 tags por operação.</p>}
            <Button className="h-11 w-full rounded-xl bg-orange-500 font-black hover:bg-orange-600" disabled={!hasChanges || tagNames.length > 20 || tagNames.some((t) => t.length > 60)} onClick={() => { setReview(true); setConfirmation('') }}>
              <CheckCheck className="mr-2 h-4 w-4" /> Revisar {selection.count.toLocaleString('pt-BR')} artes
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-zinc-500">Alterações solicitadas</p>
              <ul className="space-y-1.5 text-sm font-medium text-zinc-800">
                {summary.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              <p className="mt-3 border-t border-zinc-200 pt-3 text-xs text-zinc-500">Títulos, códigos, arquivos originais, downloads e os campos não selecionados serão preservados.</p>
            </div>
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Atenção: esta operação modifica <strong>{selection.count.toLocaleString('pt-BR')} artes</strong> no catálogo publicado. Confira a categoria e a data sazonal antes de confirmar.</span>
            </div>
            {needsStrongConfirmation && (
              <div className="space-y-1.5">
                <Label htmlFor="bulk-confirm" className="font-bold">Para confirmar este lote grande, digite ALTERAR</Label>
                <Input id="bulk-confirm" autoComplete="off" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="ALTERAR" className="rounded-xl" />
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="h-11 flex-1 rounded-xl" disabled={saving} onClick={() => setReview(false)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar</Button>
              <Button className="h-11 flex-[2] rounded-xl bg-orange-500 font-black hover:bg-orange-600" disabled={saving || (needsStrongConfirmation && confirmation !== 'ALTERAR')} onClick={apply}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                {saving ? 'Aplicando alterações...' : 'Confirmar alterações'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
