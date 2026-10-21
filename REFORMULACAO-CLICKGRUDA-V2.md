# Click&Gruda · Reformulação V2 (21/10/2026)

## 1. Escopo da entrega

Esta V2 continua sobre o projeto `clickgruda-premium-revisado.zip`, sem substituir estrutura de banco, pagamentos, autenticação ou módulos existentes. A página de vendas **foi reescrita**, em vez de apenas ajustada, e o portal recebeu melhorias de desempenho, busca, compartilhamento e proteção da API.

### Landing page totalmente refeita

- Nova hero escura e editorial, com mensagem objetiva, contraste, hierarquia tipográfica e CTA primário único.
- **Colagem de artes removida da hero**. A área visual foi substituída por uma representação conceitual do fluxo da plataforma (biblioteca, mockup 3D, loja online), identificada como ilustração — não uma captura falsa do produto real.
- CTA secundário “Como funciona”; banner promocional discreto no topo durante a campanha até 20/12/2026; preço puxado de `/api/catalog` (com fallback existente R$ 47,90).
- Benefícios em cards amplos: acervo com curadoria, mockups 3D, loja online grátis para assinantes, artes sazonais.
- Comparativo entre fluxo de arquivos soltos e fluxo organizado; sem inventar depoimentos, números de clientes, descontos fictícios ou temporizadores artificiais.
- Fluxo “Encontre → Apresente → Venda”, com CTAs distribuídos por intenção.
- Carrossel de artes mantido somente na seção do acervo, abaixo da apresentação dos benefícios.
- Seção separada de catálogo online com link oficial **https://www.clickgruda.com.br**.
- Novo bloco de preço, formas de pagamento conforme provedor configurado e tratamento da validade da promoção.
- FAQ mais curto, relevante para decisão; conteúdo aprofundado agora em **/guia**.
- Barra de conversão fixa no celular após rolagem; botão de WhatsApp; suporte a redução de movimentos; medição dos CTAs via analytics já existente.
- Atualização de metadados para não prometer “downloads ilimitados” quando existe cota configurável.

### Conteúdo técnico preservado, mas separado da venda

- Página nova `/guia` com etapas de trabalho, comparativo completo, perguntas frequentes e glossário técnico já definidos na base de conhecimento. 
- Removido redirect legado de `/guia` no `next.config.ts` para que a rota seja acessível.
- Incluída a rota no sitemap e links internos no cabeçalho/rodapé de conteúdos; correção de legibilidade do logo no cabeçalho branco.
- Ajustes em parte das descrições do JSON-LD para refletir melhor as regras de acesso/limites e relacionar o glossário ao guia.

### Biblioteca, portal e compartilhamento

- Atalho **Ctrl+K / ⌘K** na busca; Escape retira foco. A busca continua com debounce e os filtros continuam a ser processados no servidor.
- Rodapé fixo de ação no menu de filtros: “Ver N artes”, sem rolar centenas de tags até o fim.
- Contagem regressiva da aba sazonal isolada em componente próprio: não atualiza mais centenas de cards da biblioteca a cada segundo.
- Redução do uso de animações de layout em toda a grade de artes, sem remover as transições pontuais dos cards.
- Identificação do plano na conta e rodapé passam a usar “acesso ativo” em vez de presumir vitaliciedade de todo assinante.
- A aba de compartilhar ganha Web Share API no celular com fallback de cópia; os recursos anteriores de WhatsApp, cópia, validade e exclusão continuam.

### Proteção da biblioteca e integridade do download

- `GET /api/arts` agora exige sessão válida e acesso habilitado, **inclusive quando chamado diretamente**; o ADMIN continua podendo consultar. A conta de demonstração segue o fluxo existente de prévia protegida visualmente, enquanto a rota de download permanece bloqueada para demos.
- Parâmetros de busca, categorias/tags, ordenação e tamanho da página são saneados/limitados para reduzir consultas abusivas sem modificar tabelas ou consultas do Prisma.
- Download grava o histórico e incrementa o contador **depois** de preparar o link R2 ou de carregar o arquivo local/remoto; erro antes da entrega não registra download. Isso não equivale a garantir que o navegador terminou de baixar após o link ter sido entregue.

