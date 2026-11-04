import { JsonLd } from '@/components/geo/GeoSchema'
import { SITE_URL, CONTENT_UPDATED_ISO } from '@/lib/site'
import { FAQ_ITEMS, GLOSSARY_TERMS, HOWTO_STEPS, HOWTO_TOOLING } from '@/lib/knowledge'

export function GuideSchema() {
  const url = `${SITE_URL}/guia`
  return <JsonLd id="guide-schema" data={{ '@context': 'https://schema.org', '@graph': [
    {
      '@type': 'WebPage', '@id': `${url}#webpage`, url, name: 'Guia de sublimação de canecas',
      inLanguage: 'pt-BR', dateModified: CONTENT_UPDATED_ISO,
      isPartOf: { '@id': `${SITE_URL}/#website` }, about: { '@id': `${SITE_URL}/#organization` },
    },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Guia de sublimação', item: url },
    ] },
    { '@type': 'FAQPage', '@id': `${url}#perguntas`, mainEntity: FAQ_ITEMS.map(f => ({
      '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
    })) },
    {
      '@type': 'HowTo', '@id': `${url}#como-funciona`,
      name: 'Como sublimar uma caneca', description: 'Fluxo geral de escolha de arte, impressão e prensagem; confira as especificações do fabricante de cada insumo e equipamento.',
      inLanguage: 'pt-BR', tool: HOWTO_TOOLING.map(name => ({ '@type': 'HowToTool', name })),
      step: HOWTO_STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, url: `${url}#como-funciona` })),
    },
    {
      '@type': 'DefinedTermSet', '@id': `${url}#glossario`, name: 'Glossário de sublimação de canecas',
      hasDefinedTerm: GLOSSARY_TERMS.map(t => ({ '@type': 'DefinedTerm', name: t.term, description: t.definition, inDefinedTermSet: `${url}#glossario` })),
    },
  ] }} />
}
