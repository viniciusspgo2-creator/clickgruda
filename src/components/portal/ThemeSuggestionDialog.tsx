'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Lightbulb, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/lib/store'
import { track } from '@/lib/analytics'

const MAX_LEN = 600

/**
 * ThemeSuggestionDialog — sugestão de tema DENTRO do portal.
 * O envio cai direto no Painel Admin Master (ThemeSuggestion, status NEW)
 * e fica vinculado à conta do assinante quando ele está logado.
 */
export function ThemeSuggestionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const user = useStore((s) => s.user)
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  // Reabre limpo a cada nova sessão do diálogo
  useEffect(() => {
    if (open) {
      setStatus('idle')
      setError('')
    }
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim().length < 3) {
      setError('Escreva a sua sugestão (mínimo 3 caracteres).')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), name: user?.name || '', contact: contact.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar agora. Tente novamente.')
      track('theme_suggestion', { length: message.trim().length, source: 'portal' })
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    }
  }

  const reset = () => {
    setMessage('')
    setContact('')
    setError('')
    setStatus('idle')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border-zinc-200 bg-white p-0 sm:p-0" aria-describedby="sugestao-desc">
        <DialogHeader className="rounded-t-3xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-widest text-white">
            <Lightbulb className="h-5 w-5" /> Sugestão de tema
          </DialogTitle>
          <DialogDescription id="sugestao-desc" className="text-sm font-medium text-orange-50">
            Queremos te ouvir — a sua ideia vai direto para a nossa equipe de criação.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 pt-5">
          {status === 'sent' ? (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </motion.div>
              <h3 className="mt-4 text-lg font-black text-zinc-900">Sugestão enviada! 💡</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-500">
                Obrigado! A sua ideia chegou na nossa central de criação e vamos avaliar com carinho.
              </p>
              <div className="mt-5 flex justify-center gap-2.5">
                <Button
                  onClick={reset}
                  variant="outline"
                  className="h-10 rounded-xl border-orange-300 font-bold text-orange-600 hover:bg-orange-50"
                >
                  Enviar outra
                </Button>
                <Button onClick={() => onOpenChange(false)} className="h-10 rounded-xl bg-zinc-950 font-bold text-white hover:bg-zinc-800">
                  Fechar
                </Button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sugestao-mensagem" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Sua ideia <span className="text-orange-500">*</span>
                  </Label>
                  <span className="text-[11px] font-semibold text-zinc-400">{message.length}/{MAX_LEN}</span>
                </div>
                <textarea
                  id="sugestao-mensagem"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
                  placeholder="ex: arte de flork com tema de pescaria, frase engracada sobre cafe, tributo ao seu time..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-800 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sugestao-contato" className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                  WhatsApp ou e-mail <span className="font-medium normal-case text-zinc-400">(opcional)</span>
                </Label>
                <Input
                  id="sugestao-contato"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Para te avisarmos quando a arte sair"
                  className="h-10 rounded-xl border-zinc-200 text-sm focus-visible:ring-orange-500"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600" role="alert">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-zinc-400">Enviado como {user?.name || 'visitante'}.</p>
                <Button
                  type="submit"
                  disabled={status === 'sending' || message.trim().length < 3}
                  className="h-11 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 font-black text-white shadow-lg shadow-orange-500/30 hover:brightness-105"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      Enviar sugestão <Send className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
