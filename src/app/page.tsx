import { AppShell } from '@/components/AppShell'

/**
 * Rota raiz — Server Component.
 *
 * GEO/LLMO: por ser um Server Component, o conteúdo da landing (renderizado
 * dentro do AppShell) vai para o HTML inicial — legível por GPTBot,
 * ClaudeBot, PerplexityBot, Google-Extended e CCBot, que não executam JS.
 * O grafo JSON-LD completo (Organization, Product, FAQPage, HowTo,
 * DefinedTermSet, WebSite, BreadcrumbList) é injetado no layout raiz.
 */
export default function Home() {
  return <AppShell />
}
