'use client'

import { Box, ExternalLink, MessageCircle, ShieldCheck } from 'lucide-react'
import { WHATSAPP } from '@/lib/site'
import { track } from '@/lib/analytics'

const MOCKUP_PLATFORM_URL = 'https://clicktools.vercel.app/'
const MOCKUP_CODE_MSG = 'Olá! Quero solicitar o meu código para gerar mockups 3D na plataforma. Sou assinante da Click & Gruda.'

export function MockupToolCard() {
  return (
    <section aria-label="Gerador de mockups 3D" className="relative flex flex-col overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
      <div className="bg-grid-dark absolute inset-0" aria-hidden />
      <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-600/20 blur-[60px]" aria-hidden />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400"><Box className="h-5.5 w-5.5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black tracking-tight">Gerador de mockups 3D</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">Mostre suas artes aplicadas nos produtos e valorize suas apresentações.</p>
          </div>
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-xs leading-relaxed text-zinc-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
          <span><strong className="text-white">Acesso grátis para assinantes.</strong> Solicite seu código na plataforma ou pelo WhatsApp.</span>
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-4 sm:flex-row">
          <a href={MOCKUP_PLATFORM_URL} target="_blank" rel="noopener noreferrer" onClick={() => track('mockup_platform_open', { source: 'portal' })} className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-center text-xs font-black text-white shadow-md shadow-orange-600/20 transition-colors hover:bg-orange-600">Abrir gerador <ExternalLink className="h-4 w-4" /></a>
          <a href={WHATSAPP.link(MOCKUP_CODE_MSG)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-zinc-700 px-3 text-center text-xs font-bold text-zinc-200 transition-colors hover:bg-zinc-800"><MessageCircle className="h-4 w-4" /> Solicitar código</a>
        </div>
      </div>
    </section>
  )
}
