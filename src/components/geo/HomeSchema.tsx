import { JsonLd } from '@/components/geo/GeoSchema'
import { SITE, SITE_URL, CONTENT_UPDATED_ISO, SOCIAL_IMAGE, DEMO_VIDEO } from '@/lib/site'
import { FAQ_ITEMS, LANDING_FAQ_INDICES } from '@/lib/knowledge'
import { SALES } from '@/components/landing/sales-content'

export function HomeSchema({ priceCents }: { priceCents: number }) {
  const promo = priceCents === SALES.defaultPriceCents && Date.now() <= new Date(SALES.promoEndsAt).getTime()
  const productId = `${SITE_URL}/#plataforma`
  return <JsonLd id="home-schema" data={{ '@context': 'https://schema.org', '@graph': [
    {
      '@type': 'WebPage', '@id': `${SITE_URL}/#webpage`, url: `${SITE_URL}/`,
      name: 'Artes para canecas e mockup 3D — Click & Gruda',
      description: SITE.shortAnswer, inLanguage: 'pt-BR', dateModified: CONTENT_UPDATED_ISO,
      isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': `${SITE_URL}/#organization` },
      mainEntity: { '@id': productId }, primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE_URL}${SOCIAL_IMAGE}` },
    },
    {
      '@type': 'Service', '@id': `${SITE_URL}/#servico`,
      name: 'Biblioteca de artes, mockups 3D e ferramentas para sublimadores',
      serviceType: 'Plataforma digital de artes para sublimação de canecas',
      description: SITE.description, url: `${SITE_URL}/`,
      provider: { '@id': `${SITE_URL}/#organization` }, areaServed: { '@type': 'Country', name: 'Brasil' },
    },
    {
      '@type': 'Product', '@id': productId,
      name: promo ? 'Acesso Vitalício Click & Gruda' : 'Acesso à plataforma Click & Gruda',
      description: 'Biblioteca de artes para canecas com busca, categorias, datas sazonais, novidades semanais e mockup 3D. Downloads ilimitados para contas com acesso ativo; consulte as condições do plano no portal.',
      url: `${SITE_URL}/`, image: [`${SITE_URL}${SOCIAL_IMAGE}`], brand: { '@id': `${SITE_URL}/#organization` },
      ...(promo ? { offers: {
        '@type': 'Offer', url: `${SITE_URL}/#preco`, priceCurrency: 'BRL',
        price: (priceCents / 100).toFixed(2), priceValidUntil: '2026-12-31',
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
