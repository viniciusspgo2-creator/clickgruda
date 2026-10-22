# Click&Gruda — Evolução da biblioteca e da organização

## O que foi aplicado

### Experiência dos clientes (Portal)

- Busca com sugestões consultadas no servidor, nomes reais de artes e termos relacionados; inclui dicionário explícito de sinônimos (ex.: Goku / Dragon Ball, mãe / mamãe). A pesquisa continua paginada no PostgreSQL, sem carregar milhares de arquivos em memória.
- Atalhos para lançamentos, selecionadas, mais baixadas e próxima data sazonal com artes cadastradas.
- Categorias populares em destaque com contagem real do banco e acesso em um clique.
- Barra de filtros e ordenação acessível próxima dos resultados.
- Prévia ampliada ao clicar na imagem, com detalhes e ações de baixar, favoritar e explorar categoria, tag ou data.
- Mídia exibida diretamente da `imageUrl` já cadastrada, usando `object-contain`: NÃO há geração de mockups, recorte das artes, alteração de imagens nem necessidade de reenviar os arquivos.
- Área de ferramentas e novidades preservada em seção expansível após a lista principal para que as artes ganhem destaque.
- Correção do comportamento de “Todas as datas”: o filtro sazonal deixa de selecionar automaticamente a próxima data após escolha do cliente.
- Mantidos proteção do modo demonstração, limite e fluxo de download, favoritos, códigos, catálogo compartilhado e paginação do servidor.

### Administração

- Alternância entre modo lista (edição rápida) e modo visual (miniaturas completas e maiores).
- Filtros de revisão para encontrar artes SEM categoria e SEM tags.
- Os filtros de revisão são compatíveis com a seleção em lote e as regras de confirmação já existentes.
- Modo visual contém seleção por checkbox, código, título, categoria, sazonalidade, tags, downloads, botão editar e ações de lançamento/selecionada/excluir.
- Edição em lote preservada integralmente.

### Banco de dados

- Nenhum modelo Prisma ou dado preexistente foi alterado; nenhum script de migração.
- Nenhuma nova coleção persistida foi criada. As seções “Descubra novas ideias” e as categorias em destaque são atalhos dinâmicos para filtros existentes — com as contagens reais do catálogo.
- A funcionalidade de IA que classifica imagens e uma central de duplicatas visuais NÃO fazem parte deste pacote; exigiriam projeto e validação próprios, para evitar classificações erradas ou custos inesperados.
- O status NOVO permanece controlado pelo campo `isLaunch` já existente; não há remoção automática do selo em artes antigas.

## Como testar com segurança antes de publicar

1. Faça backup do repositório atual e confira se há alterações não publicadas.
2. Em uma branch, substitua o projeto pelo conteúdo do ZIP **completo**, preservando suas variáveis de ambiente Vercel. **Não sobrescreva `.env`**; nenhum `.env` real vem no ZIP.
3. Instale as dependências: `npm ci`.
4. Execute: `npm run check:source`, `npm run test:discovery`, `npm run check:types`, `npm run build`.
5. Crie um Preview Deployment pela branch na Vercel. Verifique que o banco configurado na prévia é o desejado; previews normalmente podem compartilhar o mesmo banco de produção.
6. Teste no navegador: busca por título e código; buscas como “caneca goku” e “mãe”; filtros e “Todas as datas”; prévia ampliada; favoritas; downloads; modo demo; painel Master; modos visual e lista; seleção e atualização de 2 artes de teste em lote.
7. Se estiver tudo correto, publique em produção.

**Atenção:** alterações de dados realizadas no Preview também podem afetar produção quando ambos usam o mesmo banco. Crie artes de teste em um banco separado para validar operações de escrita. O rollback da Vercel retorna o código/interface, não desfaz operações no banco.

## Verificação deste pacote

- `npm run check:source`: passou (172 arquivos TS/TSX, sem erros de sintaxe ou imports internos quebrados).
- `npm run test:discovery`: 6 de 6 testes passaram (sinônimos, pesquisa por código, revisão de tags, filtro para seleção em lote).
- Transpilação dos módulos principais alterados: passou.
- `npm run build` e `npm run check:types` com dependências completas: **não executados com sucesso neste ambiente**, pois o acesso ao registro npm retornou `EAI_AGAIN` e não havia dependências Next/React/Prisma instaladas. Execute-os no Preview/Vercel antes de promover a produção.

## Arquivos com maior impacto

- `src/components/views/PortalView.tsx`
- `src/components/shared/ArtCard.tsx`
- `src/components/portal/ArtPreviewDialog.tsx` (novo)
- `src/components/portal/DiscoveryShelf.tsx` (novo)
- `src/app/api/arts/suggestions/route.ts` (novo)
- `src/lib/art-search.ts` (novo)
- `src/lib/arts.ts`
- `src/components/views/AdminSections.tsx`
- `src/lib/admin-art-filters.ts`
- `src/app/api/admin/arts/bulk/route.ts`
- `scripts/discovery.test.mjs` (novo)
- `package.json` (script de teste)

## Compatibilidade

Este pacote foi criado sobre a versão do projeto que já continha edição em lote, conforme o ZIP entregue anteriormente. Mantém os demais arquivos e páginas do sistema (incluindo a seção Biblioteca de Artes na página inicial) sem reformulação.
