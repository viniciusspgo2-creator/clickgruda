# Jornada do cliente e limpeza — 07/11/2026

O portal reúne saldo de downloads, prazo local de Brasília, código e prazo dos bônus no Resumo do seu acesso. O teste da Biblioteca continua limitado a 20 downloads/24 horas; o Studio/Editor mantém o prazo independente de 7 dias. Os primeiros passos orientam busca, download e uso do bônus. A ativação do pacote mantém o mesmo código e apresenta o acesso completo. Falhas de consulta não são apresentadas como acesso ilimitado, e bônus bloqueados/vencidos não oferecem abertura.

O dashboard inclui a jornada das novas contas grátis: cadastros, clientes que baixaram, clientes com compra aprovada e compradores/cadastros. É uma coorte pelo período de cadastro; os eventos posteriores contam para aquela coorte, sem exigir que o download anteceda a compra. Um cliente conta uma vez, cortesias não contam como compra e contas antigas não são reclassificadas. O marcador trial-origin: é criado na transação do novo cadastro, usando Setting existente. Não há novo schema ou migração.

## Limpeza

- Removidos 30 componentes de UI sem caminho de importação a partir da aplicação, dois hooks usados apenas por esses componentes e o antigo toast/toaster, substituído pelo Sonner já em uso.
- O antigo StudioBonusCard foi substituído pelo resumo unificado.
- Removido o gerador de imagens legado com destino de filesystem fixo de outro ambiente.
- Removidos dois scripts que apagavam caminhos já excluídos durante o build; o teste de recuperação continua protegendo as rotas e modelos em uso. Os avisos históricos foram atualizados.
- Total: 37 arquivos antigos removidos, 38 dependências diretas sem uso retiradas. O lockfile passou de 1.047 para 687 entradas (360 a menos); as versões nos caminhos mantidos não foram atualizadas. A instalação local foi podada e a aplicação compilada com as dependências restantes.
- Nenhum arquivo público de arte, upload, original para impressão, schema Prisma, sessão, senha ou histórico financeiro foi removido. Os assets podem ser referenciados dinamicamente pelo banco; ausência em uma busca de código não é critério para excluí-los.

## Verificação

- 29 cenários com dois PostgreSQL descartáveis, incluindo os formulários reais de recebimento manual e conciliação Cakto.
- Chromium criou uma conta pela interface e API compiladas, usando as chaves oficiais de teste do Turnstile. Fez download de um arquivo real; confirmou o bloqueio após o prazo da Biblioteca com o bônus ainda ativo; enviou uma aprovação Cakto autenticada fictícia e verificou que o mesmo código ficou definitivo.
- Biblioteca e Studio usaram bancos diferentes e comunicação HMAC por HTTPS local com certificado confiado exclusivamente no processo de teste. Nenhuma credencial real ou cobrança foi usada.
- Testes de conta cobrem flags de cadastro, cota encerrada, bônus ativo/vencido/bloqueado e falha de consulta. As expectativas antigas de texto da landing/cadastro foram atualizadas para a oferta já publicada; verificações de senha, WhatsApp, demo, sessões e permissões foram mantidas.
- Sete suítes de regressão de conta, analytics, comércio, webhooks, cota e recuperação passaram; também passaram 24 verificações OIDC do worker.
- Build, TypeScript, lint dos componentes novos e verificação estática de 214 fontes/imports passaram. Dois erros de lint anteriores em PortalView (efeitos que atualizam busca/tema) permanecem fora do escopo desta alteração.

Evidências locais: /workspace/work/cakto-revenue-20261107/final-browser.log, final-regression.log, cleanup.json e /tmp/library-benefits-9KlNs3/browser/.
