'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Lightbulb, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { track } from '@/lib/analytics'

/**
 * ThemeSuggestion — "aba" de sugestão de tema da landing.
 *
 * Visual de aba de pasta: cabeçalho laranja arredondado no topo (a "orelha"
 * da aba) + corpo em cartão. O envio é público e anônimo por opção
 * (nome e contato opcionais) e cai direto no Painel Admin Master.
 */

const MAX_LEN = 600

type FormStatus = 'idle' | 'sending' | 'sent'

export function ThemeSuggestion() {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [error, setError] = useState('')

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
        body: JSON.stringify({ message: message.trim(), name: name.trim(), contact: contact.trim() }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar agora. Tente novamente.')
      track('theme_suggestion', { length: message.trim().length })
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Não foi possível enviar. Tente novamente.')
    }
  }

  const reset = () => {
    setMessage('')
    setName('')
    setContact('')
    setError('')
    setStatus('idle')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="mx-auto w-full max-w-3xl"
    >
      {/* orelha da aba */}
      <div className="inline-flex items-center gap-2 rounded-t-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/30 sm:px-6 sm:text-sm">
        <Lightbulb className="h-4 w-4" />
        Sugestão de tema
      </div>

      {/* corpo da aba */}
      <div className="rounded-b-3xl rounded-tr-3xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
        {status === 'sent' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="py-6 text-center"
            role="status"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </span>
            <h3 className="mt-4 text-xl font-black text-white sm:text-2xl">Sugestão recebida. Obrigado!</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              Sua ideia foi registrada e a nossa equipe criativa vai analisar com carinho. Temas mais pedidos
              entram no cronograma de criação do acervo.
            </p>
            <Button
              onClick={reset}
              variant="outline"
              className="mt-6 rounded-xl border-zinc-700 bg-zinc-950 font-bold text-zinc-200 hover:bg-zinc-800 hover:text-white"
            >
              Enviar outra sugestão
            </Button>
          </motion.div>
        ) : (
          <>
            <h3 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Tem uma sugestão para um tema?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-[15px]">
              Queremos te ouvir. Deixe aqui a sua sugestão — um tema, uma frase, um estilo de arte — e ela vai
              direto para a nossa equipe de criação.
            </p>

            <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
              <div>
                <label htmlFor="sugestao-mensagem" className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Sua ideia <span className="text-orange-400">*</span>
                </label>
                <textarea
                  id="sugestao-mensagem"
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_LEN))}
                  placeholder="Ex.: arte de flork com tema de pescaria, frase engraçada sobre café, tributo ao seu time..."
                  required
                  rows={4}
                  maxLength={MAX_LEN}
                  aria-describedby="sugestao-contador"
                  className="mt-2 w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-[15px] leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
                <p id="sugestao-contador" className="mt-1 text-right text-[11px] font-medium text-zinc-500">
                  {message.length}/{MAX_LEN}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sugestao-nome" className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Seu nome <span className="normal-case text-zinc-600">(opcional)</span>
                  </label>
                  <input
                    id="sugestao-nome"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 120))}
                    placeholder="Como podemos te chamar?"
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
                <div>
                  <label htmlFor="sugestao-contato" className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    WhatsApp ou e-mail <span className="normal-case text-zinc-600">(opcional)</span>
                  </label>
                  <input
                    id="sugestao-contato"
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value.slice(0, 160))}
                    placeholder="Para avisarmos quando a arte sair"
                    className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
                  {error}
                </p>
              )}

              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Sugestão anônima? É só deixar os campos opcionais em branco.
                </p>
                <Button
                  type="submit"
                  disabled={status === 'sending'}
                  className="h-11 w-full shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 font-extrabold text-white shadow-lg shadow-orange-600/30 transition-all hover:shadow-orange-500/50 disabled:opacity-60 sm:w-auto"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      Enviar sugestão <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </motion.div>
  )
}
