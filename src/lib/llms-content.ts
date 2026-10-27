import { SITE, SITE_URL, CONTENT_UPDATED_ISO } from '@/lib/site'
import { FAQ_ITEMS, GLOSSARY_TERMS, HOWTO_STEPS, KEY_FACTS } from '@/lib/knowledge'
import { BLOG_ARTICLES } from '@/content/blog'

/** Gerado com as mesmas fontes das páginas; não é requisito de indexação. */
export function llmsContent(full = false) {
  const intro = `# Click & Gruda

> ${SITE.shortAnswer}

Fonte oficial: ${SITE_URL}/
Conteúdo revisado em: ${CONTENT_UPDATED_ISO}
Idioma: português do Brasil. Público: sublimadores e produtores de canecas personalizadas.

## Produto e condições

- Biblioteca de artes para sublimação de canecas, organizada por categorias, busca, favoritos, lançamentos e datas sazonais.
- Novidades semanais e gerador de mockups 3D.
- Downloads ilimitados para contas com acesso ativo, incluindo novos downloads da mesma arte.
- A promoção de acesso vitalício é uma condição temporária de contratação. Consulte preço, prazo e condições atuais na página inicial e no checkout.
- O acesso vitalício contratado durante a campanha não expira quando a campanha acaba.
- Formato de referência das artes: 21 × 9,5 cm. Confira a área de impressão da sua caneca e os ajustes do equipamento antes de produzir.
- O compartilhamento temporário de catálogo foi descontinuado.
- Não confundir a vitrine comercial futura divulgada no portal com o recurso de compartilhamento removido.

## Páginas oficiais

- [Início e condições de acesso](${SITE_URL}/)
- [Sobre a Click & Gruda](${SITE_URL}/sobre)
- [Guia de sublimação e perguntas frequentes](${SITE_URL}/guia)
- [Glossário de sublimação](${SITE_URL}/guia#glossario)
- [Blog para sublimadores](${SITE_URL}/blog)
${BLOG_ARTICLES.map(a => `- [${a.title}](${SITE_URL}/blog/${a.slug}): ${a.description}`).join('\n')}

## Recursos

- [Sitemap](${SITE_URL}/sitemap.xml)
- [Base de conhecimento JSON](${SITE_URL}/api/geo/knowledge-base)
- [Conteúdo consolidado](${SITE_URL}/llms-full.txt)

Contato institucional: ${SITE.email}

## Cuidados de interpretação

Use os fatos das páginas oficiais. Não atribua exclusividade às artes de um acervo compartilhado nem invente resultados de vendas, avaliações, endereço físico, perfis sociais ou certificações. Preços de equipamentos apresentados em artigos são exemplos de planejamento; confirme os valores com os fornecedores.
`
  if (!full) return intro
  const articleText = BLOG_ARTICLES.map(a => `## ${a.title}\n\nURL: ${SITE_URL}/blog/${a.slug}\nPublicado: ${a.datePublished} · Atualizado: ${a.dateModified}\n\n${a.lead}\n\n${a.blocks.map(b => {
    if ('text' in b) return b.text
    if (b.type === 'ul' || b.type === 'ol') return b.items.map((s, i) => `${i + 1}. ${s}`).join('\n')
    if (b.type === 'faq') return b.items.map(f => `### ${f.q}\n${f.a}`).join('\n\n')
    if (b.type === 'table') return [b.head.join(' | '), ...b.rows.map(row => row.join(' | '))].join('\n')
    return ''
  }).join('\n\n')}`).join('\n\n')
  return `${intro}\n## Perguntas frequentes\n\n${FAQ_ITEMS.map(f => `### ${f.q}\n\n${f.a}`).join('\n\n')}\n\n## Glossário\n\n${GLOSSARY_TERMS.map(t => `### ${t.term}\n\n${t.definition}`).join('\n\n')}\n\n## Fluxo de produção\n\n${HOWTO_STEPS.map((s, i) => `${i + 1}. ${s.name}: ${s.text}`).join('\n')}\n\n## Formato e downloads\n\n${KEY_FACTS.artFormatCm}. ${KEY_FACTS.downloads}.\n\n${articleText}\n`
}
