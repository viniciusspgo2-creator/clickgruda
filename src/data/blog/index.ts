/* ============================================================
   Índice do blog — 16 artigos SEO + helpers
   ============================================================ */

import { ARTICLES_A } from './articles-a';
import { ARTICLES_B } from './articles-b';
import type { BlogArticle, BlogCategory } from './types';

export * from './types';

export const ALL_ARTICLES: BlogArticle[] = [...ARTICLES_A, ...ARTICLES_B].sort(
  (a, b) => b.date.localeCompare(a.date),
);

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Sublimação',
  'Mockups',
  'Marketing',
  'Redes Sociais',
  'Ferramentas',
];

export function getArticle(slug: string): BlogArticle | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug);
}

export function countCategory(cat: BlogCategory): number {
  return ALL_ARTICLES.filter((a) => a.category === cat).length;
}

/** artigos relacionados: mesma categoria primeiro, depois mais recentes */
export function relatedArticles(article: BlogArticle, take = 3): BlogArticle[] {
  const same = ALL_ARTICLES.filter((a) => a.slug !== article.slug && a.category === article.category);
  const others = ALL_ARTICLES.filter((a) => a.slug !== article.slug && a.category !== article.category);
  return [...same, ...others].slice(0, take);
}

/** tempo de leitura aproximado (200 palavras/min) */
export function readingMinutes(article: BlogArticle): number {
  let words = 0;
  for (const b of article.content) {
    if (b.type === 'p' || b.type === 'h2' || b.type === 'h3' || b.type === 'quote') {
      words += b.text.split(/\s+/).length;
    } else if (b.type === 'ul' || b.type === 'ol') {
      words += b.items.join(' ').split(/\s+/).length;
    }
  }
  for (const f of article.faq) words += (f.q + ' ' + f.a).split(/\s+/).length;
  return Math.max(3, Math.round(words / 200));
}

const MONTHS = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

/** "2026-10-05" → "5 out 2026" */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
