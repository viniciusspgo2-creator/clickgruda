import { SITE, SITE_URL } from '@/lib/site'

export function JsonLd({ id, data }: { id: string; data: unknown }) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

/** Apenas entidades compartilhadas. Cada página publica seu próprio conteúdo. */
export function GeoSchema({ socialUrls = [] }: { socialUrls?: string[] }) {
  return <JsonLd id="brand-schema" data={{ '@context': 'https://schema.org', '@graph': [
    {
      '@type': 'Organization', '@id': `${SITE_URL}/#organization`,
      name: SITE.name, url: SITE_URL, email: SITE.email,
      description: SITE.description, areaServed: { '@type': 'Country', name: 'Brasil' },
      ...(socialUrls.length ? { sameAs: socialUrls } : {}),
    },
    {
      '@type': 'WebSite', '@id': `${SITE_URL}/#website`,
      name: SITE.name, alternateName: ['Click&Gruda', 'Click e Gruda'],
      url: `${SITE_URL}/`, inLanguage: 'pt-BR', description: SITE.tagline,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ] }} />
}
