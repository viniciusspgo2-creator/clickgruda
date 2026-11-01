# Click & Gruda — Atualização visual e avisos (01/11/2026)

## Modificações feitas

1. **Portal do assinante**: novo fundo panorâmico com o mascote no moletom preto e laranja, sentado em cadeira gamer e segurando a caneca; efeitos discretos de vapor. Layout e botões reais do portal preservados. Imagem: `public/uploads/cg-hero-mascote-cadeira-2026.webp`.
2. **Landing Page**: substituição da arte do topo pela mesma direção de mascote, com versões desktop e mobile. Textos comerciais e demais seções continuam intactos.
3. **Admin Mestre > Avisos / Pop-up**: formulário para tipo (Novidade, Aviso, Informação), título, mensagem e botões para pré-visualizar, publicar/atualizar ou desativar. Cada publicação ganha um ID de revisão próprio.
4. **Portal > popup de avisos**: card escuro premium de leitura responsiva, rodapé fixo com Instagram (`@clickgruda.digital`) e Facebook (`@artesparacanecasoficial`) e botão “Continuar navegando”. Fecha pelo botão, no fundo ou por Esc, exibindo cada versão uma vez por navegador/usuário. Novas publicações aparecem normalmente.
5. **Modal Studio Mockup 3D**: ações de largura proporcional: duas colunas quando não há arte selecionada, três quando há (no celular, uma coluna), sem botão desproporcional.

## Banco de dados

- **Não requer migração Prisma**. Avisos usam a tabela `Setting`, existente no projeto, com a chave `portal_announcement_v1`.
- Primeiro aviso vem desativado; o painel Admin precisa publicar para aparecer aos assinantes.
- As preferências de fechamento são locais no navegador, não implicando coleta de novos dados pessoais.

## Como publicar

1. Faça backup do projeto atual e preserve seus arquivos `.env` e sua pasta `.git`.
2. Extraia este ZIP **na raiz do projeto**, mantendo as variáveis de ambiente atuais.
3. Rode `npm ci`, `npx prisma generate` e `npm run build` antes do deploy.
4. Acesse o Admin Mestre e abra a nova seção **Avisos / Pop-up**.
5. Publique um aviso de teste, visite o portal em uma conta de assinante e confirme apresentação e fechamento.
6. Confira as imagens dos heros e o modal do Studio em telas desktop e mobile.

## Limitação da validação local

A sintaxe TypeScript/TSX foi verificada com o compilador TypeScript instalado no ambiente e os arquivos de imagem foram gerados e inspecionados. O build completo do Next.js **não pôde ser executado neste ambiente**, porque o download de pacotes pelo npm falhou com erro DNS EAI_AGAIN. Execute o build acima antes de publicar. Não afirme que o deploy foi validado até executar esses passos com sucesso.
