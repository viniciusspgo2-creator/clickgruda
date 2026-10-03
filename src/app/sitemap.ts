import type { MetadataRoute } from 'next'
import { SITE_URL, todayISO } from '@/lib/site'
import { BLOG_ARTICLES } from '@/content/blog'

/**
 * Sitemap dinâmico (app/sitemap.ts) — servido em /sitemap.xml.
 * Inclui todas as páginas públicas + image sitemap das artes de capa.
 * lastmod usa a data de modificação real de cada artigo.
 * Consistência garantida com os canonicals (mesma base SITE_URL).
 */
export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastmod = new Date(todayISO())

  return [
    {
      url: SITE_URL,
      lastModified: lastmod,
      changeFrequency: 'weekly',
      priority: 1,
      images: [`${SITE_URL}/uploads/hero-mug.png`],
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: lastmod,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...BLOG_ARTICLES.map((a) => ({
      url: `${SITE_URL}/blog/${a.slug}`,
      lastModified: new Date(a.dateModified),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      images: [`${SITE_URL}${a.cover}`],
    })),
    {
      url: `${SITE_URL}/sobre`,
      lastModified: lastmod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
