'use client'

import { motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Newspaper, Sparkles, Store } from 'lucide-react'
import { CATALOGO_DIGITAL, brl, catalogoWhatsappLink } from '@/lib/portal-news'

/**
 * Caixa de novidade do portal — "Catálogo Digital" chegando.
 * Mesmo visual do hero sazonal (fundo escuro + laranja) para combinar com o portal.
 */
export function CatalogoDigitalNews() {
  const c = CATALOGO_DIGITAL
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      aria-label="Novidade: Catálogo Digital"
      className="relative mb-6 overflow-hidden rounded-3xl bg-zinc-950 p-5 text-white shadow-xl sm:p-7"
    >
      <div className="bg-grid-dark absolute inset-0" aria-hidden />
      <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-orange-600/30 blur-[70px]" aria-hidden />

      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" /> Novidade chegando
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              <Newspaper className="h-3 w-3" /> Em breve mais novidades
            </span>
          </div>

          <div className="mt-3 flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <Store className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight sm:text-2xl">{c.headline}</h2>
              <p className="mt-1 max-w-xl text-sm font-medium leading-relaxed text-zinc-400">{c.description}</p>
            </div>
          </div>

          <ul className="mt-4 grid gap-1.5 text-[13px] font-semibold text-zinc-300 sm:grid-cols-1">
            {c.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                {h}
              </li>
            ))}
          </ul>
        </div>

        {/* Preços */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Valor anual</p>
          <div className="mt-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-zinc-400">Para o público em geral</span>
            <span className="font-black text-zinc-500 line-through decoration-zinc-600">{brl(c.publicPrice)}</span>
          </div>
          <div className="mt-3 rounded-xl border border-orange-500/40 bg-orange-500/10 p-3.5">
            <p className="text-[11px] font-black uppercase tracking-wider text-orange-300">Preço exclusivo para membros</p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-white">{brl(c.memberPrice)}</span>
              <span className="text-sm font-bold text-orange-300">/ ano</span>
            </p>
          </div>
          <a
            href={catalogoWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3.5 flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-sm font-black text-white shadow-md shadow-orange-600/30 transition-transform hover:scale-[1.02]"
          >
            Quero garantir o preço de membro <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.section>
  )
}
