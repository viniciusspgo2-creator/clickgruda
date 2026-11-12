import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Clock3, ShieldCheck } from 'lucide-react'
import { SiteHeader, SiteFooter, MobileNote } from '@/components/blog/SiteChrome'
import { PageViewTracker } from '@/components/blog/PageViewTracker'
import { ArticleRenderer } from '@/components/blog/ArticleRenderer'
import { MarkdownArticle } from '@/components/blog/MarkdownArticle'
import { BLOG_ARTICLES, BLOG_CATEGORY_LABELS, AUTHOR_NOTE_TEXT, getArticle, getRelatedArticles, type BlogArticle } from '@/content/blog'
import { getAllBlogListItems, getDbPostBySlug, type DbBlogPost } from '@/lib/blog-posts'
import { SITE, SITE_URL } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

// Revalida a cada 60 s: artigos criados no admin passam a existir sem novo deploy.
export const revalidate = 60

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

type ResolvedArticle =
  | { kind: 'static'; article: BlogArticle }
  | { kind: 'db'; post: DbBlogPost; relatedSlugs: string[] }

async function resolveArticle(slug: string): Promise<ResolvedArticle | null> {
  const dbPost = await getDbPostBySlug(slug)
  if (dbPost) {
    const all = await getAllBlogListItems()
    const relatedSlugs = all.filter((a) => a.slug !== slug).slice(0, 3).map((a) => a.slug)
    return { kind: 'db', post: dbPost, relatedSlugs }
  }
  const article = getArticle(slug)
  if (!article) return null
  return { kind: 'static', article }
}