### Admin Master

Preserva todas as melhorias da revisão anterior, incluindo refresh administrativo e exportação protegida de metadados CSV. Nesta rodada **não** foram reestruturadas as rotas administrativas ou as permissões do Admin, pois não existia ambiente de integração para testar essas alterações com segurança.

## 2. Preservação

- `prisma/schema.prisma` **intocado**; nenhuma migração, seed ou alteração de tabela.
- `prisma db push` continua **fora** do build. `npm run build` permanece `prisma generate && next build`.
- Lockfiles (`package-lock.json`, `bun.lock`) inalterados; `package.json` apenas recebeu `check:source` e `check:types`.
- Não foram modificados provedores de pagamento, credenciais, callbacks/webhooks, domínios do armazenamento ou banco de dados.
- Projetos ainda não foram publicados na Vercel; é preciso realizar Preview Deployment antes de qualquer publicação.

## 3. Verificações realizadas e limitações

- Leitura e parsing estático de **164 arquivos** TypeScript/TSX — sem erros de sintaxe.
- Verificação de imports locais, rotas e ausência de mutação do banco no script `build` — OK.
- Análise das ligações de CTA para o fluxo de registro/checkout já existente; inspeção do uso de `/api/arts` no código-fonte.
- Comparação programática dos arquivos Prisma e lockfiles com o ZIP de entrada.
- A instalação das dependências `npm ci` **falhou neste ambiente**, portanto **não** foi possível executar `next build`, `tsc --noEmit` completo, testes reais no navegador, testes de banco ou checkout. O código foi validado estruturalmente, não homologado em produção.
- **Aumento de conversão não foi medido**: a estratégia precisa de tráfego e observação de eventos (`cta_click`, cadastro, PIX) ou testes A/B.

## 4. Como verificar e publicar com segurança

1. Extraia este ZIP em branch separada no seu repositório. Não coloque os arquivos diretamente em produção.
2. Confira variáveis do Preview da Vercel e mantenha o banco de produção fora dos testes que alteram dados. Faça um backup de banco e storage antes do deploy.
3. Instale dependências pelo gerenciador do projeto e execute `npm run check:source`, `npm run check:types`, `npm run lint` e `npm run build`.
4. No Preview, teste desktop e celular: hero, menu, CTA, autenticação, checkout, `/guia`, mobile CTA, suporte, loja externa, FAQ, carrossel e scroll.
5. Com conta assinante: filtros, múltiplas tags, pesquisa Ctrl+K, favoritos, baixadas, limites, compartilhamento nativo e link expirado; teste erro de mídia sem registrar download.
6. Com conta DEMO e usuário anônimo: valide que `GET /api/arts` não entrega o acervo para anônimos, que DEMO não baixa original; confirme política de acesso ao storage/CDN de previews, sobretudo se arquivos originais ainda estiverem em `public/uploads`.
7. Com conta ADMIN: login, estatísticas, exportação CSV, alterações simples de conteúdos e configurações; valide webhooks e PIX em ambiente de testes, não com pagamentos reais de produção.
8. Publique apenas após os testes. **Não execute `db:push`, `db:seed` ou migrações** como parte desta mudança visual.

## 5. Pontos de acompanhamento recomendados

- Após 20/12/2026, o valor e tipo de plano precisam ser atualizados no Admin/checkout conforme a campanha real; a página deixa de anunciar vitaliciedade automaticamente, mas não muda regras comerciais sozinha.
- O schema JSON-LD ainda contém descrição da promoção até 20/12/2026 e deve ser atualizado quando a campanha acabar.
- Conteúdos institucionais legados (algumas páginas SEO e perguntas históricas) podem conter frases absolutas, que devem ser revisadas editorialmente depois da promoção.
- Não ativar CSP estrita sem primeiro verificar gateways de pagamento, fontes e integrações no Preview.
