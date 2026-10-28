/**
 * Entidade da marca — fonte única de verdade (GEO/Entity SEO).
 * Usada por: metadata do layout, JSON-LD, /api/geo/knowledge-base e llms.txt.
 *
 * ⚠️ Personalizável pelo administrador: ao apontar o domínio definitivo,
 * defina NEXT_PUBLIC_SITE_URL no ambiente — todos os canonicals, schemas
 * e arquivos de IA passam a usá-lo automaticamente.
 */
// Domínio canônico de produção. Uma variável antiga da Vercel não pode
// voltar a publicar canonicals/sitemaps para clickgruda.vercel.app.
// A hospedagem já redireciona o domínio sem www para esta versão.
export const SITE_URL = 'https://www.clickgruda.com.br'
export const CONTENT_UPDATED_ISO = '2026-10-27'
export const SOCIAL_IMAGE = '/uploads/rebrand/mascote-principal.webp'

export const SITE = {
  name: 'Click & Gruda',
  legalName: 'Click & Gruda',
  url: SITE_URL,
  tagline: 'Artes digitais para sublimação de canecas, com biblioteca e ferramentas organizadas',
  description:
    'A Click & Gruda é uma plataforma de artes para sublimação de canecas, com biblioteca organizada por categorias e datas sazonais, novidades semanais, mockups 3D e ferramentas para personalizados. Consulte o preço e as condições atuais na página inicial. Os downloads são ilimitados para contas com acesso ativo.',
  shortAnswer:
    'A Click & Gruda reúne artes digitais para sublimação de canecas, mockup 3D e ferramentas para personalizados. A biblioteca tem busca, categorias e datas sazonais, com novidades semanais. Os downloads são ilimitados para contas com acesso ativo; consulte o plano vigente na plataforma.',
  email: 'contato@clickgruda.com.br',
  areaServed: 'BR',
  inLanguage: 'pt-BR',
  priceBRL: 47.9,
  priceCents: 4790,
  artFormat: '21 × 9,5 cm',
  // sameAs: perfis oficiais que fortalecem a entidade nos knowledge graphs.
  // Atualize/adicione os perfis reais da marca quando existirem.
  sameAs: [] as string[], // Somente perfis confirmados no painel SEO.
  // Perfis de autoridade editorial (E-E-A-T). Sem pessoas fictícias:
  // a autoria é institucional e verificável.
  author: {
    name: 'Equipe Editorial Click & Gruda',
    description:
      'Conteúdo institucional da Click & Gruda sobre artes digitais e produção de canecas personalizadas.',
  },
  reviewer: {
    name: 'Equipe de Produção Click & Gruda',
    description:
      'Time técnico de produção da Click & Gruda, responsável pela revisão das especificações de prensagem, medidas e materiais das artes.',
  },
} as const

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

/** Metadados confirmados pela API pública do Vimeo em 26/10/2026. */
export const DEMO_VIDEO = {
  name: 'Conheça a Click & Gruda — demonstração da plataforma',
  description: 'Demonstração da biblioteca de artes para canecas e dos recursos da plataforma Click & Gruda.',
  embedUrl: 'https://player.vimeo.com/video/1238613293',
  thumbnailUrl: 'https://i.vimeocdn.com/video/2215822267-7553529da09b7f042bfaf6f6943886d96ab4fa3b67f1a63c51f905025590564a-d_640',
  uploadDate: '2026-10-22',
  duration: 'PT1M10S',
  durationSeconds: 70,
} as const