/** Visão normalizada para metadados, JSON-LD e layout (vale para os dois tipos). */
function viewModel(resolved: ResolvedArticle) {
  if (resolved.kind === 'static') {
    const a = resolved.article
    return {
      slug: a.slug,
      title: a.title,
      seoTitle: a.seoTitle,
      description: a.description,
      keywords: a.keywords,
      categoryLabel: BLOG_CATEGORY_LABELS[a.category] ?? a.category,
      cover: a.cover,
      coverAlt: a.coverAlt,
      readTime: a.readTime,
      datePublished: a.datePublished,
      dateModified: a.dateModified,
      lead: a.lead,
    }
  }
  const p = resolved.post
  return {
    slug: p.slug,
    title: p.title,
    seoTitle: p.seoTitle,
    description: p.description,
    keywords: p.keywords,
    categoryLabel: BLOG_CATEGORY_LABELS[p.category] ?? p.category,
    cover: p.cover,
    coverAlt: p.coverAlt,
    readTime: p.readTime,
    datePublished: p.datePublished,
    dateModified: p.dateModified,
    lead: p.description,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const resolved = await resolveArticle(slug)
  if (!resolved) return {}
  const vm = viewModel(resolved)
  const url = `${SITE_URL}/blog/${vm.slug}`

  return {
    title: vm.seoTitle,
    description: vm.description,
    keywords: vm.keywords,
    alternates: { canonical: `/blog/${vm.slug}` },
    authors: [{ name: SITE.author.name }],
    openGraph: {
      title: vm.seoTitle,
      description: vm.description,
      siteName: SITE.name,
      locale: 'pt_BR',
      type: 'article',
      url,
      publishedTime: vm.datePublished,
      modifiedTime: vm.dateModified,
      authors: [SITE.author.name],
      section: vm.categoryLabel,
      tags: vm.keywords,
      images: [{ url: vm.cover, width: 1344, height: 768, alt: vm.coverAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: vm.seoTitle,
      description: vm.description,
      images: [vm.cover],
    },
    other: {
      'article:published_time': vm.datePublished,
      'article:modified_time': vm.dateModified,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const resolved = await resolveArticle(slug)
  if (!resolved) notFound()
  const vm = viewModel(resolved)

  const staticArticle = resolved.kind === 'static' ? resolved.article : null
  const faqBlocks = staticArticle
    ? staticArticle.blocks.filter((b): b is Extract<typeof b, { type: 'faq' }> => b.type === 'faq')
    : []

  // Artigos relacionados: estáticos usam o cluster; os do admin usam os 3 mais recentes.
  const related =
    resolved.kind === 'static'
      ? getRelatedArticles(staticArticle!.related)
      : (await getAllBlogListItems())
          .filter((a) => a.slug !== vm.slug)
          .slice(0, 3)
          .map((a) => ({ slug: a.slug, emoji: a.emoji, category: a.category, title: a.title, readTime: a.readTime }))

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE_URL}/blog/${vm.slug}#article`,
        headline: vm.seoTitle,
        alternativeHeadline: vm.title,
        description: vm.description,
        inLanguage: 'pt-BR',
        url: `${SITE_URL}/blog/${vm.slug}`,
        mainEntityOfPage: { '@id': `${SITE_URL}/blog/${vm.slug}#webpage` },
        image: `${SITE_URL}${vm.cover}`,
        datePublished: vm.datePublished,
        dateModified: vm.dateModified,
        author: { '@type': 'Organization', name: SITE.author.name, description: SITE.author.description },
        reviewedBy: { '@type': 'Organization', name: SITE.reviewer.name },
        publisher: { '@id': `${SITE_URL}/#organization` },
        about: { '@id': `${SITE_URL}/#organization` },
        keywords: vm.keywords.join(', '),
        articleSection: vm.categoryLabel,
        isPartOf: { '@id': `${SITE_URL}/blog#blog` },
      },
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog/${vm.slug}#webpage`,
        url: `${SITE_URL}/blog/${vm.slug}`,
        name: `${vm.seoTitle} | ${SITE.name}`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE_URL}${vm.cover}` },
        datePublished: vm.datePublished,
        dateModified: vm.dateModified,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: vm.title, item: `${SITE_URL}/blog/${vm.slug}` },
        ],
      },
      ...(faqBlocks.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${SITE_URL}/blog/${vm.slug}#faq`,
              inLanguage: 'pt-BR',
              dateModified: vm.dateModified,
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
      <PageViewTracker event="article_view" title={vm.title} />
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
            <span className="text-orange-400">{vm.categoryLabel}</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-full bg-orange-500 px-3 py-1 uppercase tracking-wider text-white">
              {vm.categoryLabel}
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock3 className="h-3.5 w-3.5" /> Leitura de {vm.readTime}
            </span>
            <span className="flex items-center gap-1 text-zinc-400">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(vm.datePublished).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} · atualizado em{' '}
              <time dateTime={vm.dateModified}>{new Date(vm.dateModified).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</time>
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black leading-[1.1] tracking-tight sm:text-4xl">{vm.title}</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-300 sm:text-lg">{vm.lead}</p>

          <div className="relative mt-8 overflow-hidden rounded-3xl border border-zinc-800 shadow-2xl shadow-orange-950/40">
            <Image
              src={vm.cover}
              alt={vm.coverAlt}
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
          <p className="mt-2 text-[15px] font-semibold leading-relaxed text-zinc-800">{vm.lead}</p>
        </aside>

        <article className="mt-8">
          {resolved.kind === 'static' ? (
            <ArticleRenderer blocks={staticArticle!.blocks} />
          ) : (
            <MarkdownArticle content={resolved.post.content} />
          )}
        </article>

        {/* E-E-A-T: autoria e revisão */}
        <footer className="mt-10 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-xs leading-relaxed text-zinc-500">
          <p className="font-bold text-zinc-700">Sobre a autoria deste artigo</p>
          <p className="mt-1">
            Autoria: {SITE.author.name} · Revisão técnica: {SITE.reviewer.name} · Publicado em{' '}
            <time dateTime={vm.datePublished}>{new Date(vm.datePublished).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</time>{' '}
            · Última atualização em{' '}
            <time dateTime={vm.dateModified}>{new Date(vm.dateModified).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</time>
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
                  {r.emoji} {BLOG_CATEGORY_LABELS[r.category] ?? r.category}
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
