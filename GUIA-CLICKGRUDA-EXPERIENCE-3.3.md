# Click&Gruda Experience 3.3 — ajustes da revisão

## O que mudou

- **Cabeçalho:** foram adicionados botões diretos para **Gerador de Mockup** (mesmo endereço do card existente) e **Loja Online** (mesmo endereço do card existente). Em desktop são botões ao lado do menu de usuário/Admin; em celular aparecem numa faixa compacta para não comprimir a busca. O gerador continua exigindo o código da plataforma quando aplicável.
- **Prévia ampliada:** aviso de que a imagem é uma prévia de visualização; botão **Baixar arte** é o caminho oficial para baixar o arquivo disponibilizado. O link alternativo agora diz **Abrir esta prévia em outra aba**. Não muda nem reprocessa os arquivos originais.
- **Ferramentas e novidades:** seção dobrável movida de depois do catálogo infinito para antes da grade. O atalho lateral abre e rola até ela sem limpar filtros nem reiniciar a navegação.
- **Layout:** refinados espaçamento, legibilidade, tamanhos de botões, posicionamento de ferramentas, apresentação de prévia e responsividade mobile/tablet.

## Preservação

Não foram modificados o banco Prisma, rotas de API, autenticação, upload/download, pagamentos, arquivos de artes, filtros, lançamentos, selecionadas, sazonais, favoritos, permissões ou funcionalidades de lojas/mockups. Não há migração de banco nem necessidade de recadastrar artes.

## Validação

Foi executado `npm run check:source`, `npm run test:discovery` e `node --test scripts/experience-33.test.mjs`. O `npm run check:types` está bloqueado neste ambiente por pacotes `@types` incompletos em `node_modules` (TS2688), não pelo código fonte. **Build Next.js completo e validação visual do portal logado não concluídos neste ambiente.**

## Publicação segura

1. Salve o ZIP anterior e prepare uma branch de preview na Vercel.
2. Extraia o ZIP e use a pasta `clickgruda-main` como raiz do projeto.
3. Preserve suas variáveis de ambiente da Vercel; o ZIP não contém credenciais reais. Não execute `db push`, `seed` ou migrações para este redesign.
4. Em instalação limpa, execute `npm ci`, depois `npm run check:source`, `npm run test:discovery`, `node --test scripts/experience-33.test.mjs`, `npm run check:types` e `npm run build`.
5. Teste no preview (computador e celular): cabeçalho com ambos os botões, navegação em todas as abas, filtro ativo + abertura de ferramentas, abrir/fechar/zoom na prévia, favoritos, download autorizado, visualização demo, sazonais e painel Admin.
6. Publique em produção somente quando os testes estiverem aprovados. O rollback de deploy não reverte alterações de dados, por isso o preview deve preferir banco de testes para operações de escrita.

## Observação

Os botões externos continuam utilizando `https://clicktools.vercel.app/` e `https://www.clickgruda.com.br`, exatamente como os componentes existentes. Se esses endereços mudarem, atualize os links nos cards e no cabeçalho.
