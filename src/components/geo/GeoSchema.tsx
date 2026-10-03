/**
 * GeoSchema — grafo JSON-LD (@graph) injetado no HTML inicial (server-side).
 *
 * Consolidado em um único script application/ld+json para parsing determinístico
 * por motores generativos (SearchGPT, Perplexity, Copilot, Gemini) e Google Rich
 * Results. Conteúdo espelha EXATAMENTE o que está visível na página
 * (FAQ_ITEMS, GLOSSARY_TERMS, HOWTO_STEPS, COMPARISON) — pré-requisito de
 * integridade para E-E-A-T e para evitar alucinação do modelo.
 */
import { SITE, CONTENT_PUBLISHED_ISO, todayISO } from '@/lib/site'
import {
  FAQ_ITEMS,
  GLOSSARY_TERMS,
  HOWTO_STEPS,
  HOWTO_TOOLING,
  CATEGORIES,
} from '@/lib/knowledge'

export function GeoSchema() {
  const dateModified = todayISO()

  const graph: Record<string, unknown>[] = [
    /* ---------- ENTIDADE RAIZ: ORGANIZATION ---------- */
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      legalName: SITE.legalName,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/uploads/hero-mug.png`,
        width: 1344,
        height: 768,
      },
      email: SITE.email,
      description: SITE.description,
      slogan: SITE.tagline,
      areaServed: { '@type': 'Country', name: 'Brasil' },
      inLanguage: 'pt-BR',
      sameAs: [...SITE.sameAs],
    },

    /* ---------- WEBSITE ---------- */
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      inLanguage: 'pt-BR',
      description: SITE.tagline,
      publisher: { '@id': `${SITE.url}/#organization` },
      copyrightHolder: { '@id': `${SITE.url}/#organization` },
    },

    /* ---------- PÁGINA INICIAL (WebPage + speakable BLUF) ---------- */
    {
      '@type': 'WebPage',
      '@id': `${SITE.url}/#webpage`,
      url: SITE.url,
      name: `${SITE.name} — Artes Prontas para Sublimação de Canecas | Acesso Vitalício`,
      isPartOf: { '@id': `${SITE.url}/#website` },
      about: { '@id': `${SITE.url}/#organization` },
      inLanguage: 'pt-BR',
      datePublished: CONTENT_PUBLISHED_ISO,
      dateModified,
      author: {
        '@type': 'Organization',
        name: SITE.author.name,
        description: SITE.author.description,
      },
      reviewedBy: {
        '@type': 'Organization',
        name: SITE.reviewer.name,
        description: SITE.reviewer.description,
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['#conhecimento', '#faq'],
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${SITE.url}/uploads/hero-mug.png`,
      },
      significantLink: [
        `${SITE.url}/blog`,
        `${SITE.url}/sobre`,
        `${SITE.url}/llms.txt`,
        `${SITE.url}/llms-full.txt`,
        `${SITE.url}/api/geo/knowledge-base`,
      ],
    },

    /* ---------- SERVICE (oferta como serviço + catálogo de categorias) ---------- */
    {
      '@type': 'Service',
      '@id': `${SITE.url}/#servico-plataforma`,
      name: 'Plataforma de artes digitais para sublimação de canecas — acesso vitalício',
      serviceType: 'Plataforma de assinatura vitalícia de artes digitais para sublimação',
      description:
        'Serviço digital que concede acesso vitalício ao acervo de artes para sublimação de canecas da Click & Gruda, com downloads ilimitados, lançamentos frequentes e artes para produzir e vender canecas, por pagamento único de R$ 47,90.',
      provider: { '@id': `${SITE.url}/#organization` },
      areaServed: { '@type': 'Country', name: 'Brasil' },
      audience: { '@type': 'BusinessAudience', audienceType: 'Sublimadores e produtores de canecas personalizadas' },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: SITE.url,
        availableLanguage: 'pt-BR',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Categorias do acervo de artes',
        itemListElement: CATEGORIES.map((c) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: `Artes — categoria ${c.name}`, description: c.description },
        })),
      },
    },

    /* ---------- BREADCRUMB ---------- */
    {
      '@type': 'BreadcrumbList',
      '@id': `${SITE.url}/#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Início',
          item: SITE.url,
        },
      ],
    },

    /* ---------- PRODUTO + OFERTA ---------- */
    {
      '@type': 'Product',
      '@id': `${SITE.url}/#produto-acesso-vitalicio`,
      name: 'Acesso Vitalício Click & Gruda',
      description:
        'Acesso vitalício ao acervo completo de artes digitais para sublimação de canecas da Click & Gruda: downloads ilimitados, lançamentos frequentes inclusos, artes no formato exato de 21 × 9,5 cm, prontas para produzir e vender canecas.',
      brand: { '@id': `${SITE.url}/#organization` },
      category: 'Artes digitais para sublimação de canecas',
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Sublimadores e produtores de canecas personalizadas',
      },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'Formato da arte', value: '21 × 9,5 cm' },
        { '@type': 'PropertyValue', name: 'Modelo de cobrança', value: 'Pagamento único, sem mensalidade' },
        { '@type': 'PropertyValue', name: 'Downloads', value: 'Ilimitados e vitalícios' },
        { '@type': 'PropertyValue', name: 'Lançamentos futuros', value: 'Inclusos sem custo adicional' },
        { '@type': 'PropertyValue', name: 'Uso comercial', value: 'Liberado para sublimadores' },
        { '@type': 'PropertyValue', name: 'Forma de pagamento', value: 'PIX, Mercado Pago e Asaas (ativação manual via chave PIX disponível)' },
      ],
      offers: {
        '@type': 'Offer',
        url: SITE.url,
        priceCurrency: 'BRL',
        price: SITE.priceBRL.toFixed(2),
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': `${SITE.url}/#organization` },
        priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
        areaServed: 'BR',
      },
      isRelatedTo: CATEGORIES.map((c) => ({
        '@type': 'Product',
        name: `Artes para sublimação de canecas — categoria ${c.name}`,
        description: c.description,
        brand: { '@id': `${SITE.url}/#organization` },
      })),
    },

    /* ---------- FAQPAGE (espelho integral do FAQ visível) ---------- */
    {
      '@type': 'FAQPage',
      '@id': `${SITE.url}/#faq`,
      inLanguage: 'pt-BR',
      dateModified,
      mainEntity: FAQ_ITEMS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },

    /* ---------- HOWTO (guia de sublimação) ---------- */
    {
      '@type': 'HowTo',
      '@id': `${SITE.url}/#como-sublimar`,
      name: 'Como sublimar uma caneca com artes da Click & Gruda',
      description:
        'Guia passo a passo para imprimir e prensar uma caneca de porcelana de 325 ml usando artes digitais no formato 21 × 9,5 cm da Click & Gruda.',
      inLanguage: 'pt-BR',
      datePublished: CONTENT_PUBLISHED_ISO,
      dateModified,
      author: { '@type': 'Organization', name: SITE.author.name },
      reviewedBy: { '@type': 'Organization', name: SITE.reviewer.name },
      totalTime: 'PT20M',
      tool: HOWTO_TOOLING.map((t) => ({ '@type': 'HowToTool', name: t })),
      supply: [
        { '@type': 'HowToSupply', name: 'Arte digital no formato 21 × 9,5 cm (acervo Click & Gruda)' },
        { '@type': 'HowToSupply', name: 'Caneca de porcelana com revestimento para sublimação' },
      ],
      step: HOWTO_STEPS.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.name,
        text: s.text,
        url: `${SITE.url}/#passo-${i + 1}`,
      })),
    },

    /* ---------- DEFINEDTERMSET + DEFINEDTERMS (glossário) ---------- */
    {
      '@type': 'DefinedTermSet',
      '@id': `${SITE.url}/#glossario-sublimacao`,
      name: 'Glossário de Sublimação de Canecas — Click & Gruda',
      description:
        'Definições técnicas dos termos essenciais da sublimação de canecas: sublimação têxtil, prensa térmica, papel sublimático, cobre-caneca, DPI e outros.',
      inLanguage: 'pt-BR',
      dateModified,
      author: { '@type': 'Organization', name: SITE.author.name },
      hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
        '@type': 'DefinedTerm',
        name: t.term,
        description: t.definition,
        inDefinedTermSet: { '@id': `${SITE.url}/#glossario-sublimacao` },
      })),
    },

    /* ---------- ITEMLIST DE CATEGORIAS (topic clusters) ---------- */
    {
      '@type': 'ItemList',
      '@id': `${SITE.url}/#categorias`,
      name: 'Categorias do acervo de artes para sublimação',
      numberOfItems: CATEGORIES.length,
      itemListElement: CATEGORIES.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Thing',
          name: `Categoria ${c.name}`,
          description: c.description,
        },
      })),
    },
  ]

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph }
  const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      id="geo-schema-graph"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
