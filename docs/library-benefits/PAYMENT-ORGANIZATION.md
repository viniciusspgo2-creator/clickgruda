# Organização de pagamentos e testes Cakto — 07/11/2026

Contexto informado pelo administrador: até esta etapa houve uma compra real Cakto, já lançada pelo administrador. Os eventos com john.doe@example.com / ohn.doe@example.com eram simulações da própria integração. Não foi criado outro recebimento nem estimado valor de compra.

A tela de Pagamentos inicia em **Recebimentos reais**, com busca por cliente/e-mail/comprovante e filtro por origem. **Testes Cakto** tem uma aba própria e fica fora da receita, pagamentos pendentes, alertas de valor ausente, pagamentos recentes e conversão em compra. O histórico técnico da integração fica recolhido e permite incluir os eventos de teste na consulta.

A classificação é calculada na leitura, restrita à Cakto e aos domínios reservados de exemplo example.com, example.net e example.org. Reconhece as duas grafias informadas e diferenças de maiúsculas/minúsculas. Não usa uma lista fixa de clientes autorizados: novas vendas reais seguem automáticas. Pagamentos manuais e cortesias mantêm suas regras existentes.

A conciliação financeira rejeita esses registros de teste para impedir que um clique transforme uma simulação em receita. Eventos, valores antigos, status, contas, permissões e código de processamento do webhook não foram alterados; o histórico de teste permanece consultável. Não há migração ou mutação de dados de produção.

Validação: 30 cenários com dois PostgreSQL isolados, incluindo comparação dos pagamentos/metadados e do mestre antes/depois, teste conhecido com valor, teste antigo sem valor, exclusão do faturamento/pendências/conversão e proteção da conciliação. Chromium percorreu as duas abas, busca por e-mail/comprovante, filtro manual e formulários existentes; também repetiu a jornada de cadastro/download/ativação do pacote. Sete suítes de regressão, TypeScript, lint dos arquivos alterados, check:source (216 fontes) e build passaram.

Evidências locais: /workspace/work/payment-organization-20261107/ e /tmp/library-benefits-fJtynn/.
