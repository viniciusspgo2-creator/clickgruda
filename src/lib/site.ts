/**
 * Entidade da marca — fonte única de verdade (GEO/Entity SEO).
 * Usada por: metadata do layout, JSON-LD, /api/geo/knowledge-base e llms.txt.
 *
 * ⚠️ Personalizável pelo administrador: ao apontar o domínio definitivo,
 * defina NEXT_PUBLIC_SITE_URL no ambiente — todos os canonicals, schemas
 * e arquivos de IA passam a usá-lo automaticamente.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://clickgruda.com.br').replace(/\/$/, '')

export const SITE = {
  name: 'Click & Gruda',
  legalName: 'Click & Gruda',
  url: SITE_URL,
  tagline: 'Artes digitais para sublimação de canecas, com biblioteca e ferramentas organizadas',
  description:
    'A Click & Gruda reúne artes digitais para sublimação de canecas, com biblioteca organizada por categorias, tags e datas sazonais, mockups 3D e recursos para divulgar produtos personalizados. A oferta de acesso vitalício por R$ 47,90 vale até 20/12/2026. A quantidade de downloads de artes diferentes pode estar sujeita a uma cota diária.',
  shortAnswer:
    'A Click & Gruda oferece uma biblioteca organizada de artes digitais para sublimação, gerador de mockups e loja online para assinantes. O acesso vitalício por R$ 47,90 é condição promocional até 20/12/2026. Pode haver limite diário de downloads de artes diferentes.',
  email: 'contato@clickgruda.com.br',
  areaServed: 'BR',
  inLanguage: 'pt-BR',
  priceBRL: 47.9,
  priceCents: 4790,
  artFormat: '21 × 9,5 cm',
  // sameAs: perfis oficiais que fortalecem a entidade nos knowledge graphs.
  // Atualize/adicione os perfis reais da marca quando existirem.
  sameAs: [
    'https://instagram.com/clickgruda',
    'https://facebook.com/clickgruda',
    'https://tiktok.com/@clickgruda',
  ],
  // Perfis de autoridade editorial (E-E-A-T). Sem pessoas fictícias:
  // a autoria é institucional e verificável.
  author: {
    name: 'Equipe Editorial Click & Gruda',
    description:
      'Equipe de conteúdo da Click & Gruda especializada em sublimação de canecas, produção de artes digitais e comércio de personalizados.',
  },
  reviewer: {
    name: 'Equipe de Produção Click & Gruda',
    description:
      'Time técnico de produção da Click & Gruda, responsável pela revisão das especificações de prensagem, medidas e materiais das artes.',
  },
} as const

/** Datas editoriais — dateModified é sempre a data atual (America/Sao_Paulo). */
export function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

export function todayBR(): string {
  return new Date().toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export const CONTENT_PUBLISHED_ISO = '2025-03-01'

/** WhatsApp oficial — contato, suporte e envio de comprovante de PIX manual. */
export const WHATSAPP = {
  display: '+55 62 9838-7816',
  number: '556298387816',
  /** Link wa.me com mensagem pré-preenchida opcional. */
  link: (text?: string) =>
    `https://wa.me/556298387816${text ? `?text=${encodeURIComponent(text)}` : ''}`,
} as const

export const WHATSAPP_MESSAGES = {
  support: 'Olá! Vim pelo site da Click & Gruda e preciso de ajuda.',
  pixReceipt: 'Olá! Acabei de fazer o PIX do acesso vitalício (R$ 47,90) da Click & Gruda. Segue o comprovante em anexo.',
} as const
