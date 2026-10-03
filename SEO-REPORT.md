# RELATÓRIO FINAL — Implementação SEO Enterprise
## Click & Gruda · SEO Técnico + Blog Estratégico + Revisão de Landing
**Data:** 02/10/2026 · **Restrições respeitadas:** identidade visual intacta · zero funcionalidades removidas · zero componentes quebrados · E2E sem regressões (login, portal, checkout, admin).

---

## 1. AUDITORIA SEO TÉCNICA — PROBLEMAS × CORREÇÕES

| # | Problema encontrado | Correção aplicada |
|---|---|---|
| 1 | Hero com `<img>` sem dimensões → risco de CLS e LCP não priorizado | `next/image` com `width/height 1344×768` + `priority` no LCP (hero-mug) e `sizes` responsivos nos dois heroes |
| 2 | Definição de entidade repetida **verbatim 2×** na landing (Resumo Executivo + blockquote da Central de Conhecimento) | Central de Conhecimento agora usa texto "Na prática" complementar (ENTITY_PRACTICAL) — definição canônica aparece 1× |
| 3 | Takeaways ≈ ficha de fatos com mesma redação (repetição estrutural) | Takeaways reescritas com framing de benefício; ficha de fatos (`<dl>`) mantém o papel de spec-sheet |
| 4 | Inconsistência factual: hero dizia "R$ 15 por imagem", dor dizia "R$ 10 a R$ 30" | Hero unificado: "R$ 10 a R$ 30 por imagem" (coerente com dor + tabela comparativa) |
| 5 | Vitrine repetia "formato 21×9,5 cm" (3ª menção antes do preço) | Rephrase: "na medida exata da caneca: o que você vê é o que sai da prensa" |
| 6 | Features do card de preço duplicavam hero verbatim ("Download ilimitado, pra sempre" / "Formato exato 21×9,5 cm") | Rephrase: "Baixe quantas vezes quiser, pra sempre" / "Na medida exata da caneca (sem ajuste no editor)" |
| 7 | Heading semântico: seção Resumo tinha H2 de rótulo pequeno ("Principais conclusões") | H2 semântico `sr-only` ("Resumo executivo: o que é a Click & Gruda…") + conclusões viraram H3 |
| 8 | Sitemap estático de 1 URL | `app/sitemap.ts` dinâmico: 9 URLs (/, /blog, 6 artigos, /sobre) + **image sitemap** (xmlns:image) + lastmod real por artigo |
| 9 | Sem redirects, sem headers de segurança/cache | 7 redirects 308 permanentes; headers `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, cache 1d+SWR em /uploads |
| 10 | Site sem páginas indexáveis além da home | **+8 URLs indexáveis**: /blog (hub) + 6 artigos SSG + /sobre — todas com metadata própria, canonical absoluto, OG/Twitter, JSON-LD |
| 11 | Sem GA4/GTM preparado | `src/lib/analytics.ts` + `AnalyticsScripts` (carregam só com env) + 9 eventos instrumentados |
| 12 | Blog/sobre ausentes → zero linkagem interna entre conteúdos | Teaser no blog na landing (3 cards), nav "Blog" no header, footer com Blog/Sobre, artigos ↔ landing (âncoras #preco/#artes) ↔ artigos relacionados ↔ /sobre |

**Hierarquia de headings verificada (curl): H1 = 1 em todas as páginas** (/, /blog, artigo, /sobre); H2 = seções; H3 = subseções; H4 = passos do HowTo.

## 2. BLOG — 6 ARTIGOS ESTRATÉGICOS (topic cluster)

| URL | Keyword-alvo | Intenção |
|---|---|---|
| `/blog/artes-para-sublimacao-de-canecas-guia` | artes para sublimação de canecas | Head term |
| `/blog/quanto-custa-sublimar-canecas` | quanto custa sublimar canecas | Comercial |
| `/blog/prensa-de-canecas-como-escolher` | prensa de canecas | Comercial |
| `/blog/onde-encontrar-artes-para-sublimacao` | onde encontrar artes para sublimação | BOFU (money) |
| `/blog/como-sublimar-canecas-passo-a-passo` | como sublimar canecas | Tutorial |
| `/blog/datas-comemorativas-para-vender-canecas` | datas comemorativas vender canecas | Sazonal/trafego |

Cada artigo (SSG `generateStaticParams`): H1 único + BLUF "Resposta rápida" + H2/H3 semânticos + tabelas `<caption>` + FAQ em `<details>` (espelhada em FAQPage JSON-LD) + BlogPosting JSON-LD (headline, datas, wordCount, author/reviewer) + BreadcrumbList + breadcrumb visível + E-E-A-T (autoria, revisão técnica, `<time>` de publicação/atualização) + CTA para o produto + 3 artigos relacionados (linkagem do cluster).

## 3. METADATA & SCHEMA
- **Por página**: title único, description, keywords, canonical absoluto, OG (locale pt_BR, article com publishedTime/modifiedTime/section/tags), Twitter Card, robots herdados.
- **Schema raiz** (já existente + ampliado): Organization, WebSite, WebPage (speakable), BreadcrumbList, Product+Offer, FAQPage (12), HowTo (6), DefinedTermSet (12), 2× ItemList + **novo Service** (serviceType, OfferCatalog das 6 categorias, ServiceChannel) e significantLink → /blog e /sobre.
- **GSC ready**: `verification.google` via `NEXT_PUBLIC_GSC_VERIFICATION`; sitemap pronto para submission; rich results elegíveis (FAQ, HowTo, Article, Product, Breadcrumb).

## 4. PERFORMANCE (Core Web Vitals)
- **LCP**: hero-mug com `priority` (preload) via next/image → formato otimizado (WebP/AVIF automático) + `fetchpriority`.
- **CLS**: heroes com width/height fixos; cards de arte em containers `aspect-[21/9.5]`; fontes via next/font (sem swap de layout).
- **Cache**: `/uploads/*` → `public, max-age=86400, stale-while-revalidate=604800`; llms.txt → 1h+SWR.
- **JS**: artigos e /sobre são **Server Components sem JS client** (só o tracker de evento); scripts GA4/GTM `afterInteractive` e condicionais a env.

## 5. GA4 + GTM (estrutura pronta)
Defina `NEXT_PUBLIC_GA4_ID` e/ou `NEXT_PUBLIC_GTM_ID` → scripts injetados automaticamente. Eventos instrumentados: `cta_click`, `auth_submit`, `pix_generated` (conversão), `art_download` (conversão), `favorite_toggle`, `blog_view`, `article_view`, `scroll_depth` (25/50/75/100), `spa_view_change`.

## 6. SEO LOCAL / E-E-A-T / AUTORIDADE
- **Local SEO**: operação 100% digital → `geo.region=BR`, areaServed Brasil, contactPoint (e-mail) no schema. LocalBusiness/GBP: **intencionalmente não fabricado** — sem NAP real, schema local violaria E-E-A-T; checklist GBP no plano de ação.
- **E-E-A-T**: página `/sobre` institucional (processo de produção, política editorial, revisão técnica, correções com data), autoria/revisão visíveis em todos os artigos, Person Schema **preparado** para ativar com autores reais (não fabricamos nomes), Review/aggregateRating **omitidos** (sem avaliações reais — evitar penalidade).
- **Off-page**: ativos linkáveis prontos (guia definitivo, calendário sazonal, glossário, comparativos honestos). Estratégia de backlinks recomendada: parcerias com lojas de insumos de sublimação, citações em grupos/associações de personalizados, digital PR com os dados do blog. Nada de backlinks artificiais.

## 7. VERIFICAÇÃO EXECUTADA
- Lint 0/0 · dev.log sem erros · console do browser limpo.
- Rotas: / 200 (195KB SSR) · /blog 200 · artigo 200 (242KB SSR) · /sobre 200 · /sitemap.xml 200 (image sitemap) · redirects 308 ✓.
- Canonicals absolutos por página ✓ · og:type article + article:published_time/modified_time/section ✓ · JSON-LD BlogPosting+FAQPage+Breadcrumb por artigo ✓ · H1=1 em todas as páginas ✓.
- Browser E2E: blog hub (breadcrumb, 6 links, CTA header) ✓ · artigo (3 H2, 11 passos, 3 FAQ, E-E-A-T, relacionados, CTA) ✓ · /sobre (BLUF, política editorial, 6 dados institucionais, AboutPage schema) ✓ · **regressão zero**: login demo → portal ✓, dedup confirmado no DOM ✓ · mobile 390px ✓.

## 8. PRÓXIMOS PASSOS
1. **Domínio real**: `NEXT_PUBLIC_SITE_URL` (canonicals, sitemap, schema, llms.txt) + `NEXT_PUBLIC_GSC_VERIFICATION` + `NEXT_PUBLIC_GA4_ID`/`NEXT_PUBLIC_GTM_ID`.
2. Submeter /sitemap.xml no Google Search Console e Bing Webmaster; monitorar index coverage dos 9 URLs.
3. Publicar 1–2 artigos/mês mantendo o cluster (ex.: "papel sublimático como escolher", "canecas de polímero vs porcelana") — o renderer aceita novos artigos em `src/content/blog.ts` sem código extra.
4. Backlinks: prospectar parcerias reais com lojas de insumo e comunidades de sublimação usando os guias como isca de citação.
5. GBP: se houver endereço comercial real no futuro, adicionar LocalBusiness schema + página de contato com NAP.
6. HTTPS/HSTS e X-Frame-Options: aplicar na camada do gateway em produção (documentado; no sandbox HTTP os headers seriam ignorados e o XFO poderia quebrar o preview).
