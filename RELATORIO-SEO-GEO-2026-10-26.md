# Auditoria e implementação — Click & Gruda

Data: 26/10/2026. Base: ata(1).zip, PARA SEO DO SITE.txt, PARA GEO DO SITE.txt e respostas públicas do domínio.

## Diagnóstico do site publicado antes da atualização

| Item | Evidência encontrada | Correção no pacote |
| --- | --- | --- |
| Domínio | clickgruda.com.br redirecionava para www.clickgruda.com.br | www adotado como origem canônica única |
| Canonical | A home de produção apontava para https://clickgruda.vercel.app | Domínio final fixado no código, independente da variável antiga |
| Sitemap | As 10 URLs e imagens apontavam para a Vercel | URLs do domínio final; XML de vídeo validado, inclusive o & da marca |
| Robots | Grupos específicos de bots tinham Allow sem herdar os bloqueios do grupo geral | Mesmas regras de áreas privadas para os bots identificados e o grupo geral |
| Search Console | Nenhuma tag google-site-verification na home inspecionada | Campo no Admin Master e metadado HTML gerado no servidor |
| Publicidade | Não havia Meta Pixel no painel | ID do Pixel e verificação Meta configuráveis no painel |
| Dados estruturados | FAQ, HowTo e glossário eram injetados pelo layout em todas as páginas | Organização e WebSite compartilhados; conteúdo específico publicado apenas em sua página |
| Conteúdo para IA | Links para âncoras removidas e condições de download inconsistentes | Arquivos gerados a partir das fontes atuais; downloads ilimitados conforme a nova orientação |
| Autoridade | Perfis sociais montados sem confirmação e datas de revisão recalculadas diariamente | sameAs somente com perfis cadastrados; datas editoriais explícitas |
| Categorias | Um seletor acumulava categorias | Uma categoria por vez em todos os pontos do portal e no estado global |
| Downloads | Havia cota padrão de 500 e truncamento do backup em 6.000 artes | Cota eliminada e lista de backup completa |
| Compartilhamento | Havia aba, geração de links e catálogo público temporário | Interface removida e rotas descontinuadas respondendo 410 |

A ausência de tag HTML não permite concluir que não existia uma verificação anterior por DNS. Essa confirmação depende do Search Console autenticado.

## SEO e conteúdo

Há 10 páginas públicas no sitemap: início, blog, seis artigos, guia e sobre. As páginas foram conferidas no HTML servido quanto a título, descrição, canonical, Open Graph, H1 e escopo do JSON-LD. Os seis artigos que já existiam foram preservados.

| Intenção de busca | Página |
| --- | --- |
| Artes para canecas, biblioteca para sublimadores e mockup 3D | / |
| Como escolher artes para sublimação de canecas | /blog/artes-para-sublimacao-de-canecas-guia |
| Quanto custa começar a sublimar canecas | /blog/quanto-custa-sublimar-canecas |
| Como escolher prensa de canecas | /blog/prensa-de-canecas-como-escolher |
| Onde encontrar artes para sublimação | /blog/onde-encontrar-artes-para-sublimacao |
| Como sublimar canecas passo a passo | /blog/como-sublimar-canecas-passo-a-passo |
| Datas comemorativas para vender canecas | /blog/datas-comemorativas-para-vender-canecas |
| Dúvidas, comparativo, fluxo e termos técnicos | /guia |
| Informações institucionais | /sobre |

Os termos trabalham em títulos, descrições e conteúdo útil, com links internos. A meta keywords é complementar e não deve ser tratada como fator de ranqueamento do Google.

Não foram criados depoimentos, avaliações, resultados financeiros, perfis sociais, especialistas ou endereço físico fictícios. O projeto se apresenta como operação digital; LocalBusiness e cadastro de estabelecimento físico precisam de dados reais e elegibilidade.

## GEO

- Marca e produto descritos com respostas diretas em português.
- FAQ da home coincide com as perguntas exibidas nela; o guia tem seu próprio FAQ, HowTo e glossário.
- BlogPosting e BreadcrumbList próprios dos artigos.
- Product/Offer acompanha o preço consultado e publica a condição vitalícia somente enquanto a campanha correspondente está ativa.
- VideoObject e entrada de vídeo no sitemap usam o vídeo Vimeo já exibido na home. Duração de 70 segundos, data e thumbnail conferidos pela API pública do Vimeo.
- /llms.txt e /llms-full.txt são gerados das mesmas fontes; o conteúdo consolidado inclui os artigos, perguntas e glossário.
- /api/geo/knowledge-base continua disponível publicamente, sem incluir credenciais ou configurações privadas.

Não há pontuação artificial de citabilidade nem promessa de citação por IA. llms.txt é um recurso complementar: o Google informa que SEO útil, conteúdo rastreável e dados estruturados coerentes continuam sendo a base para seus recursos de IA.

## Desempenho e medição

- Módulos de autenticação, checkout, portal e admin carregam sob demanda.
- A landing mantém conteúdo no HTML inicial e deixa de começar totalmente transparente.
- Configurações públicas têm cache com invalidação ao salvar no painel e deduplicação por requisição.
- GA4, GTM e Meta carregam após interação/hidratação e, por padrão, após consentimento.
- GA4 direto e integração GTM têm caminhos separados de envio de eventos para evitar envio em dobro.
- Suporte a AVIF/WebP no otimizador, compressão e cache de recursos estáticos.
- APIs com instrução noindex; URLs antigas de compartilhamento respondem 410; páginas inexistentes permanecem 404.

Core Web Vitals de usuários reais e métricas do PageSpeed após publicação ainda precisam ser medidos. Compilação e inspeção local não equivalem a uma medição de LCP, INP ou CLS em produção.

## Validação realizada

- Build de produção Next.js e verificação TypeScript aprovados.
- 187 arquivos TS/TSX com sintaxe e imports locais verificados.
- 12 testes de SEO/integrações, incluindo autenticação de master, rejeição de identificadores inválidos, consentimento e eventos.
- Teste de 550 downloads bem-sucedidos para membro ativo, sem cota diária; contas sem sessão e demo continuam recebendo as respostas de autorização esperadas.
- Teste de backup com 8.200 artes, sem corte em 6.000.
- Teste de substituição de categoria e de remoção de compartilhamento.
- Testes existentes de busca, upload de 15 MB, analytics interno e regressão da biblioteca aprovados.
- Conferência HTTP das 10 páginas e de sitemap XML com vídeo, robots, arquivos IA, respostas 401/404/410, noindex e redirecionamentos de domínio.

Não foi executado seed, db push, migração ou alteração no banco de produção. As tabelas históricas do compartilhamento e dos antigos limites podem permanecer sem uso; não é preciso apagá-las para publicar.

## Pendências externas

1. Publicar o pacote no projeto Vercel da conta correta, informado pelo usuário como diferente da conexão disponível.
2. Autenticar a conta Google, confirmar a propriedade do domínio e enviar o sitemap depois que as URLs corrigidas estiverem online.
3. Informar ID real do Meta Pixel e, se usados, GA4/GTM e tokens de verificação no painel.
4. Revisar as URLs do site anterior no Search Console e mapear redirecionamentos equivalentes, preservando o histórico da propriedade.
5. Monitorar consultas, páginas indexadas e conversões; criar conteúdo original e parcerias relevantes a partir dos dados reais. Não criar backlinks artificiais.

O pacote implementa a base técnica. A publicação, a verificação da conta, a indexação e o posicionamento nos resultados são etapas distintas.

## Referências oficiais consultadas

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- https://support.google.com/webmasters/answer/9008080?hl=pt-BR
- https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes
