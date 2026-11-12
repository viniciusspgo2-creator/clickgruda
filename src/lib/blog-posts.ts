import { db } from '@/lib/db'
import { BLOG_ARTICLES, BLOG_CATEGORY_LABELS, type BlogArticle } from '@/content/blog'

/**
 * Blog — fonte única para as páginas públicas (/blog, /blog/[slug], sitemap e home).
 * Junta os artigos estáticos de src/content/blog.ts com os artigos criados
 * pelo admin no banco (BlogPost, conteúdo em Markdown). Só entram os publicados.
 */

export type BlogListItem = {
  slug: string
  title: string
  description: string
  category: string
  categoryLabel: string
  emoji: string
  cover: string
  coverAlt: string
  readTime: string
  datePublished: string
  dateModified: string
  source: 'static' | 'db'
}

export type DbBlogPost = {
  id: string
  slug: string
  title: string
  seoTitle: string
  description: string
  keywords: string[]
  category: string
  cover: string
  coverAlt: string
  content: string
  readTime: string
  datePublished: string
  dateModified: string
}

const toISODate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10)
}

const readTimeFromText = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

const staticToListItem = (a: BlogArticle): BlogListItem => ({
  slug: a.slug,
  title: a.title,
  description: a.description,
  category: a.category,
  categoryLabel: BLOG_CATEGORY_LABELS[a.category] ?? a.category,
  emoji: a.emoji,
  cover: a.cover,
  coverAlt: a.coverAlt,
  readTime: a.readTime,
  datePublished: a.datePublished,
  dateModified: a.dateModified,
  source: 'static',
})

const dbToListItem = (p: {
  slug: string
  title: string
  description: string
  category: string
  cover: string | null
  coverAlt: string | null
  content: string
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): BlogListItem => ({
  slug: p.slug,
  title: p.title,
  description: p.description,
  category: p.category,
  categoryLabel: BLOG_CATEGORY_LABELS[p.category] ?? p.category,
  emoji: '✍️',
  cover: p.cover ?? '/uploads/hero-mug.png',
  coverAlt: p.coverAlt ?? p.title,
  readTime: readTimeFromText(p.content),
  datePublished: toISODate(p.publishedAt ?? p.createdAt),
  dateModified: toISODate(p.updatedAt),
  source: 'db',
})

export async function getPublishedDbPosts() {
  return db.blogPost.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function getAllBlogListItems(): Promise<BlogListItem[]> {
  const dbPosts = await getPublishedDbPosts().catch(() => [])
  const items = [...BLOG_ARTICLES.map(staticToListItem), ...dbPosts.map(dbToListItem)]
  items.sort((a, b) => b.datePublished.localeCompare(a.datePublished))
  return items
}

export async function getDbPostBySlug(slug: string): Promise<DbBlogPost | null> {
  const p = await db.blogPost.findUnique({ where: { slug } }).catch(() => null)
  if (!p || !p.published) return null
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    seoTitle: p.seoTitle ?? p.title,
    description: p.description,
    keywords: p.keywords,
    category: p.category,
    cover: p.cover ?? '/uploads/hero-mug.png',
    coverAlt: p.coverAlt ?? p.title,
    content: p.content,
    readTime: readTimeFromText(p.content),
    datePublished: toISODate(p.publishedAt ?? p.createdAt),
    dateModified: toISODate(p.updatedAt),
  }
}

/** Slug de artigo: minúsculas, sem acento, só letras/números/hífen. */
export function slugifyBlogTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
