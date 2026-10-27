# Click & Gruda — sistema completo atualizado

Este ZIP contém todo o projeto: dados estruturados ajustados ao serviço digital, diagnóstico de upload no R2, menu lateral sem a barra de rolagem aparente, demonstração pública, cadastro com WhatsApp, ativação com atendimento, controle de dispositivos, paginação numerada e todos os ajustes anteriores de SEO, cupons, Mercado Pago e downloads ilimitados. A Loja Online foi retirada desta oferta.

## Publicar tudo de uma vez

1. Extraia o ZIP.
2. Abra a pasta `clickgruda-main` extraída.
3. Copie TODO o conteúdo para a pasta do projeto que você publica, aceitando a substituição dos arquivos. Preserve a pasta `.git`, os arquivos `.env` com suas credenciais e as variáveis já cadastradas na Vercel.
4. Envie a atualização do projeto completo para o repositório da conta correta da Vercel e aguarde o deploy.

Não é uma entrega de arquivos avulsos. Não precisa recriar o banco, rodar seed ou executar nova migração para estas funções. Os dados novos usam a tabela de configurações existente e os campos de usuário e sessão que o sistema já possui. A rotina de build remove os componentes antigos da Loja Online que poderiam sobrar ao copiar por cima.

## Search Console: dados estruturados e verificação

A oferta da home passa a ser descrita como **Service**: acesso a uma plataforma digital, com biblioteca, ferramentas, marca e imagem próprias. A entidade duplicada **Product** foi retirada. A oferta promocional segue vinculada ao serviço, com o valor lido pelo sistema e o prazo da campanha; um valor ou plano diferente não herda uma promessa vitalícia indevida.

Essa mudança representa corretamente o serviço e deixa de apresentar a home como candidata a listagens de mercadorias. Não é uma promessa de obter rich results de produto ou estrelas. Não foram inventadas avaliações, notas, frete, política de devolução ou uma data de início da oferta para preencher campos sugeridos pelo Google.

Na inspeção pública de 27/10/2026, a home publicada já continha a imagem, e o arquivo respondeu HTTP 200 como WebP. O campo de público mencionado no alerta não estava presente no Product publicado. Portanto, parte do aviso pode corresponder a um rastreamento anterior ou a outra URL do domínio; confira as URLs e datas no relatório do Google.

Também foi encontrado um registro **google-site-verification no DNS de clickgruda.com.br**. A tag HTML não apareceu no código da home inspecionada. Esses são métodos diferentes: uma propriedade já verificada pelo DNS não precisa de uma segunda tag HTML. Preserve o registro TXT existente. O status da conta precisa ser conferido em **Search Console → Configurações → Verificação de propriedade**; a presença do registro público, sozinha, não identifica qual conta o cadastrou.

Se a sua propriedade exigir o método Tag HTML, copie a meta tag oficial e cole em **Master → SEO, GEO e integrações → Google Search Console — código de verificação → Salvar**. O sistema publica a tag no cabeçalho; não precisa editar arquivo. Não copie o token TXT do DNS para esse campo por suposição: utilize a tag HTML fornecida para a propriedade e a conta corretas.

Depois de publicar esta versão, inspecione **https://www.clickgruda.com.br/** no Search Console, use **Testar URL publicada** e solicite a atualização da indexação. Nos relatórios dos avisos antigos, use **Validar correção** quando disponível. O Google precisa rastrear novamente para atualizar os relatórios; o agrupamento de produtos pode deixar de aparecer após a remoção da marcação Product.

Referências: https://developers.google.com/search/docs/appearance/structured-data/product-snippet · https://support.google.com/webmasters/answer/9008080 · https://schema.org/Service

## Correção do upload no Cloudflare R2

A mensagem antiga chamava qualquer falha de conexão de CORS, sem confirmar a causa. O envio agora identifica qual parte falhou e verifica a permissão do domínio no R2. Se faltar CORS e a chave cadastrada permitir editar a configuração do bucket, completa a regra preservando as anteriores e repete uma vez apenas a parte que falhou. Uma falha de rede persistente ou uma recusa explícita do R2 recebe uma mensagem própria.

Depois de publicar o sistema completo, abra **Master → Configurações → Cloudflare R2 → Verificar e corrigir upload**. Salve qualquer alteração de endpoint ou buckets antes de verificar. O teste consulta as permissões dos dois buckets sem criar artes nem arquivos de teste. Se originais e prévias usam o mesmo bucket, verifica uma vez.

Chaves com permissão somente para ler e escrever objetos podem enviar artes sem poder editar CORS. Nesse caso, o painel identifica a restrição e oferece a regra para copiar. Não é necessário trocar uma chave válida por uma chave administrativa só para isso.

Para ajustar diretamente na Cloudflare, inclusive antes de publicar este ZIP:

