import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Clock3, ShieldCheck } from 'lucide-react'
import { SiteHeader, SiteFooter, MobileNote } from '@/components/blog/SiteChrome'
import { PageViewTracker } from '@/components/blog/PageViewTracker'
import { ArticleRenderer } from '@/components/blog/ArticleRenderer'
import { BLOG_ARTICLES, BLOG_CATEGORY_LABELS, AUTHOR_NOTE_TEXT, getArticle, getRelatedArticles } from '@/content/blog'
import { SITE, SITE_URL, todayISO } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) return {}
  const url = `${SITE_URL}/blog/${article.slug}`

  return {
    title: article.seoTitle,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/blog/${article.slug}` },
    authors: [{ name: SITE.author.name }],
    openGraph: {
      title: article.seoTitle,
      description: article.description,
      siteName: SITE.name,
      locale: 'pt_BR',
      type: 'article',
      url,
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
      authors: [SITE.author.name],
      section: BLOG_CATEGORY_LABELS[article.category],
      tags: article.keywords,
      images: [{ url: article.cover, width: 1344, height: 768, alt: article.coverAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle,
      description: article.description,
      images: [article.cover],
    },
    other: {
      'article:published_time': article.datePublished,
      'article:modified_time': article.dateModified,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()
  const related = getRelatedArticles(article.related)
  const faqBlocks = article.blocks.filter((b): b is Extract<typeof b, { type: 'faq' }> => b.type === 'faq')

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE_URL}/blog/${article.slug}#article`,
        headline: article.seoTitle,
        alternativeHeadline: article.title,
        description: article.description,
        inLanguage: 'pt-BR',
        url: `${SITE_URL}/blog/${article.slug}`,
        mainEntityOfPage: { '@id': `${SITE_URL}/blog/${article.slug}#webpage` },
        image: `${SITE_URL}${article.cover}`,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        wordCount: article.blocks.reduce((acc, b) => acc + ('text' in b && typeof b.text === 'string' ? b.text.split(/\s+/).length : 0), 0),
        author: { '@type': 'Organization', name: SITE.author.name, description: SITE.author.description },
        reviewedBy: { '@type': 'Organization', name: SITE.reviewer.name },
        publisher: { '@id': `${SITE_URL}/#organization` },
        about: { '@id': `${SITE_URL}/#organization` },
        keywords: article.keywords.join(', '),
        articleSection: BLOG_CATEGORY_LABELS[article.category],
        isPartOf: { '@id': `${SITE_URL}/blog#blog` },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog/${article.slug}#webpage`,
        url: `${SITE_URL}/blog/${article.slug}`,
        name: `${article.seoTitle} | ${SITE.name}`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE_URL}${article.cover}` },
        datePublished: article.datePublished,
        dateModified: article.dateModified,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_URL}/blog/${article.slug}` },
        ],
      },
      ...(faqBlocks.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${SITE_URL}/blog/${article.slug}#faq`,
              inLanguage: 'pt-BR',
              dateModified: article.dateModified,
              mainEntity: faqBlocks.flatMap((f) =>
                f.items.map((item) => ({
                  '@type': 'Question',
                  name: item.q,
                  acceptedAnswer: { '@type': 'Answer', text: item.a },
                }))
              ),
            },
          ]
        : []),
    ],
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageViewTracker event="article_view" title={article.title} />
      <script
        type="application/ld+json"
        id="article-schema"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <SiteHeader />
      <MobileNote />

      {/* Capa */}
      <section className="bg-grid-dark relative overflow-hidden bg-zinc-950 pb-12 pt-10 text-white sm:pt-14">
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-orange-600/20 blur-[120px]" aria-hidden />
        <div className="relative mx-auto w-full max-w-3xl px-4 sm:px-6">
          <nav aria-label="Trilha de navegação" className="text-xs font-semibold text-zinc-400">
            <Link href="/" className="transition-colors hover:text-orange-400">
              Início
            </Link>
            <span className="mx-2 text-zinc-600">/</span>
            <Link href="/blog" className="transition-colors hover:text-orange-400">
              Blog
            </Link>
            <span className="mx-2 text-zinc-600">/</span>
            <span className="text-orange-400">{BLOG_CATEGORY_LABELS[article.category]}</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-orange-500 px-3 py-1 uppercase tracking-wider text-white">
              {BLOG_CATEGORY_LABELS[article.category]}
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock3 className="h-3.5 w-3.5" /> Leitura de {article.readTime}
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(article.datePublished).toLocaleDateString('pt-BR')} · atualizado em{' '}
              <time dateTime={article.dateModified}>{new Date(article.dateModified).toLocaleDateString('pt-BR')}</time>
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl">{article.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">{article.lead}</p>

          <div className="relative mt-8 overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl shadow-orange-950/40">
            <Image
              src={article.cover}
              alt={article.coverAlt}
              width={1344}
              height={768}
              sizes="(max-width: 768px) 100vw, 768px"
              className="h-auto w-full object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Corpo do artigo */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        {/* BLUF: key takeaways do artigo */}
        <aside className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6" aria-label="Resumo do artigo">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-600">
            <BadgeCheck className="h-4 w-4" /> Resposta rápida
          </p>
          <p className="mt-2 text-[15px] font-semibold leading-relaxed text-zinc-800">{article.lead}</p>
        </aside>

        <article className="mt-8">
          <ArticleRenderer blocks={article.blocks} />
        </article>

        {/* E-E-A-T: autoria e revisão */}
        <footer className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-xs leading-relaxed text-zinc-500">
          <p className="font-bold text-zinc-700">Sobre a autoria deste artigo</p>
          <p className="mt-1">
            Autoria: {SITE.author.name} · Revisão técnica: {SITE.reviewer.name} · Publicado em{' '}
            <time dateTime={article.datePublished}>{new Date(article.datePublished).toLocaleDateString('pt-BR')}</time>{' '}
            · Última atualização em{' '}
            <time dateTime={article.dateModified}>{new Date(article.dateModified).toLocaleDateString('pt-BR')}</time>
          </p>
          <p className="mt-1.5 flex items-start gap-1.5">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />
            {AUTHOR_NOTE_TEXT}
          </p>
        </footer>

        {/* Artigos relacionados */}
        <section aria-label="Artigos relacionados" className="mt-12">
          <h2 className="text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">
            Continue <span className="text-gradient-orange">aprendendo</span>
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <span className="text-xs font-black uppercase tracking-wider text-orange-600">
                  {r.emoji} {BLOG_CATEGORY_LABELS[r.category]}
                </span>
                <span className="mt-2 text-sm font-bold leading-snug text-zinc-900 transition-colors group-hover:text-orange-600">
                  {r.title}
                </span>
                <span className="mt-auto pt-3 text-[11px] font-semibold text-zinc-400">{r.readTime} de leitura</span>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/blog"
            className="inline-flex h-11 items-center rounded-xl border border-zinc-200 px-5 text-sm font-bold text-zinc-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao blog
          </Link>
          <Link
            href="/#preco"
            className="group inline-flex h-11 items-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition-all hover:shadow-orange-500/50 hover:brightness-105"
          >
            Acesso vitalício R$ 47,90
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
