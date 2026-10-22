# Click&Gruda — Experience 3.0

## O que está neste pacote

Redesign visual da **área de membros e biblioteca**, mantendo o backend, as regras de negócio e o conteúdo existente. Inspirado em dashboards de SaaS e catálogos editoriais de mídia; não reproduz interfaces de terceiros.

### Etapa 1 — Identidade visual

- Base escura azul-petróleo/grafite, componentes de alto contraste, marca laranja preservada.
- Componentes com bordas leves, camadas discretas, elevações controladas e estados de foco acessíveis.
- Interações em hover e efeito de luz sob interação no banner. Não há scroll effects caros, scroll listeners novos, bibliotecas de animação novas ou imagens geradas em lote.
- Tratamento para `prefers-reduced-motion`.

### Etapa 2 — Área de membros

- Sidebar no desktop e navegação em abas no tablet/celular, usando **as mesmas abas, estados e funções originais**.
- Nova recepção editorial mostrando imagens provenientes das artes *já cadastradas* e seu total real consultado à API (sem mockups ou números fictícios).
- Atalhos operacionais para lançamentos, sazonais, selecionadas, mais baixadas, favoritas, downloads, compartilhamento e categorias.
- Busca existente preservada (autocomplete, sinônimos, teclado Ctrl/Cmd+K, paginação no servidor).
- Prateleira de descoberta, chips de categorias, cards e modal de prévia com nova apresentação.
- Cards continuam exibindo a estampa completa (`object-contain`), com seus metadados e download existente.
- Proteções do modo demonstração, favoritos, códigos, downloads e limites não alterados.
- Ferramentas, novidades, sugestões de artes e painel Master continuam acessíveis.

### Etapa 3 — Matriz de preservação

| Área | Tratamento |
|---|---|
| Artes / imagens cadastradas | Mantido; nenhuma migração, importação ou recadastro |
| Categorias / tags / filtros | Mantidos e integrados à nova navegação |
| Sazonais / lançamentos / selecionadas | Mantidos; apresentação renovada |
| Favoritos / downloads / código da arte | Mantidos |
| Checkout / pagamentos / usuários / permissões | Sem mudanças neste pacote |
| Loja online / mockups / ferramentas | Sem mudanças de lógica ou rotas neste pacote |
| Landing pública e painel administrativo | Mantidos para evitar regressões; reforma deles pode ser uma etapa posterior |
| UI do portal / catálogo / cards / modal | Renovada |

## Arquivos modificados

- `src/components/views/PortalView.tsx`
- `src/components/portal/DiscoveryShelf.tsx`
- `src/components/shared/ArtCard.tsx`
- `src/components/portal/ArtPreviewDialog.tsx`
- `src/app/globals.css` (CSS novo isolado sob classes de portal)

**Nenhum arquivo em `prisma/`, `src/app/api/`, `src/lib/`, `public/uploads/` ou `package.json` foi modificado.** Os arquivos existentes continuam no ZIP completo.

## Testes neste ambiente

- `npm run check:source`: OK — 172 arquivos TS/TSX analisados, caminhos de imports verificados.
- `npm run test:discovery`: OK — 6 testes de busca, filtro, código e organização.
- CSS: OK — parse com PostCSS.
- `npm ci` não pôde ser concluído neste ambiente devido à indisponibilidade do registro de pacotes. Por isso, `npm run check:types`, `npm run build` e testes visuais em browser autenticado **não puderam ser confirmados** aqui. Não interprete o pacote como build validado para produção.

## Como publicar com segurança

1. Faça backup do código atual e tenha um backup externo recente do banco de dados.
2. Importe o projeto completo do ZIP em uma **branch separada** do repositório; mantenha as variáveis de ambiente configuradas na Vercel. Nunca inclua chaves secretas no código.
3. Rode na sua máquina ou no CI: `npm ci`, `npm run check:source`, `npm run test:discovery`, `npm run check:types`, `npm run build`.
4. Abra o Preview Deployment na Vercel e teste em **desktop e celular** com uma conta de usuário comum, outra de demonstração e, se possível, uma conta admin.
5. Teste: login, abas, busca por nome/código, categorias, filtro sazonal, preview, favoritar/desfavoritar, download, ZIP, pedidos de artes, catálogo compartilhado, ferramentas, loja e painel admin.
6. Não realize testes destrutivos com o mesmo banco da produção: previews da Vercel podem usar a mesma `DATABASE_URL`. Para testes que escrevem dados, utilize um banco de homologação.
7. Publique somente após esses testes. Se precisar desfazer o visual, volte à implantação anterior; isso não restaura automaticamente alterações do banco.

## Observações estratégicas

- Prioridade para vendas: primeiro melhorar a experiência de quem paga e a qualidade da vitrine. Não adicionamos funcionalidades novas, pagamentos ou serviços pagos de IA.
- Dados verdadeiros: o hero usa imagens retornadas pela consulta atual do catálogo, não exemplos inventados; no modo demo, a visualização é desfocada.
- O grid continua paginado via backend e imagens continuam no armazenamento atual. Nem as 3.500 artes existentes nem as futuras 20.000 precisam ser recadastradas por causa deste redesign.
- Otimizações adicionais de pesquisa/cadastro em lote podem ser feitas separadamente, sem alterar a identidade visual.
