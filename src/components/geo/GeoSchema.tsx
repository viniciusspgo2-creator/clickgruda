'use client'
import { usePathname } from 'next/navigation'
import { SITE, SITE_URL } from '@/lib/site'

export function JsonLd({ id, data }: { id: string; data: unknown }) {
  return <script id={id} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

/** Apenas entidades compartilhadas. Cada página publica seu próprio conteúdo. */
export function GeoSchema({ socialUrls = [] }: { socialUrls?: string[] }) {
  const pathname = usePathname()
  /**
   * Superfície de conformidade Digistore24: o schema global da marca usa
   * SITE.description ("downloads ilimitados"), que a análise GmbH pode ler
   * como promessa sem limite. Nessas rotas o schema da marca não é
   * renderizado — cada uma delas já publica o seu próprio conteúdo
   * (a /digistore24 e a /digistore24/obrigado são noindex; o /aviso-legal
   * tem o seu próprio JSON-LD de WebPage/BreadcrumbList).
   */
  if (pathname === '/aviso-legal' || pathname.startsWith('/digistore24')) return null
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
