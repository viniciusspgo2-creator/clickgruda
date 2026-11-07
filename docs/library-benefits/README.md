# Biblioteca mestre: recebimentos manuais, teste grátis e bônus Studio

## Lançar pagamentos de usuários criados pelo administrador

Em **Admin → Usuários → Registrar pagamento**, escolha o cliente já existente. A mesma opção está em **Admin → Pagamentos**, com busca por nome/e-mail, e depois de cadastrar um novo cliente. Informe o valor realmente recebido em reais, a data em Brasília, a forma e o identificador do comprovante. Confirme que o valor foi recebido fora dos gateways. O registro é feito como `Payment` aprovado, origem `ADMIN_MANUAL`; o total existente do dashboard já soma esse registro com os demais pagamentos aprovados, inclusive os da Cakto.

O botão **Liberar** continua concedendo acesso por decisão do administrador. Cortesia não gera receita. Pagamentos antigos devem ser lançados com os valores e comprovantes reais; não se estima faturamento a partir de quantidade de usuários ou preço de campanha.

O lançamento é transacional, com trava por comprovante, solicitação e usuário. Repetir a mesma solicitação retorna o mesmo pagamento. Outros lançamentos de um cliente que já possui pagamento aprovado ou compra aprovada em `PendingPurchase` são recusados para evitar duplicação, inclusive de compras Cakto ainda não presentes na lista financeira. Se existir pedido pendente, confira e aprove o pedido existente pela área de Pagamentos. Este fluxo atende o pacote vitalício atual: não funciona como um caixa genérico para várias compras avulsas do mesmo cliente.

Há opção explícita de também liberar acesso completo; uma conta bloqueada não é desbloqueada pelo recebimento. Cada lançamento guarda responsável, data de registro, data recebida, comprovante, observação e hash da solicitação em chaves próprias da tabela `Setting`. **Anular lançamento** exige motivo, retira o valor do total e preserva o histórico. Permissões de conta são gerenciadas em Usuários. Um comprovante anulado pode ser relançado corrigido com outra solicitação, preservando ambos os registros. A rota genérica de aprovação não reaprova um lançamento anulado.

Nenhuma cobrança é iniciada pelo lançamento. Não se fabrica evento Cakto. O mecanismo de login, as senhas, os cargos e os usuários existentes são preservados.

## Teste grátis público — somente após ativar as configurações

- Novo cadastro ganha **20 solicitações individuais de download em até 24 horas**, desde `User.createdAt` do servidor. Repetições contam; ZIP é exclusivo de membros completos.
- O mesmo cadastro gera um evento para um código individual no Studio, com **7 × 24 horas desde a criação original**.
- Encerrar 24h ou atingir 20 downloads protege as prévias e bloqueia novos originais, sem enviar revogação do Studio.
- A área do cliente continua disponível para ver o código, a validade e o convite para comprar.
- O checkout aceita contas em teste. Confirmação de compra, conciliação verificada ou concessão administrativa completa retira os limites do teste e envia `MEMBER` para o mesmo ID. O Studio mantém o código/navegador/sessão e retira a validade de teste, inclusive em compra posterior ao sétimo dia.
- Contas anteriores não são convertidas em teste. A regra pública não modifica as cotas administrativas antigas.

O teste é representado por `accessType=TRIAL` e campos opcionais do perfil em `Setting`. `hasAccess=true` permite navegar no portal durante e depois do teste, mas cada download é conferido pelo servidor, sob lock de usuário, contra a cota e o relógio. Uma conta em teste não é tratada como pagamento confirmado pelos checkouts/retornos. A data de encerramento não depende de uma tarefa agendada.

## Comunicação entre os sistemas

A Biblioteca usa `User.id` como identidade imutável, não e-mail/nome. A fila é persistida em `studio-bonus:<id>` na mesma transação do cadastro, pagamento ou mudança administrativa. Guarda o evento, versão crescente, código retornado, tentativas e próxima tentativa. As configurações públicas/administrativas usuais usam listas explícitas e não retornam essas chaves. O código é mostrado somente ao próprio cliente autenticado.

O envio é HMAC-SHA256 sobre método, caminho, timestamp e corpo UTF-8 exato, conforme o contrato `docs/studio-access/library-api.md` do CLICKTESTE. Retentativas mantêm evento/versão/cadastro e reassinam com timestamp atual. Falha HTTP não desfaz cadastro nem pagamento. Resposta perdida depois da confirmação é recuperada por reenvio idempotente. Uma entrega antiga não sobrescreve uma mudança mais nova na fila (atualização condicionada ao valor anterior).

O cadastro tenta a entrega imediatamente. A área do cliente tenta pendências a cada 30 segundos enquanto aberta, respeitando o recuo do servidor. O workflow `studio-bonus-retry.yml` tenta até cinco clientes pendentes a cada execução. Autentica com identidade temporária OIDC do GitHub, sem segredo estático no repositório: assinatura RS256/chaves oficiais, emissor e destinatário exatos, IDs imutáveis do repositório/proprietário, workflow e branch main, subject, runner hospedado e evento schedule/workflow_dispatch. Tokens com mais de cinco minutos são recusados. Não aceita forks, outras branches/workflows ou pull requests. GitHub Actions tem horários aproximados: pode atrasar ou desativar agendamentos de repositórios públicos sem atividade; acompanhe o workflow. É possível usar outro agendador com o bearer exclusivo no mesmo endpoint.

