# CLICK & GRUDA v2.2 — Estatísticas e exclusão de visitas internas

Esta versão parte **integralmente do ClickGruda v2.1 Preview Mais Nítido** (mantém biblioteca, cadastro, Preview, mockup, loja e demais funcionalidades).

## O que foi implementado

- Admin Master → Dashboard → Estatísticas da landing:
  - Total de visitas, visitantes únicos estimados, cliques nos CTAs, e porcentagem de cliques por visita (NÃO são vendas).
  - Gráfico de visitas, únicos por dia e cliques com datas no fuso de Brasília.
  - Filtros Hoje, 7 dias, 30 dias e Personalizado (até 366 dias).
  - Botões mais clicados.
  - Botão **Excluir este navegador**. Quando ativado pelo Admin Master, define um cookie HTTP-only assinado (válido por 1 ano) e marca localmente o navegador. Vale mesmo após logout.
  - Contas Admin Master autenticadas não entram no contador interno automaticamente.
  - Lista opcional de IPs ignorados; adição de IP atual e remoção via edição do campo.
- Identificadores anônimos de visitante continuam em hash SHA-256 no banco; o IP dos visitantes não é salvo nos eventos.
- Ao ativar exclusão do navegador, os eventos anteriores do mesmo navegador ficam fora dos relatórios; desativar reintroduz os eventos anteriores que ainda existem no banco.
- A exclusão de IP afeta apenas eventos novos, não visitas antigas (os IPs antigos não são armazenados).
- O usuário visitante não pode configurar exclusões: a operação exige sessão Admin Master.

## Publicação

1. Faça um backup do código atualmente publicado / mantenha o último deploy estável na Vercel.
2. Extraia este ZIP e atualize o repositório conectado à Vercel, preservando variáveis de ambiente existentes.
3. Publique primeiro em Preview Deploy e confira o Dashboard, a Home, o usuário Preview e as estatísticas.
4. Teste a exclusão do navegador: Admin Master → Dashboard → Excluir este navegador. Saia da conta e abra a landing no mesmo navegador; o contador não deverá aumentar.
5. Abra em outro navegador/dispositivo para simular visitante normal; o contador deverá registrar uma visita (pode levar até 30 segundos para refletir o cache do Dashboard).
6. Confirme o funcionamento de filtros e IPs, então publique em produção.

**NÃO PRECISA EXECUTAR SQL NEM ALTERAR O BANCO NEON.** As preferências são salvas na tabela `Setting` que já existe. A tabela `SiteEvent` instalada na v2 continua sendo utilizada.

## Observações importantes

- Não é possível garantir identificação de *pessoas* únicas: utiliza identificadores de navegador e pode variar após exclusão dos dados locais, bloqueadores ou uso de outro aparelho.
- Uma mesma pessoa pode gerar várias visitas. A contagem deduplica eventos enviados em intervalo de 30 segundos por navegador.
- Bloquear um IP não impede o acesso ao site: apenas exclui eventos das estatísticas internas.
- IPs dinâmicos podem mudar. Prefira o botão **Excluir este navegador** para excluir seu uso pessoal.
- Estas exclusões se aplicam ao contador próprio do Admin Master. GA4 / GTM, quando configurados, são sistemas independentes. O botão de exclusão de navegador também desativa o envio de eventos do cliente para o GA4/GTM nesse navegador; a exclusão por IP no servidor não altera GA4/GTM.
- Um mesmo navegador marcado pelo Admin Master não é contado até desativar a opção, remover os dados locais e o cookie, ou expirar o cookie.
- Os dados começam na instalação do contador da v2; não é possível recuperar visitas de períodos anteriores.

## Verificações efetuadas

- Testes de integração de rotas com banco simulado: ativar e desativar navegador, Admin ignorado, IP ignorado, períodos válidos/inválidos e permissão apenas para Admin.
- Testes anteriores da versão Preview.
- Análise de sintaxe dos arquivos TypeScript/TSX.

O build completo do Next.js não foi executado neste ambiente porque o pacote não inclui `node_modules` e as dependências não estavam instaladas. O build da Vercel continua sendo etapa obrigatória.
