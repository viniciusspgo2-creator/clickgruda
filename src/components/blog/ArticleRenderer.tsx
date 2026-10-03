/**
 * ArticleRenderer — renderiza os blocos estruturados dos artigos do blog.
 *
 * Server Component (zero JS client). Semântica HTML impecável para SEO:
 * h2/h3 hierárquicos, <table> com <caption>, <figure>/<blockquote>,
 * <details>/<summary> para FAQ e <a> com âncoras descritivas.
 */
import Link from 'next/link'
import { Check, ChevronDown, ArrowRight, Quote } from 'lucide-react'
import type { BlogBlock } from '@/content/blog'
import { cn } from '@/lib/utils'

export function ArticleRenderer({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  )
}

function BlockView({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2
          id={block.id}
          className="scroll-mt-24 pt-4 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl"
        >
          {block.text}
        </h2>
      )

    case 'h3':
      return <h3 className="pt-2 text-lg font-extrabold text-zinc-900 sm:text-xl">{block.text}</h3>

    case 'p':
      return <p className="text-[15px] leading-relaxed text-zinc-600 sm:text-base">{block.text}</p>

    case 'ul':
      return (
        <ul className="space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
              <span className="mt-1 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <Check className="h-3 w-3 text-orange-600" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="space-y-3">
          {block.items.map((item, i) => (
            <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-xs font-black text-white">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      )

    case 'table':
      return (
        <figure className="overflow-hidden">
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <caption className="sr-only">{block.caption}</caption>
              <thead>
                <tr className="bg-zinc-950 text-white">
                  {block.head.map((h, j) => (
                    <th
                      key={h}
                      scope="col"
                      className={cn('px-4 py-3.5 font-black', j === 1 && 'bg-orange-600')}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, j) => (
                  <tr key={j} className={cn('border-t border-zinc-200', j % 2 === 0 ? 'bg-white' : 'bg-zinc-50/60')}>
                    {row.map((cell, k) =>
                      k === 0 ? (
                        <th key={k} scope="row" className="px-4 py-3 font-bold text-zinc-800">
                          {cell}
                        </th>
                      ) : (
                        <td key={k} className={cn('px-4 py-3 text-zinc-600', k === 1 && 'bg-orange-50/70 font-semibold text-zinc-900')}>
                          {cell}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      )

    case 'callout':
      return (
        <aside className="rounded-2xl border border-orange-200 bg-orange-50/70 p-5" aria-label={block.title}>
          <p className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-orange-600">
            <Quote className="h-4 w-4" />
            {block.title}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-700">{block.text}</p>
        </aside>
      )

    case 'quote':
      return (
        <blockquote className="rounded-r-2xl border-l-4 border-orange-500 bg-zinc-50 p-5 text-[15px] font-medium italic leading-relaxed text-zinc-700 sm:text-base">
          {block.text}
        </blockquote>
      )

    case 'faq':
      return (
        <section aria-label="Perguntas frequentes do artigo" className="space-y-3">
          {block.items.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-zinc-200 bg-white transition-all open:border-orange-300 open:shadow-lg open:shadow-orange-500/10"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[15px] font-bold text-zinc-800 transition-colors hover:text-orange-600 [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-orange-500 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="border-t border-zinc-100 px-5 pb-5 pt-4 text-sm leading-relaxed text-zinc-600">{f.a}</p>
            </details>
          ))}
        </section>
      )

    case 'cta':
      return (
        <aside className="overflow-hidden rounded-3xl border-2 border-orange-500/50 bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8">
          <p className="text-lg font-black text-zinc-950 sm:text-xl">{block.text}</p>
          <Link
            href={block.href}
            className="group mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 font-extrabold text-white shadow-lg shadow-orange-600/30 transition-all hover:shadow-orange-500/50 hover:brightness-105"
          >
            {block.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </aside>
      )
  }
}
