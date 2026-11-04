import type { MetadataRoute } from 'next'
import { SITE_URL, CONTENT_UPDATED_ISO, DEMO_VIDEO } from '@/lib/site'
import { BLOG_ARTICLES } from '@/content/blog'

/**
 * Sitemap dinâmico (app/sitemap.ts) — servido em /sitemap.xml.
 * Inclui todas as páginas públicas + image sitemap das artes de capa.
 * lastmod usa a data de modificação real de cada artigo.
 * Consistência garantida com os canonicals (mesma base SITE_URL).
 */
export const dynamic = 'force-static'

// O serializador de vídeo do Next interpola texto diretamente no XML.
// Escapar também o '&' da marca mantém o sitemap válido para o Google.
const xmlText = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

export default function sitemap(): MetadataRoute.Sitemap {
  const lastmod = new Date(CONTENT_UPDATED_ISO)

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: lastmod,
      changeFrequency: 'weekly',
      priority: 1,
      images: [`${SITE_URL}/uploads/hero-mug.png`],
      videos: [{ title: xmlText(DEMO_VIDEO.name), description: xmlText(DEMO_VIDEO.description), thumbnail_loc: DEMO_VIDEO.thumbnailUrl, player_loc: DEMO_VIDEO.embedUrl, duration: DEMO_VIDEO.durationSeconds, publication_date: DEMO_VIDEO.uploadDate }],
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
      url: `${SITE_URL}/guia`,
      lastModified: lastmod,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/sobre`,
      lastModified: lastmod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
