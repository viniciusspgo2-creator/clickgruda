# Click & Gruda — página inicial atualizada

Entrega de 30 de outubro de 2026. Projeto completo com nova hero, seção do Studio Mockup 3D e revisão da copy.

## Como aplicar

1. Extraia a pasta `clickgruda-main` deste ZIP.
2. Atualize os arquivos do seu repositório com o conteúdo da pasta. Preserve o seu `.env` e a pasta `.git`.
3. Faça o deploy habitual na Vercel. O comando de produção continua sendo `npm run build`.

Esta atualização não exige migração, alteração de tabelas ou reconfiguração de pagamentos. As variáveis e os dados do ambiente de produção continuam necessários para login, demonstração e catálogo.

## O que foi entregue

- Hero panorâmica, de uma borda à outra, com o mascote segurando a arte fornecida, à direita, em um estúdio de sublimação preto e laranja.
- Área esquerda escura, texto em HTML e botões reais sobre a composição. A ilustração não contém títulos nem botões desenhados.
- No celular, título, mascote completo e descrição aparecem em sequência; o botão de acesso continua disponível na barra inferior.
- Imagens WebP próprias para desktop e celular, com aproximadamente 195 KB e 161 KB. O navegador escolhe uma delas usando `picture`.
- Nova seção `#studio-mockup`, com o endereço `https://clickmockup.vercel.app/`, abertura em nova aba e orientação para assinantes solicitarem o código.
- Link do Studio no menu e no rodapé. As novas chamadas usam os eventos de analytics existentes.
- Exemplos reais do acervo aparecem antes da explicação mais longa. O vídeo existente permanece disponível.
- Copy revisada na abertura, nos benefícios, na explicação de uso, na oferta, nas dúvidas e no fechamento.

## Diagnóstico da copy anterior

**Minha avaliação: mediana como peça de persuasão, com uma base informativa boa.** É uma análise qualitativa da página enviada, não uma nota derivada de vendas ou de um experimento.

O público estava identificado e os recursos eram compreensíveis. A página já tinha argumentos relevantes: curadoria, busca, temas sazonais, novidades e apresentação em 3D. Também oferecia demonstração e FAQ, dois caminhos úteis para esclarecer a compra de um produto digital.

O principal problema estava na hierarquia. O título tentava conduzir o visitante pela escolha da arte, pelo mockup e pela impressão em uma única frase. Isso aumentava o esforço de leitura antes de estabelecer o valor da biblioteca. O quadro com o mascote isolado ocupava espaço, mas comunicava pouco sobre o contexto de sublimação.

Ao longo da página, curadoria, organização e praticidade reapareciam em blocos parecidos. A vitrine concreta das artes surgia depois de uma explicação extensa. O Studio era mencionado várias vezes, mas faltava uma seção simples com o endereço atual e um próximo passo inequívoco.

| Critério | Achado na página enviada | Alteração aplicada |
| --- | --- | --- |
| Clareza inicial | Título longo, reunindo três etapas do trabalho | Título curto, identificação explícita da biblioteca e descrição objetiva |
| Relevância para o público | Público correto, mas benefício diluído entre recursos | Linguagem ligada ao tema solicitado pelo cliente e ao próximo pedido |
| Demonstração de valor | Mais explicação antes de exemplos concretos | Vitrine real do acervo antecipada |
| Diferenciação | Curadoria e organização citadas repetidamente | Ênfase em como busca, categorias e lançamentos ajudam na rotina |
| Decisão de compra | Chamadas variadas e oferta afastada da abertura | Uma ação principal para acesso, com demonstração como alternativa secundária |
| Studio 3D | Recurso citado, sem o novo destino na home | Seção específica, botão externo e orientação sobre o código |
| Expectativa de uso | FAQ tratava dimensões e impressão como universais | Orientação para conferir área útil, arquivo e ajustes do equipamento |
| Exclusividade | Resposta remetia a uma comparação que deixaria de existir | Resposta direta sobre o acervo compartilhado |

## Raciocínio por trás da nova mensagem

O título passou a ser **“Seu próximo pedido começa com a arte certa.”** A frase aproxima a biblioteca da situação de uso do sublimador. O texto logo abaixo explica o produto: artes para sublimação selecionadas e organizadas por tema, com arquivo para download. O conjunto dá contexto ao título e evita depender apenas de uma frase de efeito.

