import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
import { SiteHeader, SiteFooter, MobileNote } from '@/components/blog/SiteChrome'
import { PageViewTracker } from '@/components/blog/PageViewTracker'
import { BLOG_ARTICLES, BLOG_CATEGORY_LABELS } from '@/content/blog'
import { SITE, SITE_URL, todayISO } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Blog do Sublimador — Guias, Custos e Artes para Canecas',
  description:
    'Guias definitivos de sublimação de canecas: quanto custa começar, como escolher prensa, onde encontrar artes e o calendário de datas comemorativas para vender mais.',
  keywords: [
    'blog sublimação',
    'guias de sublimação de canecas',
    'como vender canecas personalizadas',
    'artes para sublimação de canecas',
  ],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog do Sublimador — Click & Gruda',
    description:
      'Conteúdo de referência para quem vive de canecas personalizadas: guias, custos, equipamentos e sazonalidade.',
    siteName: SITE.name,
    locale: 'pt_BR',
    type: 'website',
    url: `${SITE_URL}/blog`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog do Sublimador — Click & Gruda',
    description: 'Guias definitivos de sublimação de canecas, custos, equipamentos e sazonalidade.',
  },
}

export default function BlogPage() {
  const featured = BLOG_ARTICLES[0]
  const rest = BLOG_ARTICLES.slice(1)

  const blogSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/blog#webpage`,
        url: `${SITE_URL}/blog`,
        name: 'Blog do Sublimador — Click & Gruda',
        inLanguage: 'pt-BR',
        dateModified: todayISO(),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        description:
          'Guias, comparativos e conteúdo de referência sobre sublimação de canecas, artes digitais e vendas sazonais.',
      },
      {
        '@type': 'Blog',
        '@id': `${SITE_URL}/blog#blog`,
        name: 'Blog do Sublimador — Click & Gruda',
        url: `${SITE_URL}/blog`,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'pt-BR',
        blogPost: BLOG_ARTICLES.map((a) => ({
          '@type': 'BlogPosting',
          headline: a.title,
          description: a.description,
          url: `${SITE_URL}/blog/${a.slug}`,
          datePublished: a.datePublished,
          dateModified: a.dateModified,
          image: `${SITE_URL}${a.cover}`,
          author: { '@type': 'Organization', name: SITE.author.name },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        ],
      },
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageViewTracker event="blog_view" title="Blog do Sublimador" />
      <script
        type="application/ld+json"
        id="blog-schema"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema).replace(/</g, '\\u003c') }}
      />

      <SiteHeader />
      <MobileNote />

      {/* Hero do blog */}
      <section className="bg-grid-dark relative overflow-hidden bg-zinc-950 py-14 text-white sm:py-16">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-orange-600/25 blur-[120px]" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <nav aria-label="Trilha de navegação" className="text-xs font-semibold text-zinc-400">
            <Link href="/" className="transition-colors hover:text-orange-400">
              Início
            </Link>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-orange-400">Blog</span>
          </nav>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            O blog que faz sua caneca <span className="text-gradient-orange">vender mais</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Guias definitivos, comparativos honestos de equipamentos e a estratégia sazonal do varejo de canecas —
            conteúdo de referência produzido pela equipe da Click &amp; Gruda, revisado tecnicamente.
          </p>
        </div>
      </section>

      {/* Destaque + grade */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
        {/* Artigo destaque */}
        <article className="group relative overflow-hidden rounded-3xl border border-zinc-200 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10">
          <Link href={`/blog/${featured.slug}`} className="grid gap-0 md:grid-cols-2">
            <div className="relative aspect-[21/9.5] w-full overflow-hidden bg-zinc-950 md:aspect-auto md:min-h-[280px]">
              <Image
                src={featured.cover}
                alt={featured.coverAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
            <div className="flex flex-col justify-center gap-3 p-6 sm:p-8">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="rounded-full bg-orange-500 px-3 py-1 uppercase tracking-wider text-white">
                  {BLOG_CATEGORY_LABELS[featured.category]}
                </span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock3 className="h-3.5 w-3.5" /> {featured.readTime}
                </span>
              </div>
              <h2 className="text-2xl font-black leading-tight text-zinc-950 transition-colors group-hover:text-orange-600 sm:text-3xl">
                {featured.title}
              </h2>
              <p className="text-sm leading-relaxed text-zinc-500 sm:text-[15px]">{featured.description}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-extrabold text-orange-600">
                Ler o guia completo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </article>

        {/* Demais artigos */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <article key={a.slug} className="group">
              <Link
                href={`/blog/${a.slug}`}
                className="block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/10"
              >
                <div className="relative aspect-[21/9.5] w-full overflow-hidden bg-zinc-100">
                  <Image
                    src={a.cover}
                    alt={a.coverAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col gap-2.5 p-5">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="rounded-full bg-orange-100 px-2.5 py-1 uppercase tracking-wider text-orange-600">
                      {BLOG_CATEGORY_LABELS[a.category]}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock3 className="h-3.5 w-3.5" /> {a.readTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-black leading-snug text-zinc-950 transition-colors group-hover:text-orange-600">
                    {a.title}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-zinc-500">{a.description}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(a.datePublished).toLocaleDateString('pt-BR')} · Atualizado em{' '}
                    {new Date(a.dateModified).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* CTA */}
        <aside className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 p-8 text-center text-white sm:p-10">
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            Gostou do conteúdo? O acervo completo te espera
          </h2>
          <p className="mx-auto mt-3 max-w-xl font-medium text-white/90">
            R$ 47,90 uma única vez, acesso vitalício a todas as artes — incluindo lançamentos frequentes.
          </p>
          <Link
            href="/#preco"
            className="mt-6 inline-flex h-13 items-center rounded-2xl bg-zinc-950 px-8 text-base font-black uppercase tracking-wide text-white shadow-2xl transition-all hover:scale-[1.03] hover:bg-zinc-900"
          >
            Quero acessar agora <ArrowRight className="ml-2 h-5 w-5 text-orange-400" />
          </Link>
        </aside>
      </main>

      <SiteFooter />
    </div>
  )
}
