'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, ChevronLeft, ChevronRight, MessageCircle, SendHorizonal, X } from 'lucide-react'
import {
  FALLBACK_ANSWER,
  QUICK_REPLIES,
  WHATSAPP_URL,
  matchIntent,
  type ChatIntent,
} from '@/lib/sublimation-chatbot'

type ChatMessage = {
  id: number
  from: 'user' | 'bot'
  text: string
  isFallback?: boolean
  suggestions?: string[]
}

const GREETING_TEXT =
  'Olá! 👋 Eu sou o Assistente Click & Gruda, seu ajudante de sublimação de canecas.\n\nPosso te ajudar com temperatura, tempo e pressão, papel, tinta, impressora, perfil de cor, problemas como arte desbotada ou fantasma, passo a passo e precificação.\n\nÉ só escrever sua dúvida ou tocar num dos botões abaixo.'

const GREETING_SUGGESTIONS = [
  'Qual a temperatura ideal da caneca?',
  'Passo a passo para sublimar uma caneca',
  'Minha arte saiu desbotada, e agora?',
]

let messageId = 0
function nextId() {
  messageId += 1
  return messageId
}

/**
 * Assistente Click & Gruda — ChatBot MECÂNICO (sem IA).
 * As respostas vêm da base de conhecimento em `@/lib/sublimation-chatbot`
 * e são escolhidas por pontuação de palavras-chave (`matchIntent`).
 * Autocontido: basta importar e renderizar dentro do Hub.
 */
export default function SublimationChatBot() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasGreeted, setHasGreeted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quickRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const updateQuickArrows = () => {
    const el = quickRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }
  const scrollQuick = (dir: 1 | -1) => {
    quickRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })
  }
  useEffect(() => {
    if (!open) return
    updateQuickArrows()
    const el = quickRef.current
    if (!el) return
    el.addEventListener('scroll', updateQuickArrows, { passive: true })
    window.addEventListener('resize', updateQuickArrows)
    return () => {
      el.removeEventListener('scroll', updateQuickArrows)
      window.removeEventListener('resize', updateQuickArrows)
    }
  }, [open])

  // Saudação inicial na primeira abertura do chat.
  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true)
      setMessages([
        { id: nextId(), from: 'bot', text: GREETING_TEXT, suggestions: GREETING_SUGGESTIONS },
      ])
    }
  }, [open, hasGreeted])

  // Rola para a última mensagem e foca o input ao abrir / ao responder.
  useEffect(() => {
    const root = scrollRef.current
    if (root) root.scrollTop = root.scrollHeight
    if (open) inputRef.current?.focus()
  }, [messages, typing, open])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function pushBotReply(intent: ChatIntent | null) {
    setTyping(true)
    timerRef.current = setTimeout(() => {
      setTyping(false)
      if (intent) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            from: 'bot',
            text: intent.answer,
            suggestions: intent.quickReplies && intent.quickReplies.length > 0 ? intent.quickReplies : undefined,
          },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          { id: nextId(), from: 'bot', text: FALLBACK_ANSWER, isFallback: true, suggestions: QUICK_REPLIES.slice(0, 4) },
        ])
      }
    }, 450)
  }

  function send(raw: string) {
    const text = raw.trim()
    if (!text || typing) return
    setInput('')
    setMessages((prev) => [...prev, { id: nextId(), from: 'user', text }])
    pushBotReply(matchIntent(text))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <>
      {/* Botão flutuante do robozinho */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente de sublimação'}
        className="fixed bottom-5 right-5 z-[70] grid h-14 w-14 place-items-center rounded-full bg-orange-500 text-black shadow-[0_10px_26px_rgba(249,115,22,.3)] transition hover:scale-105 hover:bg-orange-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
      >
        {open ? <X size={26} strokeWidth={2.4} /> : <Bot size={28} strokeWidth={2.2} />}
        <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-[#0b0d13] bg-emerald-400 text-[9px] font-black text-black">
          1
        </span>
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0b0d13] bg-emerald-400" aria-hidden />
      </button>

      {/* Painel do chat */}
      {open && (
        <section
          aria-label="Assistente Click & Gruda"
          className="fixed bottom-24 right-4 z-[70] flex h-[min(560px,calc(100dvh-120px))] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b0d13] text-white shadow-[0_28px_70px_rgba(0,0,0,.6)] sm:right-5"
        >
          {/* Header */}
          <header className="flex items-center gap-3 border-b border-white/10 bg-[#171a22] px-4 py-3.5">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-300">
              <Bot size={26} />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#171a22] bg-emerald-400" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm font-extrabold">Assistente Click &amp; Gruda</strong>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                Online · responde na hora
              </span>
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com suporte no WhatsApp"
              title="Falar com suporte no WhatsApp"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#25d366]/15 text-[#25d366] transition hover:bg-[#25d366]/25"
            >
              <MessageCircle size={19} />
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>

          {/* Mensagens */}
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-3 text-[13px] leading-relaxed ${
                    msg.from === 'user'
                      ? 'rounded-br-md bg-orange-500 font-medium text-black'
                      : 'rounded-bl-md border border-white/10 bg-[#171a22] text-zinc-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.isFallback && (
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-3 py-2.5 text-xs font-extrabold text-black transition hover:bg-[#1eb856]"
                    >
                      <MessageCircle size={16} />
                      Falar com suporte no WhatsApp
                    </a>
                  )}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => send(s)}
                          className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1.5 text-[11px] font-bold text-orange-200 transition hover:bg-orange-500/20"
                        >
                          {s}
                        </button>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-[#171a22] px-4 py-3.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-orange-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Atalhos rápidos — uma linha, desliza para o lado com as setas */}
          <div className="flex items-center gap-1 border-t border-white/10 py-2.5 pl-2 pr-2">
            <button
              type="button"
              onClick={() => scrollQuick(-1)}
              disabled={!canScrollLeft}
              aria-label="Rolar atalhos para a esquerda"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-200 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <div
              ref={quickRef}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto scroll-smooth px-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {QUICK_REPLIES.slice(0, 6).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-zinc-200 transition hover:border-orange-500/50 hover:text-orange-200"
                >
                  {q}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollQuick(1)}
              disabled={!canScrollRight}
              aria-label="Rolar atalhos para a direita"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-200 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 bg-[#171a22] px-3 py-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte sobre sublimação..."
              aria-label="Escreva sua dúvida sobre sublimação"
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b0d13] px-3.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-orange-500/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Enviar mensagem"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendHorizonal size={19} />
            </button>
          </form>
        </section>
      )}
    </>
  )
}
