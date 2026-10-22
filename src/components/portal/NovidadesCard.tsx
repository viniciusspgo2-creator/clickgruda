'use client'

import { ArrowUpRight, BadgeCheck, ExternalLink, ShoppingBag, Store } from 'lucide-react'
import { track } from '@/lib/analytics'

/** A loja online é um serviço já disponível, não uma funcionalidade 'em breve'. */
export function NovidadesCard() {
  return (
    <section aria-label="Loja online para assinantes" className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1d2a40] via-[#16253b] to-[#121c30] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/10 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300"><BadgeCheck className="h-3 w-3" /> Incluído na assinatura</span>
        <span className="text-[11px] font-medium text-slate-300">Sem custo adicional para assinantes</span>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300"><Store className="h-5.5 w-5.5" /></span>
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Sua própria loja online</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-300">Cadastre seus produtos, organize seu catálogo e compartilhe sua vitrine com os clientes. Sua loja, com a sua marca.</p>
        </div>
      </div>
      <a href="https://www.clickgruda.com.br" target="_blank" rel="noopener noreferrer" onClick={() => track('catalog_store_open', { source: 'portal' })} className="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-orange-400/25 bg-[#0b1526] px-4 text-sm font-extrabold text-orange-200 shadow-sm transition-all hover:border-orange-400/60 hover:bg-[#1e3047] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500">
        <span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Criar minha loja grátis</span>
        <span className="flex items-center gap-1 text-[11px] text-orange-300">clickgruda.com.br <ArrowUpRight className="h-4 w-4" /></span>
      </a>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400"><ExternalLink className="h-3 w-3" /> Abre em uma nova aba, sem sair da biblioteca.</p>
    </section>
  )
}