1. Entre na Cloudflare e abra **R2 Object Storage**.
2. Abra o bucket das prévias usado no master → **Settings → CORS Policy → Edit/Add CORS Policy → JSON**.
3. Se ainda não houver regras, cole o conteúdo de `CORS-CLICKGRUDA.json` e salve. Se já houver regras para outros serviços, acrescente o objeto da nova regra ao array existente, preservando as outras regras.
4. Repita no bucket dos originais. Os nomes exatos são os que estão salvos no master; se ambos usam o mesmo bucket, basta uma vez.
5. Aguarde a aplicação, volte ao painel e tente enviar uma arte novamente. Confira o diagnóstico se o erro continuar.

A regra permite os domínios com e sem `www`, sem barra no final. Não coloque URL de página ou de bucket em `AllowedOrigins`. Para subir por um endereço de preview, acrescente o domínio exato desse deploy ou use o botão no master desse ambiente. O diagnóstico inclui automaticamente os endereços Vercel válidos informados pelo ambiente.

**Não ative acesso público no bucket dos originais.** CORS permite a comunicação do navegador; o acesso aos originais continua exigindo uma URL assinada. O limite de 15 MB foi mantido, com upload direto ao R2; o arquivo não é redirecionado pela função da Vercel.

Referência técnica: https://developers.cloudflare.com/r2/buckets/cors/

## Demonstração pública

- O visitante usa **Conhecer por dentro** na landing ou no login. Não precisa informar e-mail, senha ou WhatsApp para a visita.
- Cada navegador recebe uma sessão de demonstração independente, com validade de duas horas. Uma visita não desconecta outra nem cria cadastros falsos na lista de clientes.
- Categorias, busca, lançamentos, selecionadas e sazonais continuam navegáveis.
- As artes da demo são entregues por uma rota que gera uma amostra reduzida, suavizada e com marca-d’água no servidor. Não depende apenas de um filtro CSS removível.
- Download, favoritos, envio de arte e solicitações de membros ficam bloqueados. Há bloqueio complementar do clique direito nas artes e no modal de ampliação.
- O aviso de demonstração oferece **Liberar meu acesso** e **Já tenho conta**. O sistema encerra a demo antes de abrir cadastro ou login e limpa o conteúdo da sessão anterior.
- Uma conta de cliente já ativa não é substituída por uma demo ao clicar no botão.

O bloqueio de clique direito não impede capturas de tela. A proteção principal é não entregar os originais à sessão de demonstração. O gerador de mockups depende de ativação de membro e apresenta essa informação ao visitante.

## Cadastro, pagamento e confiança

O cadastro público exige nome, e-mail, WhatsApp com DDD e senha. Há um botão para mostrar/ocultar a senha. O aviso explica antes do envio que cadastrar não libera as artes automaticamente.

Sem gateway automático configurado, após cadastrar o cliente vê **Cadastro recebido · ativação pendente**. A tela explica três passos: conversar com a equipe, combinar o pagamento e receber a confirmação da ativação. Não exibe uma chave PIX para o visitante pagar sem atendimento.

O botão principal registra uma solicitação com preço e cupom conferidos no servidor e abre o WhatsApp oficial com nome, e-mail e número da solicitação. Não envia a mensagem sozinho, não declara pagamento realizado e não libera a conta. Solicitações repetidas com o mesmo valor e cupom reutilizam o pedido pendente.

Quem já combinou o pagamento com a equipe pode usar **Já paguei à equipe: enviar comprovante**. A conferência e a liberação continuam sendo responsabilidade do suporte. O cliente também pode conferir na tela se seu acesso já foi ativado.

Quem preferir nem preencher o cadastro tem, na área de login/cadastro, o link **Prefiro cadastrar com a equipe pelo WhatsApp**. O master pode criar a conta em **Usuários → Novo usuário**, registrar o WhatsApp e gerar os dados de acesso. A opção de liberar imediatamente começa desligada: ligue somente depois de confirmar o pagamento.

Se você configurar Mercado Pago ou Asaas no futuro, o checkout só apresenta as opções automáticas que tiverem credenciais. O atendimento pelo WhatsApp permanece disponível. A integração anterior do Mercado Pago foi preservada.

## Ativar uma conta no master

1. Receba o atendimento e confira o pagamento/comprovante.
2. Em **Pagamentos**, aprove a solicitação correta para registrar a compra e liberar o acesso; o desconto do cupom fica vinculado ao pedido.
3. Também é possível liberar uma conta diretamente em **Usuários → Liberar**, quando a contratação tiver sido conferida pela equipe.

Aprovar um pagamento não remove um bloqueio de segurança existente. Para uma conta bloqueada, analise o caso e use **Gerenciar acesso** para desbloquear explicitamente.

## Contatos e data do cadastro

Em **Usuários**, cada cliente mostra o WhatsApp cadastrado, um link para abrir a conversa e a data com hora do cadastro. O horário é exibido no fuso de Brasília, inclusive na apresentação para telas menores. Cadastros antigos que não tinham WhatsApp permanecem sem número; nenhum contato é inventado.

