'use client'

import { Box, ExternalLink, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WHATSAPP } from '@/lib/site'
import { track } from '@/lib/analytics'

/** Plataforma de mockups 3D — ferramenta externa parceira. */
const MOCKUP_PLATFORM_URL = 'https://clicktools.vercel.app/'

const MOCKUP_CODE_MSG =
  'Olá! Quero solicitar o meu código para gerar mockups 3D na plataforma. Sou assinante da Click & Gruda.'

/**
 * MockupToolCard — atalho para a plataforma de mockups 3D.
 * O assinante abre a opção de mockups e usa o código exclusivo (grátis).
 * O código pode ser pedido pela própria plataforma (o pedido cai no Painel Admin Master)
 * ou pelo WhatsApp.
 */
export function MockupToolCard() {
  return (
    <section
      aria-label="Plataforma de mockups 3D"
      className="relative flex flex-col overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-xl"
    >
      <div className="bg-grid-dark absolute inset-0" aria-hidden />
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-600/30 blur-[60px]" aria-hidden />

      <div className="relative flex h-full flex-col">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            <Sparkles className="h-3 w-3" /> Ferramenta exclusiva
          </span>
        </div>

        <div className="mt-3 flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
            <Box className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-black tracking-tight sm:text-xl">Mockups 3D das suas artes</h2>
            <p className="mt-1 max-w-md text-[13px] font-medium leading-relaxed text-zinc-400">
              Gere mockups 3D profissionais com as suas artes — basta abrir a opção de{' '}
              <span className="font-bold text-zinc-200">mockups</span> dentro da plataforma.
            </p>
          </div>
        </div>

        {/* Aviso: código exclusivo */}
        <div className="mt-3.5 rounded-xl border border-orange-500/40 bg-orange-500/10 p-3">
          <p className="flex items-start gap-2 text-[12px] font-semibold leading-relaxed text-orange-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
            <span>
              <span className="font-black">Solicite o seu código para gerar mockups</span> — é grátis para assinantes. Peça pela própria
              plataforma (o pedido chega direto aqui pra gente) ou chame no WhatsApp.
            </span>
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            asChild
            className="h-10 flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-[13px] font-black text-white shadow-md shadow-orange-600/30 transition-transform hover:scale-[1.02]"
          >
            <a
              href={MOCKUP_PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('mockup_platform_open', { source: 'portal' })}
            >
              Abrir plataforma de mockups <ExternalLink className="ml-1.5 h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="outline" className="h-10 rounded-xl border-zinc-700 bg-transparent text-[13px] font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white">
            <a href={WHATSAPP.link(MOCKUP_CODE_MSG)} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-4 w-4" /> Pedir código no WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
