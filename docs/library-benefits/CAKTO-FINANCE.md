# Contabilização Cakto — 07/11/2026

A integração anterior gravava a aprovação em PendingPurchase e liberava o acesso, mas descartava amount/paidAt e o resumo somava apenas Payment. A listagem e o dashboard agora usam o mesmo modelo financeiro, incluindo compras Cakto autenticadas, mesmo antes de vincular uma conta. Cortesia não cria recebimento.

O webhook captura data.amount em unidades de BRL, convertido para centavos sem usar o preço da oferta. Moeda ausente/estrangeira e valor inválido ficam sem valor confirmado; não são estimados. Os metadados ficam em Setting, prefixo cakto-finance:, na mesma transação/trava da compra. Valores comprovados não são sobrescritos por reenvios. PendingPurchase REVOKED retira o valor da receita, inclusive em lançamentos legados identificados pela mesma referência.

Compras históricas cujo valor foi descartado aparecem como **Valor a confirmar** e são excluídas da soma até recuperação. É possível reenviar o webhook original pela Cakto: a repetição preenche o financeiro sem repetir liberação de acesso. Alternativamente, Admin → Pagamentos → **Conferir valor Cakto** permite preencher valor BRL, data e referência do comprovante realmente conferido. Os campos iniciam vazios; a confirmação grava administrador, fonte e horário. Não cria outro pagamento nem muda conta/senha/sessão. Moedas estrangeiras não aceitam essa conciliação em reais.

Fontes oficiais consultadas: https://docs.cakto.com.br/conceitos/webhooks e https://docs.cakto.com.br/api-reference/orders/retrieve . A receita exibida é bruta aprovada, não o saldo líquido após taxas da Cakto.

Validação: 27 cenários em dois PostgreSQL locais descartáveis, incluindo cinco reenvios concorrentes, recuperação histórica sem efeitos de acesso, soma manual+Cakto, deduplicação de referências legadas, estorno/chargeback, conciliação administrativa concorrente, origem/permissão e preservação do mestre. Chromium usou os dois formulários reais contra o build compilado e confirmou a gravação e atualização da lista. TypeScript, lint dos arquivos alterados, comércio/webhooks e build passaram. Artefatos: /workspace/work/cakto-revenue-20261107/ e /tmp/library-benefits-BKBs9f/.

Nenhuma migração, exclusão de conta, reclassificação de cortesia, cobrança ou estimativa de valor histórico foi executada. Os testes não acessam banco de produção.
