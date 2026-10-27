# Click & Gruda — curadoria, Mercado Pago e cupons

> Histórico da versão anterior. As instruções atuais estão em `00-LEIA-ME-SISTEMA-COMPLETO.md`, incluindo o novo atendimento manual e a demonstração pública.

Esta atualização reúne os ajustes da landing, pagamentos, cupons e categorias. Inclui as configurações anteriores de SEO/GEO, downloads ilimitados e remoção do compartilhamento de catálogo.

## Atualizar o sistema existente

1. Extraia o ZIP e atualize o conteúdo do projeto no repositório que publica o Click & Gruda, na conta correta da Vercel.
2. Preserve as variáveis de ambiente e a conexão do banco já utilizadas pelo seu projeto. Não substitua as credenciais pelos exemplos do arquivo `.env.example`.
3. Aguarde a publicação terminar. O comando de build já remove os arquivos legados incompatíveis das versões anteriores.
4. Entre no painel master e confira as novas opções **Mercado Pago** e **Cupons de desconto**.

Não há mudança de esquema do Prisma nesta atualização de pagamentos e cupons. Ela usa as tabelas `Setting`, `Payment` e `User` existentes. Quem já está na versão anterior do sistema não precisa executar migração, seed nem recriar o banco para estes ajustes. O documento `LEIA-ANTES-DE-PUBLICAR-CLICKGRUDA.md` trata da migração antiga da versão 2.

## Mercado Pago no painel master

1. Abra **Mercado Pago** no menu do master.
2. Na sua aplicação do Mercado Pago Developers, copie o **Access Token de produção** e cole no campo correspondente do painel master.
3. Nas configurações de Webhooks da aplicação do Mercado Pago, cadastre a URL que o painel master exibe. Ela termina em `/api/payments/webhook/mercadopago`. Selecione o evento **Pagamentos** no ambiente de produção.
4. Copie a chave secreta de assinatura gerada pelo Mercado Pago e salve no campo de assinatura do painel master.
5. Clique em **Salvar Mercado Pago**. Isso também o torna o meio principal do checkout. Campos de credenciais vazios preservam os valores anteriormente cadastrados.
6. Clique em **Testar credencial salva**. Esse botão consulta a conta e não cria cobrança.
7. Com uma conta de cliente sem acesso, confira o checkout, gere um PIX e valide uma compra no ambiente correspondente. Somente o recebimento confirmado pelo gateway deve liberar a conta.

O sistema calcula o preço e o desconto no servidor, cria o pedido antes da chamada ao gateway, usa uma chave de idempotência e confere o identificador, a referência do pedido, o valor e a moeda antes da aprovação. Notificações repetidas não repetem a liberação. O webhook permite confirmar a compra mesmo quando o cliente fecha o checkout. A chave de assinatura habilita também a verificação HMAC da notificação.

O PIX manual continua dependendo de conferência da equipe. O Mercado Pago é o fluxo de liberação automática. Esta entrega implementa PIX; não inclui checkout por cartão nem cobrança recorrente.

## Cupons funcionais

Em **Cupons de desconto**, crie um código próprio ou gere automaticamente. Escolha desconto percentual ou em reais, validade opcional e compra mínima opcional. É possível copiar, ativar e desativar códigos.

O cliente aplica o código no checkout e vê subtotal, desconto e total antes de gerar o PIX. A cobrança usa o valor recalculado pelo servidor, incluindo no PIX manual. Cupons desativados, vencidos ou incompatíveis com o valor atual são recusados. Os cupons não se acumulam, os percentuais aceitam inteiros de 1 a 99 e o total mínimo da cobrança é R$ 1,00. Não há limite de utilizações por código nesta versão. Os indicadores contabilizam apenas pagamentos aprovados.

## Landing e navegação

- Removidas as referências comerciais a “8 mil” e “8.000+”. Nenhuma quantidade maior foi inventada.
- Mensagem central: **“Aqui não prometemos fantasias. Aqui é realidade.”**
- Copy orientada a curadoria, artes selecionadas, organização, variedade de temas e novidades semanais.
- A comparação explica o problema de arquivos misturados em packs; não faz acusações gerais sobre concorrentes.
- Hero com hierarquia tipográfica mais equilibrada, espaçamento e tamanhos responsivos. Navegação com menu em telas intermediárias e no celular.
- Demonstração, recursos, etapas, condições do acesso, dúvidas e chamadas para compra reorganizados.
- Mantidos os preços vindos do painel e as condições da campanha já existentes. Não foram adicionadas promessas de faturamento.
- Categorias com seleção individual: escolher outra substitui a anterior. Busca, tags e filtro sazonal anteriores são limpos ao escolher uma categoria. A API também utiliza somente uma categoria, inclusive ao receber filtros de clientes antigos.

## SEO, domínio e medição

Mantidos o domínio canônico `https://www.clickgruda.com.br`, sitemap, robots, arquivos de leitura por IA, dados estruturados, páginas públicas e controles de integrações no master. A verificação e o sitemap já enviados ao Search Console não precisam ser refeitos por causa desta atualização. Os identificadores de Meta Pixel, GA4 e GTM continuam dependendo dos valores reais cadastrados no painel.

## Validação realizada

- Build de produção do Next.js concluído, com geração do Prisma Client e verificação TypeScript.
- 52 testes automatizados aprovados: comércio/pagamentos/cupons (16), SEO/integrações (12), filtros (6), upload (8), analytics (6) e recuperação de build (4).
- Servidor de produção local: dez páginas do sitemap conferidas, com H1, canonical, Open Graph, dados estruturados, XML, robots, arquivos de IA, autenticação e respostas de rotas removidas.
- Nos testes de pagamentos, o gateway e o banco foram simulados; nenhuma cobrança real foi criada e nenhuma credencial de produção foi usada.
- A revisão visual em navegador da nova versão não pôde ser concluída neste ambiente. Confira o resultado publicado no computador e no celular.

O recebimento real e a entrega do webhook precisam da configuração da sua aplicação do Mercado Pago e de uma transação confirmada. O ZIP não foi publicado automaticamente na outra conta da Vercel.
