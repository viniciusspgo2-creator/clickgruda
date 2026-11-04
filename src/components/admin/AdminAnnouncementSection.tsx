'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, CheckCircle2, Eye, Loader2, Send, ShieldAlert, ToggleLeft, Columns2, PanelTop } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnnouncementPresentation } from '@/components/portal/AnnouncementDialog'
import type { PortalAnnouncement, AnnouncementKind, AnnouncementContent } from '@/lib/announcement'

const DEFAULT_SECONDARY: AnnouncementContent = { kind: 'NOVIDADE', title: '', message: '' }
const ANNOUNCEMENT_DEFAULT: PortalAnnouncement = { enabled: false, kind: 'NOVIDADE', title: '', message: '', revision: '', layout: 'single', secondary: DEFAULT_SECONDARY }
const noticeKinds: { value: AnnouncementKind; label: string }[] = [
  { value: 'NOVIDADE', label: '✨ Novidade' }, { value: 'AVISO', label: '🔔 Aviso importante' }, { value: 'INFORMACAO', label: '📢 Informação' },
]

export function AdminAnnouncementSection() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ announcement: PortalAnnouncement }>({
    queryKey: ['admin-announcement'],
    queryFn: async () => {
      const response = await fetch('/api/admin/announcement', { cache: 'no-store' })
      if (!response.ok) throw new Error('Falha ao carregar avisos')
      return response.json()
    },
  })
  const [form, setForm] = useState<PortalAnnouncement>(ANNOUNCEMENT_DEFAULT)
  const [initialized, setInitialized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [preview, setPreview] = useState(false)
  useEffect(() => {
    if (data?.announcement && !initialized) { setForm({ ...ANNOUNCEMENT_DEFAULT, ...data.announcement, secondary: data.announcement.secondary ?? DEFAULT_SECONDARY }); setInitialized(true) }
  }, [data, initialized])

  const isDouble = form.layout === 'double'
  const firstReady = Boolean(form.title.trim() && form.message.trim())
  const secondReady = Boolean(form.secondary?.title.trim() && form.secondary?.message.trim())
  const canPublish = firstReady && (!isDouble || secondReady)

  const updateSecondary = (key: keyof AnnouncementContent, value: string) => {
    setForm(previous => ({ ...previous, secondary: { ...(previous.secondary ?? DEFAULT_SECONDARY), [key]: value } }))
  }
  const submit = async (enabled: boolean) => {
    if (enabled && !canPublish) { toast.error(isDouble ? 'Preencha os dois avisos antes de publicar.' : 'Preencha o título e a mensagem.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/announcement', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, enabled }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? 'Não foi possível salvar o aviso')
      setForm(body.announcement)
      await queryClient.invalidateQueries({ queryKey: ['admin-announcement'] })
      toast.success(enabled ? (isDouble ? 'Os dois avisos foram publicados juntos.' : 'Aviso publicado no portal.') : 'Pop-up desativado com sucesso.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao salvar aviso') }
    finally { setSubmitting(false) }
  }

  if (isLoading && !initialized) return <div className="h-72 animate-pulse rounded-3xl bg-zinc-100" />
  const active = data?.announcement.enabled === true
  return <section className="space-y-5">
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600"><BellRing className="h-4 w-4" /> Comunicação com assinantes</p><h2 className="mt-2 text-xl font-black tracking-tight text-zinc-900">Avisos e novidades do portal</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">Escolha uma comunicação simples ou dois cards simultâneos. A nova publicação aparece novamente aos assinantes.</p></div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>{active ? <CheckCircle2 className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}{active ? 'Pop-up ativo' : 'Nenhum aviso ativo'}</span>
      </div>
      <div className="mt-6 space-y-2">
        <Label>Formato de exibição</Label>
        <div className="grid max-w-xl grid-cols-2 gap-2" role="group" aria-label="Formato de pop-up">
          <button type="button" aria-pressed={!isDouble} onClick={() => setForm(previous => ({ ...previous, layout: 'single' }))} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition-colors ${!isDouble ? 'border-orange-500 bg-orange-50 text-orange-800 ring-1 ring-orange-200' : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-300'}`}><PanelTop className="h-5 w-5" /> Pop-up simples</button>
          <button type="button" aria-pressed={isDouble} onClick={() => setForm(previous => ({ ...previous, layout: 'double' }))} className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border p-3 text-sm font-bold transition-colors ${isDouble ? 'border-orange-500 bg-orange-50 text-orange-800 ring-1 ring-orange-200' : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-300'}`}><Columns2 className="h-5 w-5" /> Pop-up duplo</button>
        </div>
        <p className="text-xs text-zinc-500">No computador, dois cards lado a lado. No celular, um abaixo do outro. O mesmo botão fecha os dois avisos.</p>
      </div>
      <div className={`mt-7 grid gap-5 ${isDouble ? 'xl:grid-cols-2' : ''}`}>
        <NoticeFields
          prefix="cg-announcement" heading={isDouble ? 'Aviso 1 — Esquerda' : undefined}
          value={{ kind: form.kind, title: form.title, message: form.message }}
          onChange={(key, value) => setForm(previous => ({ ...previous, [key]: value }))}
        />
        {isDouble && <NoticeFields
          prefix="cg-announcement-secondary" heading="Aviso 2 — Direita"
          value={form.secondary ?? DEFAULT_SECONDARY}
          onChange={updateSecondary}
        />}
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-5">
        <Button type="button" onClick={() => setPreview(true)} variant="outline" disabled={!canPublish} className="rounded-xl"><Eye className="mr-2 h-4 w-4" /> Pré-visualizar {isDouble ? 'os dois' : ''}</Button>
        <Button type="button" onClick={() => submit(true)} disabled={submitting || !canPublish} className="rounded-xl bg-orange-500 font-extrabold text-white hover:bg-orange-600">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{active ? 'Atualizar e republicar' : isDouble ? 'Publicar dois avisos' : 'Publicar aviso'}</Button>
        {active && <Button type="button" onClick={() => submit(false)} disabled={submitting} variant="outline" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"><ShieldAlert className="mr-2 h-4 w-4" /> Desativar pop-up</Button>}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-500">Os links oficiais do Instagram e Facebook e o botão “Continuar navegando” são fixos. No modo duplo, os dois cards compartilham um único rodapé para manter a leitura limpa.</p>
    </div>
    {preview && <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-[#05070c]/85 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setPreview(false) }}><AnnouncementPresentation notice={form} preview onClose={() => setPreview(false)} /></div>}
  </section>
}

function NoticeFields({ prefix, heading, value, onChange }: {
  prefix: string
  heading?: string
  value: AnnouncementContent
  onChange: (key: keyof AnnouncementContent, value: string) => void
}) {
  return <div className="space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
    {heading && <h3 className="text-sm font-extrabold text-orange-700">{heading}</h3>}
    <div className="max-w-xs space-y-2"><Label htmlFor={`${prefix}-kind`}>Tipo de comunicação</Label><select id={`${prefix}-kind`} value={value.kind} onChange={event => onChange('kind', event.target.value)} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800 focus:outline-orange-500">{noticeKinds.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
    <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor={`${prefix}-title`}>Título do aviso</Label><span className="text-[11px] text-zinc-400">{value.title.length}/90</span></div><Input id={`${prefix}-title`} maxLength={90} value={value.title} onChange={event => onChange('title', event.target.value)} placeholder="Ex.: Novas artes disponíveis!" className="h-12 rounded-xl text-base font-bold" /></div>
    <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor={`${prefix}-message`}>Mensagem</Label><span className="text-[11px] text-zinc-400">{value.message.length}/650</span></div><textarea id={`${prefix}-message`} rows={4} maxLength={650} value={value.message} onChange={event => onChange('message', event.target.value)} placeholder="Ex.: Novas coleções foram adicionadas à biblioteca. Confira!" className="min-h-[116px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200" /><p className="text-xs text-zinc-500">Para uma leitura confortável, prefira até 250 caracteres.</p></div>
  </div>
}
