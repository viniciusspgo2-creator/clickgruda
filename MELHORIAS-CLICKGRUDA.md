# Click&Gruda — revisão premium (21/10/2026)

## Preservação dos dados e do deploy

- **Nenhuma alteração** em `prisma/schema.prisma`, migrações, seeds, conexões, `.env`, contratos de pagamento, webhooks ou dados cadastrados.
- `npm run build` agora executa `prisma generate && next build`. Foi **retirado** o `prisma db push` automático do build para que o deploy não modifique a estrutura do banco.
- `npm run db:push` permanece disponível apenas como operação manual, agora **sem** `--accept-data-loss`. Não execute migrations/`db:push` em produção sem backup e revisão.
- Arquivos de imagens, uploads, assets e lockfiles originais preservados.
- Nenhum deploy foi realizado. Este pacote é um novo ZIP; o projeto de produção não foi alterado.

## Melhorias realizadas

### Portal e biblioteca
- Menu lateral de exploração com ordenação disponível também no celular; indicador de quantidade de filtros selecionados.
- Seletor de tags recolhível, com pesquisa ignorando acentos, seleção múltipla, tags ativas em destaque, resultados com altura máxima e carregamento visual progressivo das opções.
- Sincronização do campo de busca quando filtros são limpos, debounce de 350 ms e feedback recuperável para falha no carregamento de artes e filtros.
- Atalhos para sugerir artes e solicitar melhoria de imagem agora visíveis **antes** do acervo que rola por diversas páginas; indicação dinâmica da cota diária, quando configurada.
- Cards mais legíveis com títulos de até duas linhas, microinterações, atalho para copiar código da arte e resumo de tags extras.
- Card do gerador de mockups reorganizado e compacto, mantendo plataforma externa e solicitação do código.
- Avisos de loja online 'em breve' e de cursos substituídos por card real da loja, com link `https://www.clickgruda.com.br` e informação de gratuidade para assinantes.
- Rodapé deixa de afirmar downloads ilimitados se houver limite configurado.

### Compartilhamento
- Corrigida contagem de links ativos: links expirados deixam de consumir o limite de 5 novas criações, no servidor e na interface.
- Validação de número de WhatsApp com DDD, feedback melhorado de cópia, botões desativados para links inativos/expirados e opção de tentar novamente em caso de erro.
- Nenhuma alteração na estrutura do token, dos links existentes ou dos catálogos compartilhados.

### Admin Master
- Atalho para atualizar os dados do painel e telas administrativas, sem recarregar toda a aplicação.
- Exportação **somente leitura** para CSV dos metadados de até 20 mil artes: código, título, categoria, tags, sazonalidade, seleção, lançamento, downloads e data. Rota protegida por sessão e papel ADMIN. Não exporta informações pessoais, chaves do armazenamento ou arquivos originais.
- Tratamento explícito de falha no carregamento do dashboard, com opção de tentar novamente.

### Landing page, UX e segurança
- Nova seção de benefícios com quatro cards e atalho para criar loja online; herói e argumentos comerciais focados em organização/curadoria e benefícios concretos.
- Comunicação da promoção até 20/12/2026 condicionada à data e ao preço R$ 47,90. Textos da FAQ e informações SEO revisados para não prometer downloads sem cota diária.
- Removidas comparações de preços avulsos sem comprovação e algumas promessas absolutas de economia.
- Cabeçalhos `X-Frame-Options: SAMEORIGIN` contra clickjacking e `Cache-Control: private, no-store` para rotas admin e portal; a CSP não foi introduzida para não quebrar integrações de pagamento.
- Respeito à preferência de reduzir movimentos para carrosséis animados.

## Validação realizada
- Leitura da arquitetura Next.js 16 / React 19 / Prisma, verificação da filtragem paginada no servidor e autorização administrativa das rotas revisadas.
- Parsing com TypeScript de **164 arquivos `.ts`/`.tsx` e `next.config.ts`: 0 erros de sintaxe**.
- Conferência do novo script de build: sem sincronização automática de banco.
- **Limitação importante:** não foi possível instalar as dependências npm nesta sessão, portanto **não foi possível executar o build completo, testes de integração, nem testar o banco/checkout em produção**. Não confunda parsing de sintaxe com teste de produção.

## Publicação recomendada

1. Faça um backup do banco e mantenha o projeto em produção intacto.
2. Extraia o ZIP em uma branch separada do repositório e confira o diff antes de integrar.
3. Valide as variáveis de ambiente no **Preview Deployment da Vercel** e instale as dependências pelo gerenciador já utilizado no projeto.
4. Execute `npm run build` com as variáveis necessárias (agora **sem** `db push`), e confirme o preview no navegador.
5. Teste: login admin e assinante; filtros com múltiplas categorias/tags; busca e exclusão dos filtros; favoritos; download e cota diária; compartilhamento e validade de links; criação de loja externa; Admin Master e exportação CSV; checkout PIX e webhook em ambiente apropriado.
6. Publique em produção somente após aprovação do preview. **Não rode** `db:seed` nem `db:push` em produção para este pacote.

## Observações
- O CSV exporta **metadados**, não os originais das artes; continua necessária uma estratégia própria de backup de arquivos no storage e do banco.
- As regras de filtragem existentes no banco foram preservadas. Múltiplas tags usam OR entre si; múltiplas categorias usam OR entre si; categoria e tags combinam com AND. Esse comportamento foi inspecionado no código, mas depende de integração real para validação final.
- A mudança de texto da promoção **não automatiza** o fim do plano no gateway de pagamento. É preciso ajustar a oferta/checkout no Admin Master ou na integração na data determinada.