Os benefícios iniciais são curtos para facilitar a leitura rápida. A vitrine mostra o tipo de arte disponível, enquanto as seções seguintes explicam busca, categorias, sazonalidade e uso do Studio. O fluxo de três passos foi reorganizado para encontrar a arte, apresentar a ideia em 3D e preparar a produção.

A oferta continua vinculada aos dados e às condições já existentes no sistema. Quando o catálogo confirma o preço e a campanha vitalícia está ativa, a hero mostra o valor, o pagamento único e a ausência de mensalidade nessa oferta. Se não houver confirmação, a página evita apresentar esse preço como confirmado. A quantidade de artes também vem do catálogo; não foi substituída por uma quantidade fixa retirada de materiais anteriores.

A demonstração é identificada como uma forma de conhecer a biblioteca antes da compra. O texto sobre ativação explica que, no atendimento manual, a equipe confirma a liberação. Isso ajuda o visitante a entender o que acontece depois do cadastro.

Não foram acrescentados depoimentos, avaliações, números de compradores, ganhos prometidos ou contadores de urgência. A data de campanha já existente no projeto foi preservada.

## Pesquisa utilizada

Foram consultadas publicações das próprias organizações abaixo. Elas orientam a análise; não provam que uma redação específica aumentará a conversão desta biblioteca.

1. [Nielsen Norman Group — Homepage Design: 5 Fundamental Principles](https://www.nngroup.com/articles/homepage-design-principles/). Fundamentou a identificação rápida do que o site oferece, a leitura fácil e a exposição de exemplos. Aplicação: abertura mais curta e vitrine antecipada.
2. [CXL — Conversion Research](https://cxl.com/conversion-optimization/conversion-research/). Fundamentou a revisão por relevância, clareza, valor, atrito e distração. A própria abordagem distingue achados qualitativos de hipóteses confirmadas. Aplicação: diagnóstico organizado e sem promessa de aumento de vendas.
3. [Shopify — Ecommerce Landing Page: Design, Tips & Examples](https://www.shopify.com/blog/ecommerce-landing-page). Fundamentou a hierarquia de uma oferta, o destaque de benefícios, a apresentação visual, a clareza de preço e as respostas a objeções. Aplicação: CTA principal consistente e oferta explicada.
4. [Unbounce — Conversion Benchmark Report](https://unbounce.com/conversion-benchmark-report/). A discussão sobre legibilidade e experiência móvel reforçou a necessidade de texto escaneável e revisão em telas pequenas. Não foram usados benchmarks de outros setores como meta ou previsão para a Click & Gruda.

Consulta realizada em 30/10/2026.

## Como avaliar o resultado depois do deploy

O ganho de clareza pode ser avaliado na leitura da página. O efeito comercial precisa ser medido com visitantes reais. Os eventos existentes permitem acompanhar o clique principal, a demonstração, o Studio e a profundidade de navegação.

Observe a proporção entre visitas, cliques de acesso, cadastros e compras confirmadas, separando celular e desktop e considerando a origem do tráfego. Compare períodos equivalentes e evite atribuir uma mudança de vendas à copy quando também houver mudança de campanha, público ou oferta.

## Arquivos principais

- `src/components/views/LandingView.tsx`: composição da home, copy, navegação e seção do Studio.
- `src/components/landing/sales-content.ts`: conteúdo da hero, endereço do Studio e passos de uso.
- `src/app/globals.css`: estilos da hero e da seção do Studio, com regras responsivas isoladas.
- `src/components/AppShell.tsx`: reconhecimento dos links diretos para Studio e vídeo.
- `src/lib/knowledge.ts`: respostas revisadas do FAQ, compartilhadas com os dados estruturados.
- `public/uploads/rebrand/hero-studio-mascote-v2.webp`: imagem de desktop.
- `public/uploads/rebrand/hero-studio-mascote-mobile-v2.webp`: enquadramento para celular.
- `design/hero-studio-mascote-original.png`: imagem original gerada, 1774 × 887 pixels.
- `design/PROMPT-HERO.txt`: prompt utilizado na geração integrada de imagem.

## Limites da verificação

A revisão visual utiliza o projeto local. O ZIP não contém as credenciais do banco de produção; catálogo, login, demonstração e pagamentos reais dependem do ambiente configurado da plataforma. Nenhuma compra real foi feita e esta entrega não representa publicação em produção.

Os resultados finais dos comandos e das verificações estão registrados em `VALIDACAO-HOME-30-10-2026.md`.
