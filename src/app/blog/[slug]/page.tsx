import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock, User } from 'lucide-react';
import {
  ALL_ARTICLES,
  formatDateBR,
  getArticle,
  readingMinutes,
  relatedArticles,
} from '@/data/blog';
import { getSeoConfig } from '@/lib/site-config';
import { ArticleBlocks } from '@/components/blog/article-blocks';

export function generateStaticParams() {
  return ALL_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Artigo não encontrado' };
  const seo = await getSeoConfig();

  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.date,
      authors: [seo.siteName],
      tags: article.tags,
      url: `${seo.siteUrl}/blog/${article.slug}`,
      locale: 'pt_BR',
      siteName: seo.siteName,
      images: [{ url: seo.ogImage, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
      images: [seo.ogImage],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const seo = await getSeoConfig();
  const related = relatedArticles(article);
  const minutes = readingMinutes(article);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: 'pt-BR',
    author: { '@type': 'Organization', name: seo.siteName, url: seo.siteUrl },
    publisher: {
      '@type': 'Organization',
      name: seo.siteName,
      logo: { '@type': 'ImageObject', url: `${seo.siteUrl}${seo.ogImage}` },
    },
    mainEntityOfPage: `${seo.siteUrl}/blog/${article.slug}`,
    keywords: article.keywords.join(', '),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: seo.siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${seo.siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${seo.siteUrl}/blog/${article.slug}` },
    ],
  };

  const faqLd = article.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: article.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null;

  return (
    <article className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(232,112,58,0.12),transparent_65%)]" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6">
        {/* breadcrumb */}
        <nav aria-label="Trilha" className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Link href="/" className="transition-colors hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <Link href="/blog" className="transition-colors hover:text-primary">
            Blog
          </Link>
          <span>/</span>
          <span className="truncate text-neutral-400">{article.category}</span>
        </nav>

        {/* cabeçalho do artigo */}
        <header className="mt-6">
          <h1 className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
            {article.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-white/5 py-3 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Equipe {seo.siteName}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <time dateTime={article.date}>{formatDateBR(article.date)}</time>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {minutes} min de leitura
            </span>
          </div>
        </header>

        {/* conteúdo */}
        <div className="mt-8">
          <ArticleBlocks blocks={article.content} />
        </div>

        {/* FAQ */}
        {article.faq.length > 0 && (
          <section className="mt-12" aria-label="Perguntas frequentes">
            <h2 className="font-display flex items-center gap-3 text-xl font-bold text-white sm:text-2xl">
              <span className="h-5 w-1.5 rounded-full bg-primary" /> Perguntas frequentes
            </h2>
            <div className="mt-5 space-y-2.5">
              {article.faq.map((f, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] transition-colors open:border-primary/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-neutral-100 [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="shrink-0 text-primary transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="border-t border-white/5 px-4 py-3.5 text-sm leading-relaxed text-neutral-300">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* tags */}
        <div className="mt-10 flex flex-wrap gap-2">
          {article.tags.map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-neutral-400">
              #{t}
            </span>
          ))}
        </div>

        {/* relacionados */}
        {related.length > 0 && (
          <section className="mt-14" aria-label="Leia também">
            <h2 className="font-display text-lg font-bold text-white">Leia também</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-xl border border-white/10 bg-[#131010] p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{r.category}</p>
                  <h3 className="font-display mt-1.5 text-[13px] font-bold leading-snug text-neutral-100 group-hover:text-primary">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* voltar */}
        <div className="mt-12 border-t border-white/5 pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-xs font-bold text-neutral-300 transition-colors hover:border-primary/50 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para todos os artigos
          </Link>
        </div>
      </div>
    </article>
  );
}
