# Click&Gruda — Redesign da página de vendas (v3)

## O que foi implementado

A home foi redesenhada dentro do projeto Next.js existente, sem substituir o portal do assinante, cadastro, checkout próprio, área administrativa, APIs, Prisma, páginas de blog/guia/sobre ou suas integrações.

A **Biblioteca de Artes** é o centro da narrativa e da demonstração; mockup 3D e loja online aparecem discretamente como benefícios inclusos. A vitrine interativa usa 20 artes reais existentes em `public/uploads/showcase`, não imagens de banco ou depoimentos fictícios.

### Animações e interações

1. Hero com entrada animada por linha de texto.
2. Duas colunas verticais de artes reais em loop, com pausa ao passar o mouse.
3. Cards de amostras com perspectiva/hover.
4. Spotlight radial acompanhando o ponteiro em hero/oferta.
5. CTA com deslocamento magnético sutil e brilho de hover.
6. Contador animado quando entra na área visível.
7. Storytelling de três etapas com resumo sticky e mudança de etapa durante o scroll.
8. Filtros por nichos e campo de pesquisa na vitrine demonstrativa.
9. Reveals progressivos de seções com Framer Motion.
10. Comparativo alternável "pastas soltas" x "Click&Gruda".
11. Header sticky com blur e barra de progresso de rolagem.
12. Destaque de preço com borda de gradiente animado.
13. FAQ expansível com Radix Accordion.
14. CTA fixo de conversão no celular depois de rolar a página.

`prefers-reduced-motion` reduz ou desativa animações; movimentos pesados não dependem de JS em cada frame. Há breakpoints para 320 px, celular, tablet e desktop.

## Dados reais e regras comerciais

- **Quantidade**: usa `catalog.counts.arts` de `/api/catalog` como fonte oficial. Se a API não responder ou retornar 0, apresenta **~3.500 artes**, claramente como aproximação, conforme quantidade informada pelo proprietário em 21/10/2026. Atualize `SALES.estimatedArtCount` caso mude a estimativa de contingência.
- **200 mil arquivos**: apenas em comparação explícita com os packs genéricos anunciados na internet. Não é a quantidade vendida pela Click&Gruda.
- **Preço**: usa `catalog.priceCents` de `/api/catalog`; `4790` centavos apenas como contingência quando API não responde.
- **Promoção**: o texto de pagamento único e acesso vitalício aparece somente para o preço de R$ 47,90 e até **20/12/2026 23:59:59 (UTC-03)**. Fora dessa situação, informa que as condições devem ser verificadas no checkout. Não há contador de escassez falsa.
- **Checkout**: por padrão, os CTAs continuam no fluxo próprio do sistema: usuário com acesso → portal; usuário logado sem acesso → checkout; novo usuário → cadastro com intenção de checkout. Se algum dia houver checkout externo, configure `SALES.CHECKOUT_URL`.
- **Amostras**: a demonstração de filtro é local com apenas 20 imagens do ZIP, e está rotulada como amostra. Não simula os resultados de todo o banco.
- **Depoimentos**: não foram fabricados.

## Arquivos alterados

- `src/components/views/LandingView.tsx` — nova landing completa.
- `src/components/landing/sales-content.ts` — configuração central de copy, preço de contingência, data da campanha e amostras.
- `src/app/globals.css` — CSS isolado com prefixo `cg-`, sem mudanças visuais nas demais telas.
- `src/components/geo/GeoSchema.tsx` — atualiza seletores semânticos para as novas seções.
- `src/components/AppShell.tsx` — preserva links profundos para seções da home (`/#preco`, `/#faq`, `/#artes`).
- `src/app/layout.tsx` — metadados com ênfase na biblioteca.

Compatibilidade preservada para URLs antigas `/#preco`, `/#faq`, `/#recursos`, `/#artes`. Novos IDs: `#biblioteca`, `#como-funciona`, `#investimento`, `#perguntas`.

## Rodar localmente

Requer Node.js, banco PostgreSQL/Neon e demais variáveis de ambiente já utilizadas pelo projeto.

```bash
npm ci
cp .env.example .env.local
# configure DATABASE_URL, AUTH_SECRET e demais chaves de acordo com o ambiente original
npx prisma generate
npm run dev
```

Para validar antes do deploy:

```bash
npm run check:types
npm run build
```

**Deploy na Vercel:** envie o conteúdo da pasta do projeto ao repositório Git conectado à Vercel, mantenha todas as variáveis de ambiente e configure o build como no deployment atual. Não apague o banco; o redesign não tem migrações.

## Verificações realizadas neste ambiente

- Sintaxe TypeScript/TSX dos arquivos novos: analisada sem erros sintáticos pelo compilador TypeScript.
- CSS: parseado sem erros com `tinycss2`.
- 20 arquivos da vitrine: caminhos locais confirmados.
- Prévia estática de layout em Chromium: nenhum overflow horizontal detectado em 390px ou 1440px.
- **Build Next.js completo não executado**: a instalação via `npm ci` falhou com erro de rede/DNS (`EAI_AGAIN` ao acessar registry.npmjs.org). A prévia estática não substitui teste real do app com dependências, autenticação e banco.

## Três opções de headline para testes A/B

1. **(Aplicada)** Menos tempo procurando. Mais tempo criando.
2. **Outra abordagem** Artes prontas. Ideias sem fim. Pastas nunca mais.
3. **Outra abordagem** Sua próxima caneca começa com a arte certa.

Editar em `src/components/landing/sales-content.ts` → `heroTitle` (quatro linhas). A estrutura do componente assume quatro linhas, mas pode ser adaptada.

## Antes de publicar / confirmar

1. Confirme que o preço, as regras da campanha de 20/12/2026 e o acesso vitalício permanecem válidos. A página lê preço real pela API, porém a data está em configuração.
2. Confirme limites de download, suporte, prazos de liberação por PIX e direitos de uso comercial informados em `src/lib/knowledge.ts` (FAQ oficial).
3. Confirme no portal em produção se as 20 amostras ainda estão disponíveis e se a nomenclatura dos filtros demonstrativos corresponde à organização atual.
4. Execute o build, teste cadastro → checkout → pagamento e reteste as áreas de assinante/admin na Vercel antes de publicar para compradores.
5. Configure eventos de analytics, A/B de headline e pixel de conversão, se desejado, somente com consentimentos/medidas exigidos pela sua política de privacidade.
