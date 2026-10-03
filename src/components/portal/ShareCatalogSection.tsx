'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  Share2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

type ShareLink = {
  id: string
  token: string
  whatsapp: string
  active: boolean
  views: number
  expiresAt: string
  createdAt: string
}

const linkUrl = (token: string) =>
  typeof window === 'undefined' ? `/?catalogo=${token}` : `${window.location.origin}/?catalogo=${token}`

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function isExpired(l: ShareLink) {
  return new Date(l.expiresAt).getTime() < Date.now()
}

/**
 * ShareCatalogSection — aba "Compartilhar" do portal.
 *
 * O assinante gera um LINK TEMPORÁRIO para o cliente DELE navegar no catálogo
 * (somente artes: sem preço, sem download) e escolher uma arte. A escolha
 * volta pelo WhatsApp do próprio assinante.
 */
export function ShareCatalogSection() {
  const user = useStore((s) => s.user)
  const queryClient = useQueryClient()
  const [whatsapp, setWhatsapp] = useState('')
  const [days, setDays] = useState('3')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const linksQ = useQuery<{ links: ShareLink[] }>({
    queryKey: ['share-links'],
    queryFn: async () => (await fetch('/api/portal/share-links')).json(),
  })

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/portal/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp, expiresInDays: Number(days) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar o link.')
      return data as { link: ShareLink }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['share-links'] })
      setWhatsapp('')
      toast.success('Link gerado! Copie e envie para o seu cliente.')
      track('share_link_created', { linkId: data.link.id })
      // Copia já o link — UX de um toque
      navigator.clipboard.writeText(linkUrl(data.link.token)).catch(() => {})
      setCopiedId(data.link.id)
      setTimeout(() => setCopiedId(null), 2500)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/portal/share-links/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['share-links'] })
      toast.success('Link excluído.')
    },
    onError: () => toast.error('Erro ao excluir o link.'),
  })

  const copyLink = async (l: ShareLink) => {
    try {
      await navigator.clipboard.writeText(linkUrl(l.token))
      setCopiedId(l.id)
      toast.success('Link copiado!')
      track('share_link_copy', { linkId: l.id })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  const shareWhatsapp = (l: ShareLink) => {
    const text = `Olha o catálogo de artes para você escolher a sua! ✨ ${linkUrl(l.token)}`
    const phone = l.whatsapp ? l.whatsapp.replace(/\D/g, '') : ''
    const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/'
    window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  const links = linksQ.data?.links ?? []
  const activeCount = links.filter((l) => !isExpired(l)).length

  return (
    <div className="space-y-6">
      {/* Como funciona */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-xl sm:p-8"
      >
        <div className="bg-grid-dark absolute inset-0" aria-hidden />
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-orange-600/30 blur-[70px]" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-orange-400">
              <Share2 className="h-3.5 w-3.5" /> Catálogo para o seu cliente
            </span>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Seu cliente escolhe a arte. <span className="text-gradient-orange">Você só prensa.</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Gere um link temporário e mande no WhatsApp do seu cliente: ele navega pelo catálogo (sem preços, sem
              baixar nada), escolhe a arte e responde direto para você.
            </p>
          </div>
          <ol className="grid gap-2.5 text-sm font-medium text-zinc-300">
            {[
              'Gere o link (válido por 24h, 3 ou 7 dias)',
              'Envie para o seu cliente no WhatsApp',
              'Ele escolhe e te responde — você produz a caneca',
            ].map((s, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-black text-white">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </motion.div>

      {/* Criar novo link */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-600">
          <Plus className="h-4 w-4 text-orange-500" /> Gerar novo link
          <span className={cn('ml-auto text-[11px] font-bold normal-case', activeCount >= 5 ? 'text-red-500' : 'text-zinc-400')}>
            {activeCount}/5 ativos
          </span>
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="share-wa" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Seu WhatsApp <span className="font-medium normal-case text-zinc-400">(recomendado — o cliente fala direto com você)</span>
            </Label>
            <Input
              id="share-wa"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/[^\d+]/g, '').slice(0, 16))}
              placeholder="62 9 8888-0000"
              inputMode="tel"
              className="h-10 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-zinc-500">Validade</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24 horas</SelectItem>
                <SelectItem value="3">3 dias</SelectItem>
                <SelectItem value="7">7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || activeCount >= 5}
            className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25"
          >
            {create.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Link2 className="mr-1.5 h-4 w-4" /> Gerar link
              </>
            )}
          </Button>
        </div>
        <p className="mt-2.5 text-[11px] leading-relaxed text-zinc-400">
          Com o WhatsApp preenchido, o cliente usa o botão &quot;Quero esta arte&quot; e a escolha chega prontinha para você.
          Máximo de 5 links ativos por vez.
        </p>
      </div>

      {/* Lista de links */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wide text-zinc-600">Seus links</h3>
        {linksQ.isLoading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-200/70" />
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
              <Link2 className="h-6 w-6 text-orange-400" />
            </div>
            <p className="mt-3 text-sm font-bold text-zinc-700">Nenhum link ainda</p>
            <p className="mt-1 max-w-xs text-xs text-zinc-400">
              Gere o primeiro link acima e envie para o seu cliente escolher a arte.
            </p>
          </div>
        ) : (
          links.map((l) => {
            const expired = isExpired(l)
            return (
              <div
                key={l.id}
                className={cn(
                  'flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center',
                  expired ? 'border-zinc-200 opacity-60' : 'border-zinc-200'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('font-black uppercase', expired ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-100 text-emerald-700')}>
                      {expired ? 'Expirado' : 'Ativo'}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs font-bold text-zinc-500">
                      <Eye className="h-3.5 w-3.5" /> {l.views} {l.views === 1 ? 'visita' : 'visitas'}
                    </span>
                    <span className="text-xs text-zinc-400">expira {fmtDate(l.expiresAt)}</span>
                  </div>
                  <code className="mt-1.5 block truncate rounded-lg bg-zinc-50 px-2.5 py-1.5 font-mono text-[11px] text-zinc-500">
                    {linkUrl(l.token)}
                  </code>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => copyLink(l)} className="h-9 rounded-lg text-xs font-bold">
                    {copiedId === l.id ? <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                    {copiedId === l.id ? 'Copiado!' : 'Copiar'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => shareWhatsapp(l)}
                    className="h-9 rounded-lg border-emerald-200 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                  >
                    <MessageCircle className="mr-1 h-3.5 w-3.5" /> Enviar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(linkUrl(l.token), '_blank', 'noopener')}
                    className="h-9 w-9 rounded-lg p-0 text-zinc-400"
                    aria-label="Abrir catálogo"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-9 w-9 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" aria-label="Excluir link">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir este link?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Quem tiver o link salvo não conseguirá mais abrir o catálogo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="rounded-xl bg-red-500 hover:bg-red-600" onClick={() => remove.mutate(l.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })
        )}
        {user && (
          <p className="text-[11px] text-zinc-400">
            Dica: peça para o cliente dizer o nome da arte na resposta do WhatsApp — o link já deixa a mensagem pronta.
          </p>
        )}
      </div>
    </div>
  )
}