O webhook Cakto confirma primeiro o processamento local e usa `after()` para a entrega acessória, com fila persistente caso o envio falhe. O tempo de resposta da compra não depende de o Studio estar disponível. Reembolso/chargeback e bloqueio/revogação administrativos têm motivos explícitos. Expiração/cota da Biblioteca não é motivo de revogação do bônus. Conta com vínculo não pode ser excluída até a revogação ter sido sincronizada; histórico do vínculo é preservado.

## Implantação controlada

**Sem migração do banco da Biblioteca.** Usa tabelas e campos existentes. O build continua sem `db push`, reset ou seed. Os dois recursos automáticos começam desligados; o formulário de recebimentos manuais funciona com a estrutura atual.

| Configuração privada na Biblioteca | Valor |
|---|---|
| `LIBRARY_FREE_SIGNUP_ENABLED` | `0` padrão; `1` libera teste para novos cadastros |
| `LIBRARY_STUDIO_INTEGRATION_ENABLED` | `0` padrão; `1` habilita fila/envio do bônus |
| `STUDIO_API_ORIGIN` | `https://clickteste.vercel.app` em produção, sem caminho/query |
| `STUDIO_LIBRARY_WEBHOOK_SECRET` | segredo exclusivo de pelo menos 32 caracteres, igual ao Studio do mesmo ambiente |
| `STUDIO_BONUS_CRON_SECRET` | outro segredo exclusivo, pelo menos 32 caracteres, para autorizar retentativas |
| `STUDIO_BONUS_GITHUB_OIDC_ENABLED` | `0` padrão; `1` autoriza exclusivamente o workflow revisado do GitHub |

Para o workflow, habilite `STUDIO_BONUS_GITHUB_OIDC_ENABLED=1` na Biblioteca. Não é necessário cadastrar segredo no GitHub. O bearer `STUDIO_BONUS_CRON_SECRET` continua disponível para operação/agendadores externos. Nunca colocar segredos em `NEXT_PUBLIC_*`, URL, código, logs ou chat. Não reutilizar `AUTH_SECRET`, senha ou segredo do Admin Master. Homologação usa bancos/chaves separados.

Sequência:

1. Verificar backup/restauração e acesso ao banco do **Studio**, aplicar seu SQL aditivo revisado e homologar as rotas HMAC. A implementação do CLICKTESTE está publicada, mas sua API/monitoramento permanecem desligados até esses pré-requisitos. **Não ligar os novos cadastros grátis antes de concluir isso.**
2. Publicar a Biblioteca mantendo ambas as flags `0`; homologar lançamento manual com conta fictícia em banco separado. Conferir somatório, repetição, anulação, usuários existentes e Admin Master.
3. Configurar a mesma chave HMAC nos dois servidores; configurar o worker/agendamento. Validar o Studio receptor com uma conta de homologação.
4. Habilitar a integração do Studio e a da Biblioteca; confirmar emissão e promoção do mesmo código. Só então habilitar `LIBRARY_FREE_SIGNUP_ENABLED=1` e conferir a oferta mostrada antes do cadastro.
5. Acompanhar estados pendentes/erros sem exibir segredos. Nenhum código legado é associado automaticamente por nome/e-mail. Membros anteriores podem solicitar seu código na área autenticada; isso cria um vínculo pelo ID real.

Rollback: desligar primeiro os novos testes (`LIBRARY_FREE_SIGNUP_ENABLED=0`). Os testes já concedidos continuam com os prazos originais; não apagar perfis/recibos/fila. Suspender o emissor/receptor somente quando necessário para a investigação e retomar os mesmos eventos depois. Nunca restaurar backup de produção por cima de pagamentos novos sem reconciliação.

## Verificação

`STUDIO_SOURCE=/checkout/clickteste node scripts/library-benefits-integration.cjs` cria **dois bancos PostgreSQL temporários locais**, injeta explicitamente suas URLs nos clientes e usa os handlers reais das duas aplicações. Não usa `DATABASE_URL` de produção. `--browser` também compila a aplicação e executa Chromium no formulário real, API, banco e lista financeira.

Asserções incluem concorrência de lançamentos, somatório com pagamentos existentes, duplicidade Cakto, anulação auditada, legado com flags desligadas, cadastro protegido, 31 downloads concorrentes com limite 20, 24h independentes de 7 dias, checkout no teste, upgrade do mesmo código/sessão, perda de resposta, indisponibilidade, bloqueio sincronizado e preservação do Admin Master. Os segredos/códigos usados são fictícios e descartáveis. No Chromium local, a requisição do formulário é encaminhada ao servidor compilado com Origin HTTPS de homologação; o handler real valida a sessão, os dados e a transação. Testes de cota, comércio e webhooks anteriores também devem passar.