O formulário informa que o WhatsApp será usado para pagamento, ativação e suporte da conta. O número não é exibido a outros clientes. A validação confere o formato; não é uma verificação por SMS da titularidade do número.

## Uma sessão por vez e adicionais

- Conta individual de cliente: **um dispositivo conectado por vez**.
- Entrar em outro aparelho encerra a sessão anterior e mostra um popup educativo. O aparelho desconectado recebe o aviso ao verificar a sessão; há verificação periódica e ao voltar à página.
- Refazer login no mesmo navegador substitui sua própria sessão sem acusar compartilhamento. Abas do mesmo navegador usam a mesma sessão; outro navegador ou janela anônima conta como uma sessão separada.
- A mensagem explica que o compartilhamento simultâneo sem autorização é proibido e que a reincidência poderá levar ao bloqueio pela equipe.
- O botão de adicional abre atendimento sobre **R$ 14,90 por acesso simultâneo adicional (IP adicional)**. Não há cobrança automática nem período de cobrança inventado: a equipe confirma as condições com o cliente.
- Depois de confirmar a contratação, abra **Usuários → Gerenciar acesso** e informe quantos adicionais foram contratados. Zero significa apenas o dispositivo do plano individual; um adicional permite dois dispositivos ao mesmo tempo.
- Reduzir o número de adicionais encerra sessões excedentes. Administradores e contas privadas de apresentação têm regras próprias.
- Reincidências geram alertas no master. O bloqueio da conta é manual, após análise da equipe, para não bloquear automaticamente uma troca legítima de aparelho.

O controle usa sessões autenticadas do navegador. O IP é informação de apoio; mudar entre Wi-Fi e rede móvel não bloqueia uma conta por si só. Alguns logins antigos sem identificação de sessão precisarão entrar novamente após esta atualização.

## Artes e retirada da Loja Online

O master mostra botões numerados na paginação de artes, com primeira e última páginas sempre disponíveis e páginas próximas à atual. É possível clicar diretamente na última página.

A barra clara de rolagem do menu lateral do master foi ocultada no computador e no menu móvel. A rolagem por mouse, toque e navegação pelos botões continua disponível; os itens inferiores não foram cortados.

Foram retirados os botões de Loja Online do computador e celular, o popup da loja e as chamadas de catálogo digital. A imagem da landing que mostrava uma loja foi substituída por uma imagem da biblioteca. Os registros históricos permanecem no banco, sem a oferta aparecer nesta plataforma.

## Validação

Verificações concluídas nesta entrega:

- Compilação de produção com Webpack, conferência dos arquivos-fonte e TypeScript aprovadas.
- 80 testes de regressão aprovados, cobrindo experiência da conta, pagamentos, cupons, SEO, prévias, descoberta de artes, uploads, analytics e remoção de componentes antigos. Os casos de SEO conferem a entidade Service, imagem, marca, oferta, ausência de dados fictícios e fim da campanha. Os 15 casos de R2 incluem preflight, preservação de regras, permissão negada, repetição do envio, erro de assinatura e comunicação HTTP com o SDK S3 real.
- 15 fluxos de integração aprovados com banco SQL local temporário. Incluem cadastro, contato privado, ativação manual, demo assinada, prévia processada, download bloqueado, troca de dispositivo, adicionais e bloqueio de conta. A integração HTTP usa o servidor compilado de produção, com cookies reais e leitura/gravação no banco de teste. O diagnóstico de R2 também foi exercitado pela API compilada, com endpoint S3 local de teste e o SDK real, verificando os dois buckets, preservação de regras e restrições de administrador/origem.
- 10 páginas públicas aprovadas em canonical, Open Graph, H1, dados estruturados, sitemap com vídeo, robots, textos para IA, respostas 404/410, redirecionamentos e restrições das APIs.
- Tema e contraste da landing conferidos no HTML/CSS compilado para larguras de 360, 768 e 1440 pixels. A correção do conflito de cores anterior foi preservada.

Comandos para repetir as verificações:

```bash
npm ci
npm run check:source
npm run check:types
npm run test:account-experience
npm run test:r2-upload
npm run test:commerce
npm run test:seo
npm run build
node scripts/verify-landing-theme.cjs
```

Para os testes com banco temporário, use `npm run test:member-flow`. Esse teste usa um banco local descartável, não o banco de produção. O modo Prisma dev compartilha um backend local; o caso de concorrência entre backends deve ser executado com PostgreSQL nativo. A repetição em caso de conflito serializável também é coberta pelo teste isolado de sessões.

Para incluir a integração HTTP do servidor compilado, após o build execute:

```bash
CLICKGRUDA_TEST_HTTP=1 npm run test:member-flow
```

Esta entrega é o código completo pronto para publicar. Não foi publicada automaticamente na sua outra conta da Vercel. Não houve acesso nem alteração dos buckets reais da Cloudflare; a permissão deles deve ser conferida pelo novo botão ou diretamente no painel da Cloudflare. A confirmação visual final no domínio deve usar o novo deploy; o ZIP não certifica uma compra real com credenciais de produção.
