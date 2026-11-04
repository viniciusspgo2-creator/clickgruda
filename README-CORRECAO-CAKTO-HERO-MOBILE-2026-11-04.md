# Click & Gruda — Correção do webhook Cakto + HERO mobile

Data: 04/11/2026. Base: versão completa ClickGruda_Cakto_Premium_Projeto.zip fornecida anteriormente.

## O que foi alterado (sem alterar login, banco, checkout ou biblioteca)

1. `src/lib/payments/processor.ts` — Serializa no PostgreSQL eventos com a mesma referência externa por `pg_advisory_xact_lock`, usando transações `ReadCommitted`. Mantém idempotência pela chave única `(provider, externalId, eventType)` e executa novamente conflitos transitórios `P2034/P2028`, sem transformar erros reais em `200`. Reembolso/chargeback prevalecem sobre aprovação atrasada da mesma referência. Não substitui ativações manuais independentes.
2. `src/app/api/webhooks/cakto/route.ts` — Validação da autenticação do webhook permanece obrigatória. O controle persistente de volume é verificado *após* a autenticação, e uma falha isolada do contador não derruba o processamento do pagamento legítimo. Em falhas reais de banco no processamento, a rota continua respondendo `500` para permitir reenvio; log contém apenas código técnico e tipos de evento, sem dados pessoais.
3. `src/app/globals.css` — Novo bloco final de regras `@media(max-width:767px)`: o HERO no celular utiliza imagem quadrada própria sem esticar/cortar o mascote, copy abaixo da imagem e botões em coluna ocupando apenas a largura disponível (inclusive aparelhos estreitos). HERO de desktop preservado; botões e ações existentes intactos.
4. `scripts/cakto-webhook-concurrency.test.cjs`, `scripts/cakto-webhook-route.test.cjs`, `scripts/hero-mobile-source.test.cjs` — Testes locais isolados.

## Testes executados

- 7 testes de lógica/rota de pagamentos: passaram (eventos paralelos, duplicidade, conflito transitório, aprovação após chargeback, falha no contador, processamento em lote e falha real no banco).
- Teste de sintaxe TypeScript isolada dos arquivos afetados: passou.
- Teste estático do HERO e verificação do formato de imagem: passou.
- **NÃO validados nesta entrega:** build completo de Next.js, fluxo real no Neon/Cakto e screenshot em navegador (o navegador de automação bloqueou o acesso ao arquivo local). Exigem homologação no ambiente do usuário antes de produção.

## Ordem de deploy — sem alterar Neon

1. Faça backup/snapshot da versão publicada e mantenha disponível o último deployment funcional para rollback.
2. Faça deploy deste ZIP COMPLETO em um ambiente Preview da Vercel usando as mesmas variáveis já configuradas para testar (não exponha secrets em telas/gravações).
3. Verifique visualmente a landing no celular em 320, 360, 390 e 430 px, especialmente botões e imagem do mascote. Verifique desktop em 1280+ px.
4. Na Cakto, envie os três eventos de **teste**, de preferência primeiro separadamente, depois juntos. Esperado: status HTTP 200 se a base e a rota estiverem operacionais. Anote os request IDs dos erros caso apareçam 500.
5. Confirme que uma compra **real homologada** libera a conta certa e que o reembolso/chargeback daquela mesma transação revoga somente a permissão derivada dela. O teste genérico da Cakto, com compradores fictícios, não confirma ativação da conta real.
6. Somente após esses testes publique em Production.

**Nenhuma migração SQL adicional é incluída nem deve ser executada para esta correção.** Os usuários atuais e os dados do Neon não são alterados por este pacote. Não há mudança de formato de webhook nem de chave secreta.

**Atenção:** o diagnóstico de erro HTTP 500 em produção depende dos Runtime Logs; o conflito transacional é uma causa plausível e corrigida, não necessariamente a única. Se persistirem respostas 500, os logs de `POST /api/webhooks/cakto` serão necessários para diagnóstico direcionado.
