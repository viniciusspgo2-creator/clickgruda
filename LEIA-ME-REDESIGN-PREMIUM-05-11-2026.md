# Click & Gruda — atualização visual pontual da Biblioteca
Data: 05/11/2026

Esta entrega utiliza o projeto enviado pelo proprietário e aplica somente o redesign visual indicado pelos recortes do modelo premium. Não há migrações de banco, novas integrações, alterações de pagamento, nem mudanças nos endpoints de download ou acesso.

## Origem dos ícones
- `lucide-react`, já declarado no `package.json` do projeto.
- Biblioteca de categorias já existente em `src/lib/category-icons.tsx`.
- SVGs renderizados pela aplicação; não são imagens externas, emojis de menu ou ícones rasterizados.

## Componentes ajustados
- `src/components/views/PortalView.tsx`: barra lateral, lista dinâmica de até 9 categorias visíveis com contagens reais, botão para abrir todas as categorias existentes, ícones da navegação, topo, controles do acervo, atalho de sugestão.
- `src/components/portal/DiscoveryShelf.tsx`: quatro atalhos existentes com a composição visual do exemplo; Sugerir uma arte abre o recurso já presente.
- `src/components/shared/ArtCard.tsx`: título e chips organizados com coração e download em botões compactos, mantendo cópia de código, favorito, bloqueio de demonstração, limite e eventos de download, e ações de Studio/preview.
- `src/app/globals.css`: estilos de interface encapsulados por `.cg-portal`, com atenção ao responsivo e estados de foco.

## Preservado
- Hero principal original e imagem original do mascote.
- Catalogação, filtros, busca, ordenação e visualização de arte.
- Acesso demo, proteção de prévia, downloads e cotas.
- Cakto, banco de dados, credenciais e processamento de pagamentos.
- Páginas públicas, landing page e painel administrativo.

## Validação e publicação
- Os três arquivos TypeScript/TSX alterados passaram na análise de sintaxe do compilador TypeScript.
- A verificação completa do build **não foi concluída neste ambiente**: as dependências não puderam ser instaladas completamente; o npm falhou durante a instalação. Por isso, é necessário executar `npm ci` e `npm run build` no seu ambiente de CI/Vercel antes de publicar em produção.
- Recomenda-se testar primeiro em um deployment **Preview** na Vercel, incluindo mobile, navegação entre categorias, preview, favorito e downloads.
