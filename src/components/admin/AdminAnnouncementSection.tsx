'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, CheckCircle2, Eye, Loader2, Send, ShieldAlert, ToggleLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnnouncementCard } from '@/components/portal/AnnouncementDialog'
import type { PortalAnnouncement, AnnouncementKind } from '@/lib/announcement'

const ANNOUNCEMENT_DEFAULT: PortalAnnouncement = { enabled: false, kind: 'NOVIDADE', title: '', message: '', revision: '' }

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
    if (data?.announcement && !initialized) { setForm(data.announcement); setInitialized(true) }
  }, [data, initialized])

  const submit = async (enabled: boolean) => {
    if (enabled && (!form.title.trim() || !form.message.trim())) { toast.error('Preencha o título e a mensagem.'); return }
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
      toast.success(enabled ? 'Aviso publicado. Ele aparecerá no portal dos assinantes.' : 'Aviso desativado com sucesso.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao salvar aviso') }
    finally { setSubmitting(false) }
  }

  if (isLoading && !initialized) return <div className="h-72 animate-pulse rounded-3xl bg-zinc-100" />
  const active = data?.announcement.enabled === true
  return <section className="space-y-5">
    <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600"><BellRing className="h-4 w-4" /> Comunicação com assinantes</p><h2 className="mt-2 text-xl font-black tracking-tight text-zinc-900">Avisos e novidades do portal</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-500">Publique um pop-up elegante no portal. Os usuários veem cada publicação uma vez por navegador; uma nova publicação aparece novamente.</p></div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>{active ? <CheckCircle2 className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}{active ? 'Aviso ativo' : 'Nenhum aviso ativo'}</span>
      </div>
      <div className="mt-7 grid gap-5">
        <div className="max-w-xs space-y-2"><Label htmlFor="cg-announcement-kind">Tipo de comunicação</Label><select id="cg-announcement-kind" value={form.kind} onChange={event => setForm(previous => ({ ...previous, kind: event.target.value as AnnouncementKind }))} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-800 focus:outline-orange-500"><option value="NOVIDADE">✨ Novidade</option><option value="AVISO">🔔 Aviso importante</option><option value="INFORMACAO">📢 Informação</option></select></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="cg-announcement-title">Título do aviso</Label><span className="text-[11px] text-zinc-400">{form.title.length}/90</span></div><Input id="cg-announcement-title" maxLength={90} value={form.title} onChange={event => setForm(previous => ({ ...previous, title: event.target.value }))} placeholder="Ex.: Novas artes disponíveis!" className="h-12 rounded-xl text-base font-bold" /></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="cg-announcement-message">Mensagem</Label><span className="text-[11px] text-zinc-400">{form.message.length}/650</span></div><textarea id="cg-announcement-message" rows={4} maxLength={650} value={form.message} onChange={event => setForm(previous => ({ ...previous, message: event.target.value }))} placeholder="Ex.: Adicionamos novas coleções à biblioteca. Aproveite para explorar os lançamentos da semana!" className="min-h-[116px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-4 text-[15px] leading-relaxed text-zinc-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200" /><p className="text-xs text-zinc-500">O card adapta o tamanho do título e espaçamento automaticamente. Para uma leitura confortável, prefira mensagens de até 250 caracteres.</p></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-5">
        <Button type="button" onClick={() => setPreview(true)} variant="outline" disabled={!form.title.trim() || !form.message.trim()} className="rounded-xl"><Eye className="mr-2 h-4 w-4" /> Pré-visualizar</Button>
        <Button type="button" onClick={() => submit(true)} disabled={submitting || !form.title.trim() || !form.message.trim()} className="rounded-xl bg-orange-500 font-extrabold text-white hover:bg-orange-600">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{active ? 'Atualizar e republicar' : 'Publicar aviso'}</Button>
        {active && <Button type="button" onClick={() => submit(false)} disabled={submitting} variant="outline" className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"><ShieldAlert className="mr-2 h-4 w-4" /> Desativar aviso</Button>}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-500">O rodapé com os links oficiais de Instagram e Facebook e o botão “Continuar navegando” é fixo para todos os avisos.</p>
    </div>
    {preview && <div className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto bg-[#05070c]/85 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setPreview(false) }}><AnnouncementCard notice={form} preview onClose={() => setPreview(false)} /></div>}
  </section>
}
