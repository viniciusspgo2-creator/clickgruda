'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock3, Newspaper } from 'lucide-react'

type HomeArticle = {
  slug: string
  title: string
  description: string
  categoryLabel: string
  emoji: string
  cover: string
  coverAlt: string
  readTime: string
  datePublished: string
}

/**
 * Seção do blog na página inicial (pública, sem login).
 * Busca os 3 artigos mais recentes (fixos + criados no admin) na API pública.
 */
export function BlogHomeSection() {
  const [articles, setArticles] = useState<HomeArticle[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/blog?limit=3', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.articles) setArticles(data.articles)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loaded || articles.length === 0) return null

  return (
    <section id="blog" className="cg-sales-section px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="cg-sales-eyebrow flex items-center gap-2">
              <Newspaper size={15} /> Blog do sublimador
            </p>
            <h2 className="cg-sales-heading mt-4">Aprenda a vender mais canecas</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
              Guias de sublimação, dicas de artes, macetes de produção e as tendências do mercado — conteúdo novo toda
              semana, feito por quem vive de canecas.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/85 hover:bg-white/5"
          >
            Ver todos os artigos <ArrowRight size={16} className="text-[#ffab70]" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((a) => (
            <article key={a.slug} className="group">
              <Link
                href={`/blog/${a.slug}`}
                className="block overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-orange-400/40"
              >
                <div className="relative aspect-[21/9.5] w-full overflow-hidden bg-zinc-900">
                  <Image
                    src={a.cover}
                    alt={a.coverAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-2.5 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="rounded-full bg-orange-500 px-2.5 py-1 uppercase tracking-wider text-white">
                      {a.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 text-white/50">
                      <Clock3 className="h-3.5 w-3.5" /> {a.readTime}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold leading-snug text-white transition-colors group-hover:text-[#ffb17c]">
                    {a.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-white/60">{a.description}</p>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-[#ffb17c]">
                    Ler artigo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
