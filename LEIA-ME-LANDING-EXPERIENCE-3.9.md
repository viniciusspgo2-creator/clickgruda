# Click&Gruda Experience 3.9 — landing com vídeo

## Origem e escopo

Continuação da Experience 3.8, preservando o código de área de membros, APIs, cadastro, checkout, administração, blog, guia, SEO e GEO. Os novos elementos visuais foram aplicados à landing pública (`LandingView.tsx` e CSS isolado sob `.cg-sales`).

## Alterações

1. **Abertura premium com vídeo Vimeo** (ID `1238613293`) em player responsivo 16:9, enquadrado em moldura com brilho discreto. Parâmetros de embed ocultam título, nome do autor e retrato quando o Vimeo permitir. O vídeo não tem autoplay; o som só toca se o visitante reproduzir.
2. **Header enxuto:** logotipo, entrada de assinante e CTA. Menu de navegação pública removido, sem afetar navegação das áreas internas.
3. **Copy e CTAs comerciais:** mensagem de venda direcionada a artes curadas e organizadas, com informação sobre atualizações semanais e contador derivado da API de catálogo (fallback identificado como aproximação).
4. **Carrossel em duas faixas** com artes locais reais, movimento contínuo, pausa ao passar o mouse, hover com brilho e categoria.
5. **Mascote ilustrado em seção de benefícios**, com suporte pelo WhatsApp, sugestões de temas, novidades e busca organizada.
6. **Oferta promocional corrigida para 31/12/2026** na configuração de vendas, oferta fixa de rodapé móvel, textos públicos de conhecimento, descrição institucional e dados estruturados do GEO.
7. **Fluxo de checkout preservado**: sem mudar banco, sessões ou lógica do plano. Preço é buscado da API de catálogo (fallback R$ 47,90), e a menção vitalícia é condicional ao preço e período promocional.

## Principais arquivos modificados

- `src/components/views/LandingView.tsx`
- `src/app/globals.css`
- `src/components/landing/sales-content.ts`
- `src/components/geo/GeoSchema.tsx`
- `src/lib/site.ts`
- `src/lib/knowledge.ts`
- `src/lib/geo-knowledge.ts`

## Conferências efetuadas

- Parser TypeScript v5 (global): todos os 172 arquivos `src` sem erro sintático.
- Parser de CSS: folha global sem erro de sintaxe.
- Arquivos locais de artes e mascote confirmados.
- Arquivo ZIP original íntegro.

**Validação pendente**: não foram executados `npm ci`, `npm run build`, testes end-to-end, autenticação, banco ou publicação real. Não há `node_modules` neste ambiente. Rode as verificações abaixo antes de colocar em produção:

```bash
npm ci
npm run check:source
npm run check:types
npm run build
```

O player do Vimeo pode exibir controles de reprodução definidos pelo próprio Vimeo ou pelas configurações da conta; parâmetros de iframe não garantem esconder toda a interface do provedor. Confira se a incorporação está autorizada na privacidade do vídeo.

## Deploy

Atualize o projeto no repositório conectado à Vercel. Mantenha as variáveis de ambiente já configuradas, confira os previews nas larguras mobile/desktop e confirme a comunicação do preço/data em checkout e textos externos antes de publicar.
