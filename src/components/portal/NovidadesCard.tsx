'use client'

import { GraduationCap, Gift, Sparkles, Store } from 'lucide-react'

const NOVIDADES = [
  {
    icon: Store,
    title: 'Lojinha Catálogo',
    text: 'O próximo lançamento: cadastre os seus produtos, tenha a sua própria loja online e receba pedidos direto no WhatsApp.',
  },
  {
    icon: GraduationCap,
    title: 'Plataforma de cursos',
    text: 'Dicas e macetes: vamos reunir os melhores materiais da internet e deixar tudo disponível para você.',
  },
]

/**
 * NovidadesCard — aviso fixo e compacto do que está vindo pela frente.
 * Conteúdo editável direto no array NOVIDADES acima.
 */
export function NovidadesCard() {
  return (
    <section
      aria-label="Novidades que estão chegando"
      className="relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-300">
          <Sparkles className="h-3 w-3" /> Em breve
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
          <Gift className="h-3 w-3" /> Grátis para assinantes
        </span>
      </div>

      <h2 className="mt-3 text-lg font-black tracking-tight text-zinc-900 sm:text-xl">
        Estamos trabalhando para trazer novidades
      </h2>

      <ul className="mt-3.5 space-y-2.5">
        {NOVIDADES.map((n) => (
          <li key={n.title} className="flex items-start gap-3 rounded-xl bg-zinc-50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <n.icon className="h-4.5 w-4.5" />
            </span>
            <p className="text-[12.5px] leading-relaxed text-zinc-600">
              <span className="font-black text-zinc-900">{n.title}: </span>
              {n.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
