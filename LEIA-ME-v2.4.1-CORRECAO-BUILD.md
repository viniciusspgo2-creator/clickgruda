# Click & Gruda v2.4.1 — correção de build TypeScript

Esta versão é a v2.4 integral, com uma correção pontual na rota `src/app/api/admin/analytics/route.ts`.

## Corrigido
- O array `trend` agora possui tipo explícito `Array<{ day: string; views: number; uniqueVisitors: number; clicks: number }>`; isso evita a inferência `never[]` que impedia o build na Vercel (`TS2345`).
- Foi acrescentado um teste de regressão em `scripts/analytics-dashboard.test.cjs`.

## Preservado
- Painel Analytics (visitas, visitantes únicos, filtros e exclusão de visitas internas).
- Sub-biblioteca de Bocão vinculada por código CG.
- Limite de upload de até 15 MB por arte (requer Cloudflare R2 para arquivos maiores que o limite de requisição da Vercel).
- Usuário Preview, biblioteca e demais recursos da v2.4.

## Publicação
1. Substitua o código da v2.4 pelo conteúdo integral deste ZIP no repositório ligado à Vercel.
2. Inicie um novo deploy e confira o log de compilação.
3. Não há nova migração SQL para esta versão. A migração Bocão da v2.3 ainda é necessária caso não tenha sido executada.

## Validações realizadas
- 21 testes automatizados de Analytics, Bocão e upload passaram.
- 189 arquivos TypeScript/TSX passaram na análise de sintaxe.
- O build completo do Next.js não pôde ser executado neste ambiente por ausência das dependências instaladas. Verifique o build na Vercel antes de colocar em produção.
