# Evidências da etapa — 07/11/2026

- 21 cenários passaram com dois PostgreSQL locais descartáveis, incluindo o Chromium sobre o build real do Next.js. A Biblioteca envia requisições HMAC ao handler real do CLICKTESTE; cada aplicação usa seu próprio banco.
- No teste visual, o Admin Master fictício registrou R$ 47,90 pelo formulário. O servidor respondeu 201, criou um único pagamento aprovado e a lista exibiu o recebimento.
- A concorrência de seis lançamentos iguais produziu um único pagamento; a soma com pagamento Cakto pré-existente foi conferida pelo endpoint real do dashboard. Anulação e correção preservaram os dois registros e o comprovante.
- Foram exercitados 31 downloads simultâneos: exatamente 20 permitidos. O prazo de 24h bloqueou os originais sem revogar os cinco dias restantes do Studio. Compras Cakto e manuais converteram o mesmo código em membro, preservando navegador/sessão.
- Falha de resposta depois de confirmação, indisponibilidade, retentativa autenticada, bloqueio da conta e desbloqueio após pagamento passaram. O usuário mestre e uma configuração anterior foram comparados antes/depois e permaneceram intactos.
- 26 verificações existentes de comércio, cota e webhooks passaram. Os mocks de dependências foram atualizados para os novos pontos de integração, mantendo as asserções de negócio.
- TypeScript, build Next.js/Prisma, verificação de 238 fontes/imports e `git diff --check` passaram. Lint dos arquivos TS/TSX novos passou. A execução sobre todos os arquivos alterados ainda aponta dois erros anteriores em `PortalView` (efeitos que atualizam busca/tema), confirmados na versão base, e um aviso anterior de navegação em `AuthView`; este trabalho não altera essas rotinas.
- Schema Prisma, lockfile, dependências e biblioteca de sessões continuam iguais à base. Não foram executados comandos de migração/seed/reset nem ações de pagamento/cadastro em produção.

Base revisada: `546649d34d5de6021d1f46fd2eef7afee8cb6c6a`. Artefatos locais da execução final: `/tmp/library-benefits-BQbX07/` (build, log do servidor e capturas fictícias). O teste local encaminha o POST do navegador ao servidor compilado com origem HTTPS de homologação para reproduzir a origem recebida atrás do proxy de produção.

As flags automáticas permanecem desligadas por padrão. Publicação do código e ativação da integração são etapas distintas, conforme o procedimento em `README.md`.
# Retentativas com identidade temporária — 2026-11-07

O worker aceita opcionalmente OIDC do workflow exato da main, além do bearer operacional anterior. Nenhuma dependência ou schema foi alterado. `jose` já fazia parte do projeto.

- `node scripts/studio-bonus-worker.test.cjs`: 22 verificações com JWTs e assinaturas RS256 reais em chaves isoladas. Incluem fluxo agendado/manual/publicação válido, assinatura errada, emissor/audiência, fork/repositório recriado/proprietário, branch/workflow/subject/evento/runner incorretos, expiração, idade, emissão futura, campos ausentes, token inválido e flag fechada por padrão.
- `STUDIO_SOURCE=/workspace/work/clickteste node scripts/library-benefits-integration.cjs --reuse-build`: 20 cenários passaram novamente com dois PostgreSQL locais. Exercita o handler atualizado do worker com o bearer anterior; não usa banco de produção.
- TypeScript, ESLint dos arquivos novos/alterados e verificação de 239 arquivos TS/TSX passaram.
- Em produção, assinatura ausente/incorreta/expirada foi recusada pelo Studio; assinatura correta com corpo vazio chegou à validação estrita e foi recusada sem criar códigos. Teste autenticado de conta real não foi feito e credenciais administrativas não foram acessadas.
