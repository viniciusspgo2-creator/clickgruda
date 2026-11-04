# Click & Gruda — Correções visuais dos cards, filtros e modal 3D

Pacote FULL. Extraia na **raiz do projeto**, junto a `package.json`, `src`, `public` e `prisma`.

## Correções incluídas

- **Cards de artes:** botão **Baixar arte** sempre visível, também no desktop, sem depender do hover; o coração de **Favoritar** fica fixo, próximo ao título, com indicador ativo. O download preserva a chamada real da plataforma e o controle de acesso em contas demo.
- **Hover do desktop:** somente **Abrir Studio 3D** e **Visualizar arte maior**. Imagens continuam abrindo a prévia normalmente. Os botões do hover foram compactados para caber mesmo em cards menores; reduzi o deslocamento do card para evitar sobreposição visual.
- **Celulares e tablets touch:** download e favorito permanecem visíveis. O Studio aparece por botão de toque próprio porque não existe hover em telas touch. Grade de duas colunas preservada.
- **Tema claro/escuro:** reforçados os contrastes de fundo, títulos, informações, tags, botão de download e botão favorito (inclusive quando ativo).
- **Gaveta de filtros:** botão “Limpar filtros” corrigido para fundo escuro e texto claro; ajustados contornos e cores do botão ZIP, estados de seleção e limites de largura da lista.
- **Modal do Studio:** 3 botões deixaram de ser espremidos em uma única linha. Ações passaram para grade responsiva, textos e título quebram linha, rolagem vertical permitida quando necessário, largura limitada à janela. Mantido o fluxo real: baixar arquivo → abrir Studio → enviar arte manualmente.
- **Sem alterações:** banner do dashboard, endpoints, Prisma, autenticação, downloads/favoritos e pagamentos. Não incluí prova social fictícia.

## Verificação

- Parser de TypeScript/TSX: 206 arquivos verificados, sem erros de sintaxe.
- Parser PostCSS: `src/app/globals.css` parseado sem erros.
- Testes: `recovery-no-bocao.test.cjs` e `upload-limit.test.cjs`, 12/12 aprovados.
- **Limite de validação:** sem dependências completas para executar `next build`/TypeScript typecheck completo e testes visuais no navegador. Recomenda-se validar o build na Vercel e conferir em telas mobile antes de promover para produção.

## Substituição segura

1. Faça backup ou guarde um commit/ZIP do projeto atual.
2. Preserve `.git` e **todos os arquivos `.env*` usados no seu ambiente**, além de uploads locais não versionados.
3. Extraia este ZIP na raiz do repositório, sem pasta adicional.
4. Confirme que `package.json`, `src/`, `prisma/` e `public/` ficaram ao lado da pasta `.git`.
5. Rode `npm ci`, `npm run check:source`, `npm run check:types` e `npm run build` no ambiente com dependências e teste a **prévia de deploy** da Vercel, incluindo download, favoritos, filtros e Studio.

Não contém `.git`, `.env` real, `node_modules`, `.next` ou segredos. Não há migrações novas para executar.
