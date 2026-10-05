'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Loader2, Send, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/lib/store'
import { CATALOGO_DIGITAL, brl } from '@/lib/portal-news'

/** Formata enquanto digita: 62999998888 -> (62) 99999-8888 */
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Lista de espera do Catálogo Digital — cadastro básico (nome, e-mail, WhatsApp). */
export function WaitlistDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const user = useStore((s) => s.user)
  const queryClient = useQueryClient()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [whatsapp, setWhatsapp] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setStatus('sending')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, whatsapp }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Não foi possível entrar na lista. Tente de novo.')
        setStatus('idle')
        return
      }
      setStatus('sent')
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    } catch {
      setError('Sem conexão. Tente de novo.')
      setStatus('idle')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setTimeout(() => setStatus('idle'), 250)
      }}
    >
      <DialogContent className="max-w-md rounded-3xl border-zinc-200 bg-white p-0 sm:p-0" aria-describedby="waitlist-desc">
        <DialogHeader className="rounded-t-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-white">
            <Store className="h-5 w-5" /> Lista de espera
          </DialogTitle>
          <DialogDescription id="waitlist-desc" className="text-sm font-medium text-orange-50">
            {CATALOGO_DIGITAL.name} · preço de membro {brl(CATALOGO_DIGITAL.memberPrice)}/ano
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-5">
          {status === 'sent' ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <h3 className="mt-3 text-lg font-black text-zinc-900">Você está na lista! 🎉</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Quando o {CATALOGO_DIGITAL.name} for lançado, avisamos você pelo e-mail e pelo WhatsApp — já com o preço exclusivo de membro.
              </p>
              <Button onClick={() => onOpenChange(false)} className="mt-5 rounded-xl bg-zinc-950 font-bold hover:bg-zinc-800">
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="wl-name" className="text-xs font-bold uppercase tracking-wide text-zinc-500">Seu nome</Label>
                <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wl-email" className="text-xs font-bold uppercase tracking-wide text-zinc-500">E-mail</Label>
                <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wl-wa" className="text-xs font-bold uppercase tracking-wide text-zinc-500">WhatsApp (com DDD)</Label>
                <Input
                  id="wl-wa"
                  inputMode="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                  placeholder="(62) 99999-9999"
                  className="h-11 rounded-xl"
                />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600">{error}</p>}
              <Button
                onClick={submit}
                disabled={status === 'sending'}
                className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 font-black shadow-md shadow-orange-500/25"
              >
                {status === 'sending' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Entrar na lista de espera
              </Button>
              <p className="text-center text-[11px] text-zinc-400">Sem compromisso e sem pagamento agora. Só avisamos no lançamento.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
