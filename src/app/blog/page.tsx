import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, CalendarDays, Clock, Sparkles } from 'lucide-react';
import {
  ALL_ARTICLES,
  BLOG_CATEGORIES,
  countCategory,
  formatDateBR,
  readingMinutes,
  type BlogCategory,
} from '@/data/blog';
import { getSeoConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoConfig();
  const title = 'Blog — Sublimação, Mockups, Marketing e Ferramentas Grátis';
  return {
    title,
    description:
      'Guias práticos sobre sublimação de canecas, mockups 3D, precificação, marketing no WhatsApp e Instagram, e todas as ferramentas gratuitas do Click & Gruda.',
    keywords: ['blog sublimação', 'mockups de canecas', 'marketing para artesãos', 'ferramentas grátis'],
    alternates: { canonical: '/blog' },
    openGraph: {
      title,
      url: `${seo.siteUrl}/blog`,
      type: 'website',
      locale: 'pt_BR',
      siteName: seo.siteName,
      images: [{ url: seo.ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, images: [seo.ogImage] },
  };
}

const CATEGORY_STYLES: Record<BlogCategory, string> = {
  'Sublimação': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Mockups': 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  'Marketing': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'Redes Sociais': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'Ferramentas': 'bg-violet-500/15 text-violet-400 border-violet-500/30',
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const active = BLOG_CATEGORIES.includes(cat as BlogCategory) ? (cat as BlogCategory) : null;
  const list = active ? ALL_ARTICLES.filter((a) => a.category === active) : ALL_ARTICLES;
  const [featured, ...rest] = list;

  return (
    <div className="relative">
      {/* brilho de fundo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(232,112,58,0.14),transparent_65%)]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-6">
        {/* cabeçalho */}
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" /> Blog do Click &amp; Gruda
          </span>
          <h1 className="font-display mt-4 text-3xl font-bold leading-tight text-white sm:text-5xl">
            Conteúdo para quem vive de{' '}
            <span className="bg-gradient-to-r from-[#e8703a] to-[#ffb488] bg-clip-text text-transparent">
              canecas personalizadas
            </span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
            Guias práticos de sublimação, mockups, precificação e divulgação — escritos para
            você vender mais usando as {ALL_ARTICLES.length > 0 ? 'ferramentas gratuitas' : 'ferramentas'} do site.
            Novo artigo toda semana.
          </p>
        </div>

        {/* filtro por categoria */}
        <div className="thin-scroll mt-8 flex gap-2 overflow-x-auto pb-1">
          <Link
            href="/blog"
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all',
              !active
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
            )}
          >
            Todos ({ALL_ARTICLES.length})
          </Link>
          {BLOG_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/blog?cat=${encodeURIComponent(c)}`}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all',
                active === c
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
              )}
            >
              {c} ({countCategory(c)})
            </Link>
          ))}
        </div>

        {list.length === 0 && (
          <p className="mt-16 text-center text-sm text-neutral-500">
            Nenhum artigo nesta categoria ainda — volte em breve.
          </p>
        )}

        {/* destaque */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mt-8 block overflow-hidden rounded-3xl border border-white/10 bg-[#131010] transition-all hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
          >
            <div className="grid md:grid-cols-[1.5fr_1fr]">
              <div className="p-6 sm:p-8">
                <span className={cn('inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider', CATEGORY_STYLES[featured.category])}>
                  {featured.category}
                </span>
                <h2 className="font-display mt-4 text-xl font-bold leading-snug text-white transition-colors group-hover:text-primary sm:text-2xl">
                  {featured.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-400">{featured.description}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDateBR(featured.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {readingMinutes(featured)} min de leitura
                  </span>
                  <span className="flex items-center gap-1.5 font-bold text-primary">
                    Ler artigo <BookOpen className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
              <div className="relative hidden items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,#231512,#0d0a08)] md:flex">
                <span className="watermark pointer-events-none absolute font-display text-[120px] font-bold leading-none">
                  CG
                </span>
                <BookOpen className="relative h-20 w-20 text-primary/60 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
              </div>
            </div>
          </Link>
        )}

        {/* grade */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group flex flex-col rounded-2xl border border-white/10 bg-[#131010] p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <span className={cn('inline-block w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', CATEGORY_STYLES[a.category])}>
                {a.category}
              </span>
              <h3 className="font-display mt-3 text-base font-bold leading-snug text-white transition-colors group-hover:text-primary">
                {a.title}
              </h3>
              <p className="mt-2 line-clamp-3 flex-1 text-[13px] leading-relaxed text-neutral-400">
                {a.description}
              </p>
              <div className="mt-4 flex items-center gap-3 border-t border-white/5 pt-3 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {formatDateBR(a.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {readingMinutes(a)} min
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
