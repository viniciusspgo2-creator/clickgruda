import { JsonLd } from '@/components/geo/GeoSchema'
import { SITE, SITE_URL, CONTENT_UPDATED_ISO, SOCIAL_IMAGE, DEMO_VIDEO } from '@/lib/site'
import { FAQ_ITEMS, LANDING_FAQ_INDICES } from '@/lib/knowledge'
import { SALES } from '@/components/landing/sales-content'

export function HomeSchema({ priceCents }: { priceCents: number }) {
  const promo = priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  // A oferta é acesso a um serviço digital. Não declarar mercadoria física
  // nem acionar campos de Shopping (frete/devolução) que não descrevem o serviço.
  const serviceId = `${SITE_URL}/#plataforma`
  const image = { '@type': 'ImageObject', '@id': `${SITE_URL}/#imagem-plataforma`, url: `${SITE_URL}${SOCIAL_IMAGE}`, contentUrl: `${SITE_URL}${SOCIAL_IMAGE}`, width: 1122, height: 1402, caption: 'Click & Gruda — biblioteca digital de artes para canecas' }
  return <JsonLd id="home-schema" data={{ '@context': 'https://schema.org', '@graph': [
    {
      '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: `${SITE_URL}/`,
      name: 'Artes para canecas e mockup 3D — Click & Gruda',
      description: SITE.shortAnswer, inLanguage: 'pt-BR', dateModified: CONTENT_UPDATED_ISO,
      isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': `${SITE_URL}/#organization` },
      mainEntity: { '@id': serviceId }, primaryImageOfPage: image,
    },
    {
      '@type': 'Service', '@id': serviceId,
      name: promo ? 'Acesso Vitalício Click & Gruda' : 'Acesso à plataforma Click & Gruda',
      alternateName: 'Biblioteca de artes, mockups 3D e ferramentas para sublimadores',
      serviceType: 'Plataforma digital de artes para sublimação de canecas',
      description: SITE.description, url: `${SITE_URL}/`,
      provider: { '@id': `${SITE_URL}/#organization` }, areaServed: { '@type': 'Country', name: 'Brasil' },
      image,
      brand: { '@type': 'Brand', name: SITE.name },
      audience: { '@type': 'Audience', audienceType: 'Sublimadores e profissionais de personalizados' },
      availableChannel: { '@type': 'ServiceChannel', serviceUrl: `${SITE_URL}/`, availableLanguage: 'pt-BR' },
      ...(promo ? { offers: {
        '@type': 'Offer', '@id': `${SITE_URL}/#oferta-acesso`, url: `${SITE_URL}/#preco`, priceCurrency: 'BRL',
        price: (priceCents / 100).toFixed(2), priceValidUntil: SALES.promoEndsAt.slice(0, 10),
        itemOffered: { '@id': serviceId },
        availability: 'https://schema.org/InStock', seller: { '@id': `${SITE_URL}/#organization` },
      } } : {}),
    },
    {
      '@type': 'VideoObject', '@id': `${SITE_URL}/#demonstracao`,
      name: DEMO_VIDEO.name, description: DEMO_VIDEO.description,
      embedUrl: DEMO_VIDEO.embedUrl, thumbnailUrl: DEMO_VIDEO.thumbnailUrl,
      uploadDate: DEMO_VIDEO.uploadDate, duration: DEMO_VIDEO.duration,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'FAQPage', '@id': `${SITE_URL}/#faq`, inLanguage: 'pt-BR',
      mainEntity: LANDING_FAQ_INDICES.map(i => ({
        '@type': 'Question', name: FAQ_ITEMS[i].q,
        acceptedAnswer: { '@type': 'Answer', text: FAQ_ITEMS[i].a },
      })),
    },
  ] }} />
}
