/* ============================================================
   Tipos do blog do Click & Gruda — artigos SEO em pt-BR
   ============================================================ */

export type BlogCategory =
  | 'Sublimação'
  | 'Mockups'
  | 'Marketing'
  | 'Redes Sociais'
  | 'Ferramentas';

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'cta'; title: string; text: string; href: string; label: string };

export interface BlogFaqItem {
  q: string;
  a: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  tags: string[];
  /** ISO date: "2026-10-05" */
  date: string;
  keywords: string[];
  content: BlogBlock[];
  faq: BlogFaqItem[];
}

/** Links reais usados nos CTAs dos artigos */
export const CTA_LINKS = {
  inicio: '/',
  mockup: '/?tool=mockup',
  qr: '/?tool=qr',
  whatsapp: '/?tool=whatsapp',
  orcamento: '/?tool=orcamento',
  contrato: '/?tool=contrato',
  pdf: '/?tool=pdf',
  imagens: '/?tool=imagens',
  ferramentas: '/?tool=extras',
  blog: '/blog',
  biblioteca: 'https://clickgruda.vercel.app/',
  tv: 'https://clickgruda.com.br/',
  suporte: 'https://wa.me/62998387816',
} as const;
