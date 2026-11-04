# Click & Gruda — publicação desta atualização

## O que está pronto no código

- SEO e GEO com domínio principal https://www.clickgruda.com.br.
- Sitemap com 10 páginas, imagens e a demonstração em vídeo; robots.txt; llms.txt e llms-full.txt.
- Seção **SEO e Integrações** no Admin Master: Google Search Console, Bing, Meta Pixel, verificação do domínio Meta, GA4 e GTM.
- Downloads ilimitados para contas com acesso ativo, inclusive novos downloads da mesma arte.
- Categorias com uma seleção por vez: clicar em Frases substitui Religião.
- Compartilhar catálogo removido. Links antigos retornam 410.

## 1. Publicar na conta Vercel correta

1. Substitua os arquivos do projeto pelo conteúdo da pasta clickgruda-main deste ZIP. Preserve a pasta .git do seu repositório.
2. Mantenha as variáveis atuais do seu projeto Vercel, principalmente DATABASE_URL e AUTH_SECRET. Não copie os valores de exemplo de .env.example por cima dos valores reais.
3. Se existir NEXT_PUBLIC_SITE_URL, atualize para https://www.clickgruda.com.br. O código também fixa o domínio correto para impedir que uma configuração antiga volte a gerar SEO para a Vercel.
4. Suba a atualização pelo seu fluxo habitual de GitHub/Vercel. O build remove somente os arquivos antigos listados em scripts/cleanup-seo-legacy.cjs.
5. Confirme que https://www.clickgruda.com.br abre o sistema atualizado.

Não rode seed nem db push para esta atualização. Ela usa a tabela Setting que já existe, sem criar ou apagar tabelas. O antigo limite diário salvo no banco deixa de ter efeito no código novo.

## 2. Concluir o Google Search Console

1. Abra https://search.google.com/search-console com a conta que administra o domínio.
2. Se a propriedade clickgruda.com.br já existe e está verificada, continue usando-a. A troca do sistema dentro do mesmo domínio não exige Mudança de endereço.
3. Se precisar verificar por tag HTML, adicione **Prefixo do URL** com https://www.clickgruda.com.br/.
4. Selecione **Tag HTML** e copie a tag google-site-verification.
5. No site: **Admin Master → SEO e Integrações → Google Search Console**. Cole a tag ou o token e salve.
6. Abra a página inicial em uma nova aba; depois volte ao Google e clique em **Verificar**.
7. Em **Sitemaps**, envie https://www.clickgruda.com.br/sitemap.xml.
8. Inspecione https://www.clickgruda.com.br/ e solicite indexação. Depois confira blog, guia e sobre.

Para uma propriedade do tipo **Domínio**, a validação é feita por registro DNS; a tag HTML corresponde à propriedade de Prefixo do URL. Preserve os registros de verificação que já existirem.

A verificação e o envio do sitemap só devem ser concluídos quando a versão corrigida estiver publicada. No site auditado, antes desta entrega, o sitemap ainda apontava para clickgruda.vercel.app.

## 3. Ativar Meta Pixel, GA4 ou GTM

1. Abra **Admin Master → SEO e Integrações**.
2. No Gerenciador de Eventos da Meta, copie o ID numérico do Pixel/conjunto de dados e informe no campo **Meta Pixel — ID**.
3. Se a Meta pedir verificação do domínio, cole o token em **Meta Business — verificação do domínio**. Esse código é diferente do ID do Pixel.
4. Para GA4, informe o ID G-XXXXXXXXXX. Para GTM, informe GTM-XXXXXXX.
5. Salve, abra o site em uma nova aba e aceite os cookies opcionais para testar.
6. Confira **Testar eventos** na Meta e **Tempo real** no Analytics.

Com GTM preenchido, a tag GA4 deve ser publicada no contêiner: o carregamento direto de GA4 é desativado para evitar duplicação. Não instale o mesmo Pixel simultaneamente no campo direto e no GTM. O evento de página para configurar no GTM é cg_page_view.

Eventos Meta: PageView, CompleteRegistration, InitiateCheckout, Purchase e Contact. Purchase é disparado quando o pagamento automático é confirmado com o checkout aberto. Conta pré-aprovada e PIX manual ainda em conferência não geram uma compra. API de Conversões, medição de pagamentos sem navegador aberto e importação de vendas manuais exigem integração adicional.

Nenhum ID de Pixel ou medição foi inventado. O Google precisa fornecer o token real de verificação; a Meta precisa fornecer o ID real do Pixel.

## 4. Conferir após publicar

- https://www.clickgruda.com.br/sitemap.xml
- https://www.clickgruda.com.br/robots.txt
- https://www.clickgruda.com.br/llms.txt
- https://www.clickgruda.com.br/llms-full.txt
- https://www.clickgruda.com.br/blog
- https://www.clickgruda.com.br/guia
- https://www.clickgruda.com.br/sobre

No sitemap e no canonical da página inicial, o domínio deve ser www.clickgruda.com.br.

Como o domínio tinha outro site, use os relatórios de indexação do Search Console para identificar as URLs antigas. Redirecione individualmente para conteúdo equivalente quando existir; páginas sem substituto devem permanecer 404/410. Não redirecione indiscriminadamente tudo para a home.
