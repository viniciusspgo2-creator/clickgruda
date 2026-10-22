# Click&Gruda Experience 3.4 — Hero + Avisos + Light Mode

## Ajustes aplicados

- Removida a vitrine lateral de `Datas sazonais` da página inicial do portal.
- Removido o item `Ferramentas e novidades` do menu lateral.
- Removida a seção grande de ferramentas/novidades do conteúdo principal.
- Adicionados botões `Gerador de Mockup` e `Loja Online` no header.
- Antes de abrir cada recurso, agora aparece uma janela informativa:
  - Mockup 3D: informa que é premium e que o assinante pode solicitar código grátis ao suporte.
  - Loja Online: informa para solicitar o voucher vitalício com o suporte.
- Adicionado alternador `Dark / Light` no portal, com persistência em `localStorage`.
- Hero principal atualizado com banner mais comprido e visual no estilo aprovado, usando a caneca/mascote, cenário e copy `Artes que inspiram negócios`.
- Mantido o bloco textual da esquerda com CTA e estatísticas.
- Novo asset incluído em `public/uploads/cg-portal-hero-premium-banner.png`.

## Verificações executadas

- `npm run test:discovery` ✅
- `npm run check:source` ✅

## Observação

- `npm run build` não foi concluído neste ambiente porque o binário do Prisma não está disponível aqui.
- `npm run check:types` também continua bloqueado por dependências de tipos ausentes do ambiente local.

## Recomendações

1. Suba em Preview na Vercel.
2. Teste o portal em desktop, tablet e celular.
3. Valide o tema claro nos pontos principais.
4. Clique nos botões de Mockup e Loja Online para conferir os modais e redirecionamentos.
5. Se estiver tudo ok, promova para produção.
