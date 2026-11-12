/**
 * BLOG — 8 artigos estratégicos de SEO (topic cluster do nicho).
 *
 * Estratégia de palavras-chave (busca orgânica BR):
 *  1. artes para sublimação de canecas (head term)
 *  2. quanto custa sublimar canecas (intenção comercial/investigação)
 *  3. prensa de canecas (comercial)
 *  4. onde encontrar artes para sublimação (BOFU — money keyword)
 *  5. como sublimar canecas passo a passo (tutorial/HowTo)
 *  6. datas comemorativas para vender canecas (sazonal/tráfego recorrente)
 *  7. tendências de artes para canecas 2026 (tendências)
 *  8. macetes de sublimação de canecas (dicas práticas)
 *
 * Cada artigo alimenta: rotas SSG /blog/[slug], sitemap, JSON-LD
 * (BlogPosting + FAQPage + BreadcrumbList), linkagem interna com a
 * landing (âncoras) e entre artigos (cluster).
 */

export type BlogBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string; id?: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; caption: string; head: string[]; rows: string[][] }
  | { type: 'callout'; title: string; text: string }
  | { type: 'quote'; text: string }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'cta'; text: string; label: string; href: string }

export type BlogArticle = {
  slug: string
  title: string
  seoTitle: string
  description: string
  keywords: string[]
  category: string
  emoji: string
  cover: string
  coverAlt: string
  readTime: string
  datePublished: string
  dateModified: string
  lead: string
  blocks: BlogBlock[]
  related: string[]
}

export const BLOG_CATEGORY_LABELS: Record<string, string> = {
  guias: 'Guia Definitivo',
  negocios: 'Negócios & Vendas',
  equipamentos: 'Equipamentos',
  artes: 'Artes & Design',
  sazonal: 'Sazonalidade',
  dicas: 'Dicas & Macetes',
  tendencias: 'Tendências',
  novidades: 'Novidades',
}

const AUTHOR_NOTE =
  'Artigo produzido pela Equipe Editorial Click & Gruda e revisado tecnicamente pela Equipe de Produção, com base nos manuais dos fabricantes de prensas e nas boas práticas do mercado de sublimação brasileiro.'

/* ============================================================
 * ARTIGO 1 — head term: "artes para sublimação de canecas"
 * ============================================================ */
const ART1: BlogArticle = {
  slug: 'artes-para-sublimacao-de-canecas-guia',
  title: 'Artes para sublimação de canecas: o guia definitivo',
  seoTitle: 'Artes para Sublimação de Canecas: Guia Definitivo (2026)',
  description:
    'Como escolher artes para sublimação de canecas que vendem: resolução, medida 21×9,5 cm, estilos que mais giram estoque e erros que estragam a prensa.',
  keywords: [
    'artes para sublimação de canecas',
    'arte para caneca',
    'arquivo para sublimação',
    'medida arte caneca',
    'resolução arte sublimação',
  ],
  category: 'artes',
  emoji: '🎨',
  cover: '/uploads/hero-mug.png',
  coverAlt: 'Canecas sublimadas com artes digitais coloridas de alta resolução',
  readTime: '8 min',
  datePublished: '2026-09-28',
  dateModified: '2026-10-02',
  lead:
    'Arte boa para sublimação de canecas precisa de três coisas: medida certa (21 × 9,5 cm), resolução alta o suficiente para não borrar e um estilo que o seu público realmente compra. Este guia cobre os três — e os erros que mais estragam produção no Brasil.',
  blocks: [
    { type: 'h2', text: 'O que torna uma arte "boa" para sublimação de canecas?', id: 'o-que-e-arte-boa' },
    {
      type: 'p',
      text: 'Uma arte de caneca é boa quando ela sai da prensa igual ao que aparece na tela. Isso depende de fatores objetivos: o arquivo precisa ter a área de estampa completa (o cobre-caneca, geralmente 21 × 9,5 cm), resolução compatível com o tamanho impresso e elementos importantes longe das emendas e da alça (a margem de segurança). Artes baixadas de redes sociais quase sempre falham nesses três pontos: vêm pequenas, comprimidas e com elementos cortados pela dobra do papel.',
    },
    {
      type: 'ul',
      items: [
        'Medida: a arte deve cobrir a circunferência da caneca — o padrão de mercado para canecas de porcelana de 325 ml é 21 × 9,5 cm.',
        'Resolução: quanto mais pontos por polegada (DPI) em relação ao tamanho físico, mais nítida a estampa. Imagens esticadas perdem definição.',
        'Margem de segurança: rostos, textos e logotipos não devem encostar na emenda da estampa nem na área da alça.',
        'Espelhamento: a impressão no papel sublimático deve ser espelhada — a transferência inverte a imagem para a posição final correta.',
      ],
    },
    { type: 'h2', text: 'Os estilos de arte que mais vendem em canecas', id: 'estilos-que-vendem' },
    {
      type: 'p',
      text: 'Nem todo estilo bonito vende. O varejo de canecas personalizadas gira em torno de identidade: o cliente compra a caneca que diz quem ele é (profissão, fé, humor, ou a relação com outra pessoa). A tabela abaixo resume os estilos de maior rotação no mercado brasileiro:',
    },
    {
      type: 'table',
      caption: 'Estilos de arte para canecas mais vendidos no Brasil',
      head: ['Estilo', 'Público típico', 'Quando mais vende', 'Exemplo de aplicação'],
      rows: [
        ['Flork (memes)', 'Casais, amizades, humor', 'Ano inteiro, picos em Namorados', 'Frases de casal e amizade'],
        ['Profissões', 'Presente corporativo e reconhecimento', 'Datas de valorização profissional', 'Enfermagem, professores, caminhoneiros'],
        ['Religião / fé', 'Público cristão e católico', 'Ano inteiro, picos em Páscoa e Natal', 'Versículos e mensagens de fé'],
        ['Frases de café', 'Presente do dia a dia', 'Ano inteiro', 'Humor matinal e rotina do café'],
        ['Pets', 'Tutores de cães e gatos', 'Ano inteiro', 'Ilustrações de animais'],
        ['Sazonais', 'Todo o varejo', 'Calendário comemorativo', 'Natal, Dia das Mães, Namorados'],
      ],
    },
    {
      type: 'callout',
      title: 'Dica de mix de estoque',
      text: 'Sublimadores experientes trabalham com base + sazonal: 70% de artes de giro constante (flork, profissões, frases) e 30% de artes da data comemorativa seguinte. A aba Sazonal da Click & Gruda automatiza essa regra — mostra a próxima data e separa as artes prontas.',
    },
    { type: 'h2', text: 'Onde encontrar artes prontas com qualidade de prensa', id: 'onde-encontrar' },
    {
      type: 'p',
      text: 'Existem quatro caminhos para obter artes: comprar avulso em bancos de imagem, contratar freelancer, gerar por IA (e retratar manualmente) ou assinar uma plataforma especializada. A compra avulsa custa entre R$ 10 e R$ 30 por arquivo — em poucos meses, quem produz em volume gasta mais do que um acesso completo. A Click & Gruda resolve isso com acesso vitalício por pagamento único de R$ 47,90: todas as artes, incluindo lançamentos frequentes, já no formato 21 × 9,5 cm e prontas para produzir e vender canecas.',
    },
    {
      type: 'p',
      text: 'Se você quer comparar os quatro caminhos em detalhe (custo, prazo, licença e exclusividade), leia o artigo sobre onde encontrar artes para sublimação. Para os fundamentos do processo físico, veja o guia de sublimação de canecas para iniciantes.',
    },
    { type: 'h2', text: 'Erros que estragam a sublimação (e como a arte evita)', id: 'erros' },
    {
      type: 'ol',
      items: [
        'Imprimir a arte sem espelhar — o texto sai invertido na caneca.',
        'Esticar uma imagem pequena para caber na caneca — o resultado sai borrado.',
        'Deixar elementos importantes na emenda — a dobra do papel "come" parte do design.',
        'Usar arte baixada de rede social — comprimida por upload, perde resolução.',
        'Esquecer o teste de prensagem — cores em RGB variam levemente na impressão; calibre com uma caneca-teste antes de produções grandes.',
      ],
    },
    {
      type: 'quote',
      text: 'Regra de ouro do setor: a arte certa na medida certa economiza caneca, papel e tempo. Retrabalho é o custo invisível que mais mata margem no negócio de canecas.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Qual a medida exata da arte para caneca de sublimação?',
          a: 'O padrão do mercado brasileiro para canecas de porcelana de 325 ml é a área de estampa de 21 × 9,5 cm (o cobre-caneca). Todas as artes da Click & Gruda são entregues nesse formato.',
        },
        {
          q: 'Posso usar qualquer imagem da internet para sublimar?',
          a: 'Não. Além da questão de direitos autorais, imagens de redes sociais vêm comprimidas e com resolução insuficiente, o que borra a estampa. Use artes próprias para sublimação, com uso comercial claro.',
        },
        {
          q: 'PNG ou JPG: qual formato é melhor para sublimação?',
          a: 'PNG é o formato mais usado porque preserva a nitidez e aceita fundo transparente. O essencial, porém, é a resolução adequada para o tamanho impresso — formato não compensa imagem pequena.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'Quer acervo pronto na medida certa, com lançamentos frequentes?',
      label: 'Ver o acervo da Click & Gruda',
      href: '/#preco',
    },
  ],
  related: ['onde-encontrar-artes-para-sublimacao', 'como-sublimar-canecas-passo-a-passo', 'quanto-custa-sublimar-canecas'],
}

/* ============================================================
 * ARTIGO 2 — intenção comercial: "quanto custa sublimar canecas"
 * ============================================================ */
const ART2: BlogArticle = {
  slug: 'quanto-custa-sublimar-canecas',
  title: 'Quanto custa começar a sublimar canecas em 2026?',
  seoTitle: 'Quanto Custa Sublimar Canecas em 2026? Investimento Inicial Real',
  description:
    'Investimento inicial para sublimar canecas em 2026: prensa, impressora, insumos e artes — tabela com faixas de preço e simulação de margem por caneca.',
  keywords: [
    'quanto custa sublimar canecas',
    'investimento inicial sublimação',
    'equipamentos para sublimação preço',
    'começar a sublimar canecas',
    'quanto custa prensa de canecas',
  ],
  category: 'negocios',
  emoji: '💰',
  cover: '/uploads/art-frase-cafe.png',
  coverAlt: 'Caneca sublimada com arte de frase sobre café',
  readTime: '7 min',
  datePublished: '2026-09-21',
  dateModified: '2026-10-02',
  lead:
    'Para começar a sublimar canecas no Brasil, o investimento inicial típico fica entre R$ 2.000 e R$ 5.500 (prensa + impressora com tinta sublimática + primeiros insumos). A boa notícia: o custo variável por caneca produzida é baixo — e a arte não precisa ser um custo recorrente.',
  blocks: [
    { type: 'h2', text: 'Investimento inicial: os 5 itens obrigatórios', id: 'investimento-inicial' },
    {
      type: 'p',
      text: 'Os valores abaixo são faixas de referência do mercado brasileiro em 2026 e variam por região, marca e fornecedor. Use como planejamento, não como orçamento fechado — sempre confirme os preços com os fornecedores da sua região.',
    },
    {
      type: 'table',
      caption: 'Investimento inicial para sublimação de canecas (faixas de referência — 2026)',
      head: ['Item', 'Faixa de preço', 'Observações'],
      rows: [
        ['Prensa de canecas', 'R$ 700 a R$ 3.000+', 'Manual é o mais barato; automática acelera produção'],
        ['Impressora compatível com tinta sublimática', 'R$ 1.100 a R$ 2.500', 'Modelos eco-tanque convertidos ou próprios para sublimação'],
        ['Kit de tinta sublimática', 'R$ 80 a R$ 200', 'Rende centenas de impressões'],
        ['Papel sublimático (100 folhas A4)', 'R$ 30 a R$ 90', 'Cada folha rende 1 cobre-caneca'],
        ['Canecas de porcelana para sublimação (caixa c/ 36 un.)', 'R$ 250 a R$ 500', 'Padrão 325 ml com revestimento'],
      ],
    },
    {
      type: 'callout',
      title: 'Item 6 — a arte',
      text: 'Aqui está o erro clássico: comprar arte por arte a R$ 10–30 e transformar insumo em custo fixo. Com acesso vitalício de R$ 47,90 (pagamento único da Click & Gruda), o custo de arte por caneca tende a zero a partir da segunda peça produzida.',
    },
    { type: 'h2', text: 'Custo por caneca: a conta que define sua margem', id: 'custo-por-caneca' },
    {
      type: 'p',
      text: 'Com o parque instalado, cada caneca tem custo variável pequeno: caneca + papel + tinta + energia. A arte, se você escolher o modelo de acesso vitalício, deixa de ser custo variável e vira investimento fixo único. Em produção caseira, é comum o custo variável por peça ficar entre R$ 10 e R$ 20, com preço de venda entre R$ 25 e R$ 45 — a margem depende do seu posicionamento e canal (marketplace, Instagram, loja física).',
    },
    {
      type: 'table',
      caption: 'Simulação ilustrativa de margem por caneca',
      head: ['Cenário', 'Custo por peça', 'Preço de venda', 'Efeito na margem'],
      rows: [
        ['Arte comprada avulsa (R$ 20 por arte)', 'R$ 30–40', 'R$ 35', 'Margem apertada — a arte consome a margem das primeiras peças'],
        ['Arte por acesso vitalício (R$ 47,90 único)', 'R$ 10–20', 'R$ 35', 'Margem saudável já nas primeiras peças'],
      ],
    },
    {
      type: 'p',
      text: 'O ponto estratégico: quando a arte é paga uma vez, cada caneca adicional vende com margem cheia. É por isso que plataformas de acesso vitalício fazem sentido para quem produz em volume — e é por isso que o modelo da Click & Gruda existe.',
    },
    { type: 'h2', text: 'Como reduzir o custo de entrada sem sacrificar qualidade', id: 'reduzir-custo' },
    {
      type: 'ul',
      items: [
        'Comece com prensa manual: menos produtividade, mas suficiente para validar vendas nos finais de semana.',
        'Compre canecas em caixa fechada (36 un.) direto de distribuidores de insumos da sua região.',
        'Faça canecas-teste antes de produções grandes: evita desperdício de insumos com parâmetros errados.',
        'Use um acervo de artes vitalício em vez de comprar arte por arte — o R$ 47,90 único substitui dezenas de compras avulsas.',
        'Reaproveite papel: ajuste o layout de impressão para aproveitar sobras de folha em artes menores (laços, chaveiros).',
      ],
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Consigo começar sublimando canecas com menos de R$ 2.000?',
          a: 'É possível nas margens inferiores das faixas (prensa manual básica + impressora convertida + insumos mínimos), mas com pouco estoque e sem folga para retrabalho. O planejamento seguro começa na faixa de R$ 2.000 a R$ 5.500.',
        },
        {
          q: 'A arte precisa entrar no custo de cada caneca?',
          a: 'Não necessariamente. Se você usar um modelo de acesso vitalício (como a Click & Gruda, R$ 47,90 pagamento único), a arte é um investimento fixo e cada caneca adicional sai só com insumos.',
        },
        {
          q: 'Quanto posso cobrar em uma caneca sublimada?',
          a: 'Depende do seu mercado e canal, mas o varejo brasileiro costuma praticar entre R$ 25 e R$ 45 por caneca personalizada simples, com preço maior para personalização com nome ou foto.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'Trave seu custo de arte em R$ 47,90 único — para sempre.',
      label: 'Liberar acesso vitalício',
      href: '/#preco',
    },
  ],
  related: ['prensa-de-canecas-como-escolher', 'onde-encontrar-artes-para-sublimacao', 'como-sublimar-canecas-passo-a-passo'],
}

/* ============================================================
 * ARTIGO 3 — comercial: "prensa de canecas"
 * ============================================================ */
const ART3: BlogArticle = {
  slug: 'prensa-de-canecas-como-escolher',
  title: 'Prensa de canecas: manual, semiautomática ou automática?',
  seoTitle: 'Prensa de Canecas: Manual, Semiautomática ou Automática? Como Escolher',
  description:
    'Como escolher a prensa de canecas ideal: comparação entre manual, semiautomática e automática, parâmetros de temperatura e tempo e erros de compra.',
  keywords: [
    'prensa de canecas',
    'prensa térmica canecas',
    'prensa manual ou automática',
    'melhor prensa de canecas',
    'temperatura prensa de canecas',
  ],
  category: 'equipamentos',
  emoji: '⚙️',
  cover: '/uploads/hero-press.png',
  coverAlt: 'Prensa térmica de canecas em funcionamento na produção de sublimação',
  readTime: '6 min',
  datePublished: '2026-09-14',
  dateModified: '2026-10-02',
  lead:
    'A prensa de canecas certa é a que combina com seu volume de produção: manual para começar e validar, semiautomática para crescer, automática para produzir em escala. O parâmetro que nunca muda: temperatura e tempo calibrados por teste — as faixas de referência do mercado para canecas ficam em torno de 170 °C a 200 °C.',
  blocks: [
    { type: 'h2', text: 'Os três tipos de prensa (e para que serve cada um)', id: 'tipos-de-prensa' },
    {
      type: 'table',
      caption: 'Comparativo entre prensas de canecas',
      head: ['Tipo', 'Perfil ideal', 'Vantagens', 'Limitações'],
      rows: [
        ['Manual', 'Iniciantes e validação de negócio', 'Preço mais baixo; simples de operar', 'Produção menor; depende do operador'],
        ['Semiautomática', 'Produção crescente (dezenas por dia)', 'Repetibilidade melhor; tempo controlado pelo timer', 'Custo intermediário'],
        ['Automática', 'Escala (centenas por dia)', 'Alta produtividade; consistência entre peças', 'Investimento alto; ocupa mais espaço'],
      ],
    },
    {
      type: 'p',
      text: 'Para quem está começando, a prensa manual atende perfeitamente: valida vendas sem travar capital em equipamento. O upgrade para semiautomática ou automática faz sentido quando o gargalo passa a ser tempo de prensagem, não demanda.',
    },
    { type: 'h2', text: 'Parâmetros de prensagem: temperatura, tempo e pressão', id: 'parametros' },
    {
      type: 'p',
      text: 'Cada combinação de prensa, tinta, papel e caneca tem o ponto ideal próprio. As faixas de referência do mercado para canecas de porcelana ficam em torno de 170 °C a 200 °C e de 40 a 210 segundos. O manual do fabricante da sua prensa é a referência inicial; o ajuste fino vem do teste — prensar uma caneca-teste com a arte da sua escolha e avaliar cores, nitidez e emenda.',
    },
    {
      type: 'ul',
      items: [
        'Pressão firme e uniforme: papel frouxo gera falhas e manchas.',
        'Papel esticado e fixado com fita térmica: dobras na estampa aparecem como linhas claras.',
        'Umidade: canecas e papel guardados em ambiente úmido produzem vapor e cores lavadas — armazene em local seco.',
        'Pós-prensagem: retire o papel em movimento único após alguns segundos de resfriamento para evitar marcas.',
      ],
    },
    {
      type: 'callout',
      title: 'Compatibilidade de arte',
      text: 'Qualquer prensa que use o padrão de canecas de 325 ml aceita artes no formato 21 × 9,5 cm — o padrão de entrega do acervo da Click & Gruda. Isso vale para prensas manuais, semiautomáticas e automáticas.',
    },
    { type: 'h2', text: 'Erros de compra que você deve evitar', id: 'erros-de-compra' },
    {
      type: 'ol',
      items: [
        'Comprar prensa sem confirmar o diâmetro do cilindro para canecas de 325 ml.',
        'Escolher apenas pelo preço e ignorar a assistência técnica na sua região.',
        'Comprar prensa maior "para o futuro" antes de validar demanda — capital parado é custo.',
        'Ignorar a voltagem e a potência do circuito elétrico do seu espaço de produção.',
        'Não verificar se a prensa aceita cilindros para outros volumes (copos, garrafas) se você quer expandir depois.',
      ],
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Qual temperatura e tempo para sublimar canecas?',
          a: 'As faixas de referência do mercado para canecas de porcelana ficam em torno de 170 °C a 200 °C e de 40 a 210 segundos, conforme prensa, tinta e papel. Use o manual do seu equipamento como ponto de partida e calibre com canecas-teste.',
        },
        {
          q: 'A prensa manual serve para começar um negócio?',
          a: 'Sim. A prensa manual é a porta de entrada mais econômica e atende à validação de vendas e à produção de dezenas de peças por dia. O upgrade vem quando o gargalo é tempo, não demanda.',
        },
        {
          q: 'As artes da Click & Gruda funcionam em qualquer prensa?',
          a: 'Sim. Como vêm no formato 21 × 9,5 cm (medida das canecas de 325 ml), funcionam em prensas manuais, semiautomáticas e automáticas que usem esse padrão de caneca.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'Já tem a prensa? Falta o acervo que vende.',
      label: 'Ver artes no formato exato',
      href: '/#artes',
    },
  ],
  related: ['quanto-custa-sublimar-canecas', 'como-sublimar-canecas-passo-a-passo', 'artes-para-sublimacao-de-canecas-guia'],
}

/* ============================================================
 * ARTIGO 4 — BOFU money keyword: "onde encontrar artes para sublimação"
 * ============================================================ */
const ART4: BlogArticle = {
  slug: 'onde-encontrar-artes-para-sublimacao',
  title: 'Onde encontrar artes para sublimação: 4 caminhos comparados',
  seoTitle: 'Onde Encontrar Artes para Sublimação: 4 Caminhos Comparados (2026)',
  description:
    'Onde encontrar artes para sublimação de canecas: comparativo honesto entre acesso vitalício, compra avulsa, freelancer e IA generativa — custo, prazo e licença.',
  keywords: [
    'onde encontrar artes para sublimação',
    'comprar artes para canecas',
    'banco de artes sublimação',
    'artes prontas para canecas',
    'melhor site de artes para sublimação',
  ],
  category: 'artes',
  emoji: '🧭',
  cover: '/uploads/art-flork-cafe.png',
  coverAlt: 'Arte estilo flork de café pronta para sublimação de canecas',
  readTime: '7 min',
  datePublished: '2026-09-07',
  dateModified: '2026-10-02',
  lead:
    'Existem quatro caminhos para obter artes de sublimação: acesso vitalício a um acervo especializado, compra avulsa por arte, freelancer sob demanda e IA generativa. Para quem produz canecas em volume, o acesso vitalício é o caminho com melhor custo-benefício; a exclusividade absoluta continua sendo território do freelancer. O comparativo abaixo mostra por quê.',
  blocks: [
    { type: 'h2', text: 'Comparativo: os 4 caminhos para obter artes', id: 'comparativo' },
    {
      type: 'table',
      caption: 'Caminhos para obter artes de sublimação — comparação objetiva',
      head: ['Critério', 'Acesso vitalício (Click & Gruda)', 'Compra avulsa', 'Freelancer', 'IA generativa'],
      rows: [
        ['Custo', 'R$ 47,90 único', 'R$ 10–30 por arte', 'Negociado por projeto', 'Assinatura da ferramenta + horas de curadoria'],
        ['Lançamentos', 'Inclusos sem custo', 'Cobrados à parte', 'Cobrados por pedido', 'Você cria do zero'],
        ['Formato', '21 × 9,5 cm (medida exata)', 'Varia por site', 'Depende do briefing', 'Requer retrabalho para a medida'],
        ['Prazo', 'Imediato', 'Imediato', 'Dias', 'Minutos, mas com ajustes'],
        ['Licença comercial', 'Liberada para sublimadores', 'Depende do site', 'Conforme contrato', 'Depende dos termos da ferramenta'],
        ['Exclusividade', 'Acervo compartilhado', 'Acervo compartilhado', 'Exclusiva', 'Semi-exclusiva (outros usuários geram similares)'],
      ],
    },
    {
      type: 'callout',
      title: 'Resposta direta',
      text: 'Se você produz canecas em volume e quer custo previsível, o acesso vitalício vence: a partir da segunda ou terceira arte, os R$ 47,90 únicos já se pagam. Se você precisa de uma arte 100% exclusiva e autoral, contrate um freelancer — é o único caminho que garante exclusividade de verdade.',
    },
    { type: 'h2', text: 'Por que a medida 21 × 9,5 cm economiza seu tempo', id: 'medida' },
    {
      type: 'p',
      text: 'Artes avulsas vêm em medidas variadas — e é você quem ajusta, testa e corta. Artes já entregues no cobre-caneca de 21 × 9,5 cm eliminam essa etapa: imprime espelhado, prensar, pronto. Em um dia de produção de 30 canecas, são 30 ajustes a menos (e 30 chances a menos de esticar imagem e borrar a estampa).',
    },
    { type: 'h2', text: 'O que olhar antes de comprar em qualquer fonte', id: 'checklist' },
    {
      type: 'ul',
      items: [
        'Resolução real do arquivo (não confie na pré-visualização em miniatura).',
        'Licença de uso comercial explícita — venda de canecas é uso comercial.',
        'Margem de segurança respeitada (elementos longe da emenda e da alça).',
        'Política de re-download: perdeu o arquivo, consegue baixar de novo?',
        'Frequência de novidades: acervo vivo acompanha datas comemorativas e tendências.',
      ],
    },
    {
      type: 'p',
      text: 'A Click & Gruda marca em todos esses critérios: acervo organizado por categorias e tags, download ilimitado (inclusive para recuperar arquivos perdidos), lançamentos frequentes inclusos e artes para produzir e vender por um pagamento único de R$ 47,90. Veja as artes do acervo e o comparativo completo na página principal.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Qual o melhor lugar para comprar artes para sublimação?',
          a: 'Depende do seu volume. Para produção contínua de canecas, plataformas de acesso vitalício (como a Click & Gruda, R$ 47,90 pagamento único) têm o melhor custo-benefício. Para uma arte única e exclusiva, freelancer.',
        },
        {
          q: 'Arte gerada por IA serve para sublimação?',
          a: 'Serve, mas exige trabalho: ajustar para a medida 21 × 9,5 cm, elevar resolução, revisar erros típicos de IA (textos deformados) e confirmar os termos de uso comercial da ferramenta. Curadoria leva tempo.',
        },
        {
          q: 'Comprando arte avulsa, posso vender as canecas?',
          a: 'Depende da licença de cada site onde comprou. Muitos bancos vendem licença comercial à parte. Na Click & Gruda, o uso comercial para sublimadores já vem liberado no acesso.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'Compare na prática: todas as artes, um pagamento único.',
      label: 'Conhecer o acesso vitalício',
      href: '/#preco',
    },
  ],
  related: ['artes-para-sublimacao-de-canecas-guia', 'quanto-custa-sublimar-canecas', 'datas-comemorativas-para-vender-canecas'],
}

/* ============================================================
 * ARTIGO 5 — tutorial: "como sublimar canecas" (HowTo)
 * ============================================================ */
const ART5: BlogArticle = {
  slug: 'como-sublimar-canecas-passo-a-passo',
  title: 'Como sublimar canecas: passo a passo completo (sem erros)',
  seoTitle: 'Como Sublimar Canecas: Passo a Passo Completo + Erros Comuns',
  description:
    'Como sublimar canecas passo a passo: materiais, espelhamento, temperatura e tempo de prensagem, acabamento e os 5 erros que mais estragam a estampa.',
  keywords: [
    'como sublimar canecas',
    'sublimação de canecas passo a passo',
    'como prensar caneca',
    'sublimar caneca pela primeira vez',
    'espelhamento papel sublimático',
  ],
  category: 'guias',
  emoji: '🔥',
  cover: '/uploads/art-relig-fe.png',
  coverAlt: 'Caneca com arte religiosa sublimada com acabamento profissional',
  readTime: '9 min',
  datePublished: '2026-08-31',
  dateModified: '2026-10-02',
  lead:
    'Sublimar uma caneca leva cerca de 20 minutos do primeiro ao último passo: baixar a arte, imprimir espelhado no papel sublimático, prensar na temperatura e tempo do seu equipamento e remover o papel após o resfriamento. O guia abaixo detalha cada etapa — e os erros que mais geram retrabalho.',
  blocks: [
    { type: 'h2', text: 'O que você precisa antes de começar', id: 'materiais' },
    {
      type: 'ul',
      items: [
        'Prensa térmica de canecas (manual, semiautomática ou automática).',
        'Impressora com tinta sublimática.',
        'Papel sublimático.',
        'Caneca de porcelana com revestimento para sublimação (padrão 325 ml).',
        'Arte digital na medida da caneca — o cobre-caneca de 21 × 9,5 cm.',
        'Fita térmica de alta temperatura (para fixar o papel).',
      ],
    },
    { type: 'h2', text: 'Passo a passo da sublimação de canecas', id: 'passo-a-passo' },
    {
      type: 'ol',
      items: [
        'Baixe a arte: escolha a arte no portal e faça o download — na Click & Gruda os arquivos já vêm no formato 21 × 9,5 cm, prontos para imprimir.',
        'Imprima espelhado: configure a impressão invertida (espelhada) em papel sublimático, na maior qualidade da impressora. Sem espelhamento, textos saem invertidos na caneca.',
        'Aqueça a prensa: ajuste temperatura e tempo conforme o manual do seu equipamento — as faixas de referência do mercado para canecas ficam em torno de 170 °C a 200 °C.',
        'Posicione e fixe: envolva a caneca com o papel (arte virada para a caneca), fixe com fita térmica e ajuste a pressão firme e uniforme.',
        'Prensar: inicie a prensagem pelo tempo indicado e não abra a prensa no meio do ciclo.',
        'Acabamento: retire a caneca com cuidado (estará quente), aguarde alguns segundos e remova o papel em movimento único. Confira bordas e emenda.',
      ],
    },
    {
      type: 'callout',
      title: 'Antes da produção em série',
      text: 'Sempre faça uma caneca-teste com a arte que você pretende vender: cores de tela (RGB) variam levemente na impressão e cada prensa tem seu ponto ideal. O teste custa uma caneca; o erro sem teste custa uma caixa.',
    },
    { type: 'h2', text: 'Os 5 erros que mais estragam a estampa', id: 'erros-comuns' },
    {
      type: 'ol',
      items: [
        'Esquecer o espelhamento da impressão — o erro nº 1 de quem começa.',
        'Usar imagem com pouca resolução — sai borrado mesmo com prensagem perfeita.',
        'Papel mal fixado — dobras geram linhas claras na estampa.',
        'Parâmetros aleatórios — temperatura e tempo fora da faixa lavam cores ou queimam o papel.',
        'Papel removido tarde demais — resfriamento completo cola o papel na estampa e marca o acabamento.',
      ],
    },
    {
      type: 'quote',
      text: 'Metade do sucesso da sublimação acontece antes da prensa: arte na medida certa e impressão espelhada de qualidade. A prensa só executa — o padrão do arquivo define o resultado.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Quanto tempo leva para sublimar uma caneca?',
          a: 'Cerca de 20 minutos no total para quem está começando (impressão + prensagem + acabamento). Com fluxo treinado e prensa adequada, o ciclo por caneca encurta bastante — a prensagem em si fica na faixa de segundos a poucos minutos conforme o equipamento.',
        },
        {
          q: 'Preciso espelhar a arte antes de imprimir?',
          a: 'Sim. A transferência térmica inverte a imagem; sem espelhamento, textos e logotipos saem invertidos na caneca. Impressoras configuradas para sublimação costumam ter a opção de espelhamento no driver.',
        },
        {
          q: 'Onde consigo artes já no tamanho certo da caneca?',
          a: 'No acervo da Click & Gruda: todas as artes são entregues no formato 21 × 9,5 cm (cobre-caneca das canecas de 325 ml), com download ilimitado para produzir e vender as suas canecas.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'Baixe sua primeira arte no tamanho exato — e prensar sem medo.',
      label: 'Ver o acervo completo',
      href: '/#artes',
    },
  ],
  related: ['prensa-de-canecas-como-escolher', 'artes-para-sublimacao-de-canecas-guia', 'quanto-custa-sublimar-canecas'],
}

/* ============================================================
 * ARTIGO 6 — sazonal: calendário de datas comemorativas
 * ============================================================ */
const ART6: BlogArticle = {
  slug: 'datas-comemorativas-para-vender-canecas',
  title: 'Datas comemorativas para vender canecas: o calendário do sublimador',
  seoTitle: 'Calendário de Datas Comemorativas para Vender Canecas (2026)',
  description:
    'Calendário de datas comemorativas para vender canecas sublimadas: mês a mês, nichos de cada data e a estratégia de antecedência que aumenta as vendas.',
  keywords: [
    'datas comemorativas para vender canecas',
    'calendário datas comemorativas 2026',
    'canecas dia das mães',
    'vender canecas natal',
    'artes sazonais sublimação',
  ],
  category: 'sazonal',
  emoji: '📅',
  cover: '/uploads/art-sazonal-natal.png',
  coverAlt: 'Caneca sublimada com arte natalina para vendas sazonais',
  readTime: '6 min',
  datePublished: '2026-08-24',
  dateModified: '2026-10-02',
  lead:
    'No varejo de canecas personalizadas, algumas datas concentram uma fatia enorme da demanda anual: Dia das Mães, Namorados, Dia das Crianças, Páscoa e Natal puxam os picos — e quem lança antes da data vende mais. O calendário mês a mês abaixo é o planejamento que separa quem lucra na sazonalidade de quem assiste o concorrente vender.',
  blocks: [
    { type: 'h2', text: 'Calendário sazonal do varejo de canecas (mês a mês)', id: 'calendario' },
    {
      type: 'table',
      caption: 'Datas comemorativas de maior giro para canecas personalizadas',
      head: ['Mês', 'Datas de pico', 'Nichos que mais vendem'],
      rows: [
        ['Janeiro', 'Ano Novo, metas e dieta', 'Humor de recomeço, academia, "café primeiro"'],
        ['Fevereiro', 'Carnaval', 'Humor de folia e folga'],
        ['Março', 'Dia Internacional da Mulher (8/3), Dia do Consumidor (15/3)', 'Homenagens a mulheres, frases de força'],
        ['Abril', 'Páscoa', 'Temas de família, fé e chocolate'],
        ['Maio', 'Dia das Mães (2º domingo)', 'Mães e avós — um dos maiores picos do ano'],
        ['Junho', 'Dia dos Namorados (12/6)', 'Casais, flork, humor romântico'],
        ['Julho', 'Férias de julho, Dia do Amigo (20/7)', 'Viagens, amizades, café'],
        ['Agosto', 'Dia dos Pais (2º domingo)', 'Pais e avós, profissões masculinas'],
        ['Setembro', 'Dia da Secretária (30/9)', 'Presentes para equipes e escritórios'],
        ['Outubro', 'Dia das Crianças (12/10), Dia do Professor (15/10), Halloween (31/10)', 'Professores, infância, humor de terror'],
        ['Novembro', 'Black Friday', 'Ofertas e humor de compras'],
        ['Dezembro', 'Natal (25/12), Ano Novo', 'Família, fé, retrospectiva — maior pico do ano'],
      ],
    },
    {
      type: 'callout',
      title: 'A regra da antecedência',
      text: 'O varejo de presente antecipa a data: quem compra caneca de Dia das Mães começa a procurar de 2 a 3 semanas antes. Lance suas artes sazonais com pelo menos 3 semanas de antecedência e mantenha o estoque de insumos pronto.',
    },
    { type: 'h2', text: 'Como nunca mais perder uma data (sem planilha)', id: 'aba-sazonal' },
    {
      type: 'p',
      text: 'Gerenciar datas manualmente é trabalho para planilha — e é exatamente por isso que a Click & Gruda tem uma aba Sazonal: ela mostra a próxima data comemorativa (com contagem regressiva) e separa as artes daquela data. Você entra no portal, vê o que vem pela frente e baixa as artes prontas — o lançamento sai antes da concorrência.',
    },
    {
      type: 'ul',
      items: [
        'Aba Sazonal com contagem regressiva para a próxima data comemorativa.',
        'Artes da data separadas por evento — sem caçar por tags.',
        'Lançamentos frequentes que já chegam alinhados ao calendário do varejo.',
        'Inclusos no acesso vitalício: R$ 47,90 único, sem custo extra por data.',
      ],
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Com quanta antecedência devo lançar artes sazonais?',
          a: 'Recomendação do mercado: 2 a 3 semanas antes da data. O comprador de presente pesquisa com antecedência, e as plataformas de anúncio precisam de tempo para otimizar com os primeiros cliques.',
        },
        {
          q: 'Quais datas vendem mais canecas no Brasil?',
          a: 'Dia das Mães, Dia dos Namorados, Dia das Crianças, Páscoa e Natal concentram os maiores picos. Datas profissionais (Dia do Professor, Dia dos Pais) geram picos menores, porém consistentes.',
        },
        {
          q: 'Como saber qual é a próxima data comemorativa sem controlar planilha?',
          a: 'A aba Sazonal da Click & Gruda mostra automaticamente a próxima data (com contagem regressiva) e separa as artes do evento — incluída no acesso vitalício.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'A próxima data comemorativa já está no portal — com as artes separadas.',
      label: 'Ver a aba Sazonal',
      href: '/#preco',
    },
  ],
  related: ['artes-para-sublimacao-de-canecas-guia', 'onde-encontrar-artes-para-sublimacao', 'como-sublimar-canecas-passo-a-passo'],
}

/* ============================================================
 * ARTIGO 7 — tendências: o que está vendendo em 2026
 * ============================================================ */
const ART7: BlogArticle = {
  slug: 'tendencias-artes-para-canecas-2026',
  title: 'Tendências de artes para canecas em 2026: o que está vendendo agora',
  seoTitle: 'Tendências de Artes para Canecas em 2026: O Que Está Vendendo',
  description:
    'Tendências de artes para canecas em 2026: os estilos em alta, os nichos que mais giram e como atualizar seu catálogo sem ficar para trás.',
  keywords: [
    'tendências artes para canecas 2026',
    'artes para caneca em alta',
    'o que vende em sublimação',
    'tendências sublimação',
    'estilos de caneca personalizada',
  ],
  category: 'tendencias',
  emoji: '🔥',
  cover: '/uploads/art-flork-cafe.png',
  coverAlt: 'Caneca sublimada com arte de humor em alta nas tendências de 2026',
  readTime: '7 min',
  datePublished: '2026-11-12',
  dateModified: '2026-11-12',
  lead:
    'O mercado de canecas personalizadas muda rápido: o estilo que vendia muito há um ano pode estar saturado hoje, enquanto um nicho novo explode do nada. Este artigo resume as tendências de artes para canecas em 2026 — os estilos em alta, os nichos que mais giram e como atualizar seu catálogo sem gastar com arte que não vende.',
  blocks: [
    { type: 'h2', text: 'As 5 tendências de artes para canecas em 2026', id: 'tendencias-2026' },
    {
      type: 'p',
      text: 'Tendência em sublimação não é achismo: é o que os clientes pedem no balcão e no WhatsApp, semana após semana. Os cinco movimentos abaixo são os que mais aparecem nos pedidos de 2026 — e cada um deles abre um nicho de venda.',
    },
    {
      type: 'table',
      caption: 'Tendências de artes para canecas em 2026',
      head: ['Tendência', 'O que é', 'Quem compra', 'Quando vende mais'],
      rows: [
        ['Humor e memes (Flork)', 'Frases engraçadas e situações do dia a dia', 'Casais, amizades, colegas de trabalho', 'Ano inteiro, pico em Namorados e Dia do Amigo'],
        ['Profissões com identidade', 'Artes que celebram a profissão de quem recebe', 'Presente corporativo e homenagens', 'Datas de valorização profissional'],
        ['Fé e frases de força', 'Versículos, mensagens de fé e gratidão', 'Público cristão e católico', 'Ano inteiro, picos em Páscoa e Natal'],
        ['Pets personalizados', 'Ilustrações de cães e gatos, com ou sem nome', 'Tutores de animais', 'Ano inteiro, pico em datas de presente'],
        ['Minimalista e tipografia', 'Frases curtas, fonte bonita, pouco desenho', 'Público jovem e corporativo', 'Ano inteiro, forte em brindes'],
      ],
    },
    { type: 'h2', text: 'Por que o humor continua dominando', id: 'humor-domina' },
    {
      type: 'p',
      text: 'A caneca de humor é o presente "sem erro": quem compra não precisa conhecer o gosto de quem vai receber em detalhe — uma frase engraçada sobre café, segunda-feira ou casal funciona para quase todo mundo. É o estilo com maior giro e menor risco de encalhe, por isso é a base do catálogo de quem vende volume. O segredo é renovar as frases: o meme do ano passado já foi visto, o deste ano ainda é novidade.',
    },
    {
      type: 'callout',
      title: 'Como não ficar para trás',
      text: 'Separe 30% do seu catálogo para renovação: a cada mês, troque as artes que menos giraram por lançamentos do estilo em alta. A Click & Gruda lança artes novas com frequência — quem acompanha os lançamentos vende a tendência antes de ela saturar.',
    },
    { type: 'h2', text: 'Nichos que estão crescendo em 2026', id: 'nichos-crescendo' },
    {
      type: 'ul',
      items: [
        'Canecas para profissões de saúde e educação: enfermagem, professores e cuidadores compram (e ganham) muito — e o presente costuma ser em grupo, ou seja, várias unidades por pedido.',
        'Canecas de fé com versículos: público fiel, compra recorrente e pouco sensível a preço — a mensagem importa mais que o desconto.',
        'Brindes corporativos com logo: empresas pedem lotes com a marca. Uma arte minimalista com o logotipo do cliente vira pedido de dezenas de unidades.',
        'Canecas de pets com nome: personalização com o nome do animal aumenta o valor percebido e o preço que o cliente aceita pagar.',
      ],
    },
    { type: 'h2', text: 'Como atualizar seu catálogo sem desperdício', id: 'atualizar-catalogo' },
    {
      type: 'p',
      text: 'A regra é simples: não compre (nem baixe) tudo de uma vez. Acompanhe o que gira no seu balcão por 30 dias, identifique os 3 estilos que mais venderam e reforce eles; os que não giraram, substitua por lançamentos da tendência. Biblioteca organizada por tema e data ajuda nisso: você vê o que é novidade e o que é sazonal sem caçar arquivo por arquivo.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Qual estilo de arte para caneca mais vende em 2026?',
          a: 'Humor e memes (Flork) continuam com o maior giro no varejo, seguidos por profissões e fé. O segredo é o mix: humor como base de volume e nichos (profissões, fé, pets) como margem.',
        },
        {
          q: 'Com que frequência devo renovar as artes do meu catálogo?',
          a: 'A cada mês, renove cerca de 30% das artes — troque as que menos giraram por lançamentos da tendência. Em datas comemorativas, antecipe 3 semanas.',
        },
        {
          q: 'Vale a pena investir em arte minimalista e tipografia?',
          a: 'Sim, principalmente para brindes corporativos e público jovem. São artes rápidas de produzir, com pouco risco de erro de impressão e boa aceitação em lotes.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'As artes das tendências de 2026 já estão no portal — com lançamentos frequentes.',
      label: 'Ver as artes em alta',
      href: '/#preco',
    },
  ],
  related: ['artes-para-sublimacao-de-canecas-guia', 'datas-comemorativas-para-vender-canecas', 'onde-encontrar-artes-para-sublimacao'],
}

/* ============================================================
 * ARTIGO 8 — dicas/macetes: truques para não errar a prensa
 * ============================================================ */
const ART8: BlogArticle = {
  slug: 'macetes-sublimacao-de-canecas',
  title: 'Macetes de sublimação de canecas: 12 truques para não errar a prensa',
  seoTitle: 'Macetes de Sublimação de Canecas: 12 Truques para Não Errar',
  description:
    'Macetes de sublimação de canecas: 12 truques práticos para cores vivas, sem manchas, sem desbotar e sem desperdiçar papel e tinta.',
  keywords: [
    'macetes sublimação de canecas',
    'dicas sublimação caneca',
    'erros sublimação caneca',
    'como sublimar caneca sem erro',
    'sublimação cores vivas',
  ],
  category: 'dicas',
  emoji: '💡',
  cover: '/uploads/hero-press.png',
  coverAlt: 'Prensa de canecas pronta para sublimação com arte posicionada',
  readTime: '8 min',
  datePublished: '2026-11-12',
  dateModified: '2026-11-12',
  lead:
    'A diferença entre uma caneca sublimada que impressiona e uma que desbota está nos detalhes — e a maioria deles não está no manual da prensa. Estes 12 macetes de sublimação de canecas reúnem o que sublimadores experientes fazem no dia a dia para ter cores vivas, acabamento limpo e zero desperdício.',
  blocks: [
    { type: 'h2', text: 'Antes de prensar: os macetes que evitam retrabalho', id: 'antes-de-prensar' },
    {
      type: 'ul',
      items: [
        'Imprima sempre espelhado. A transferência inverte a imagem — se esquecer de espelhar, o texto sai ao contrário na caneca.',
        'Deixe a arte secar antes de posicionar. Papel sublimático úmido mancha e borra na transferência.',
        'Use fita térmica nas bordas. Ela segura o papel no lugar e evita o "fantasma" (imagem duplicada por deslocamento).',
        'Confira a medida antes de imprimir: 21 × 9,5 cm é o padrão da caneca de 325 ml. Arte menor deixa faixa sem estampa; maior, dobra e marca.',
        'Pré-aqueça a caneca por alguns segundos. Caneca fria rouba calor da prensa e a cor sai apagada nas bordas.',
      ],
    },
    { type: 'h2', text: 'Temperatura e tempo: o ajuste que decide a cor', id: 'temperatura-tempo' },
    {
      type: 'p',
      text: 'A maioria das canecas de porcelana trabalha bem em torno de 180 °C por 180 segundos, mas cada prensa tem sua calibragem — e a mesma prensa varia com a temperatura ambiente. Faça um teste com uma caneca de sacrifício sempre que trocar de lote de papel, tinta ou caneca. Se a cor saiu apagada, aumente o tempo em 10 segundos antes de mexer na temperatura; se saiu amarelada ou com mancha, reduza o tempo.',
    },
    {
      type: 'callout',
      title: 'O macete do teste',
      text: 'Guarde uma caneca branca só para testes. Antes de uma leva grande, prense nela a arte do pedido: você confere cor, posição e nitidez sem arriscar o lote — e o custo de uma caneca de teste é menor que o de refazer um pedido.',
    },
    { type: 'h2', text: 'Os 12 macetes resumidos', id: 'macetes-resumidos' },
    {
      type: 'table',
      caption: '12 macetes de sublimação de canecas',
      head: ['#', 'Macete', 'Por que funciona'],
      rows: [
        ['1', 'Imprimir espelhado', 'A transferência inverte a imagem'],
        ['2', 'Secar o papel antes de posicionar', 'Evita borrão e mancha'],
        ['3', 'Fita térmica nas bordas', 'Evita deslocamento e "fantasma"'],
        ['4', 'Conferir a medida (21 × 9,5 cm)', 'Evita faixa sem estampa ou dobra'],
        ['5', 'Pré-aquecer a caneca', 'Cor uniforme até as bordas'],
        ['6', 'Testar em caneca de sacrifício', 'Valida cor e posição sem arriscar o lote'],
        ['7', 'Ajustar tempo antes da temperatura', 'Correção mais precisa da cor'],
        ['8', 'Pressão firme e uniforme', 'Pressão fraca deixa a cor falhada'],
        ['9', 'Retirar o papel ainda quente', 'Evita que a tinta volte para o papel'],
        ['10', 'Deixar esfriar antes de embalar', 'Evita condensação e mancha na embalagem'],
        ['11', 'Guardar papel em local seco', 'Papel úmido transfere mal'],
        ['12', 'Limpar a prensa entre levas', 'Resíduo de tinta mancha a próxima caneca'],
      ],
    },
    { type: 'h2', text: 'Depois da prensa: acabamento e conservação', id: 'depois-da-prensa' },
    {
      type: 'p',
      text: 'Retire o papel ainda quente, com um movimento firme e contínuo — puxar devagar ou parar no meio pode deixar marca. Deixe a caneca esfriar em local ventilado antes de embalar: embalar caneca quente cria condensação dentro da embalagem e pode manchar a estampa. E lembre o cliente: caneca sublimada vai ao micro-ondas, mas não gosta de esponja abrasiva — lavar com o lado macio da esponja mantém a cor viva por muito mais tempo.',
    },
    {
      type: 'faq',
      items: [
        {
          q: 'Por que minha caneca sublimada saiu com a cor apagada?',
          a: 'As causas mais comuns são tempo insuficiente, temperatura baixa ou caneca fria no início. Pré-aqueça a caneca e aumente o tempo em 10 segundos por vez até a cor ficar viva — e faça o teste em caneca de sacrifício antes do lote.',
        },
        {
          q: 'O que é o efeito "fantasma" na sublimação?',
          a: 'É a imagem duplicada/deslocada, causada pelo papel que se move durante a prensagem. Resolve com fita térmica nas bordas e pressão uniforme da prensa.',
        },
        {
          q: 'Posso lavar caneca sublimada na lava-louças?',
          a: 'Pode, mas a durabilidade da estampa é maior lavando à mão com o lado macio da esponja. Avise o cliente: sem esponja abrasiva e sem deixar de molho por horas.',
        },
      ],
    },
    {
      type: 'cta',
      text: 'Com a técnica certa e a arte certa, a caneca sai perfeita. As artes estão no portal.',
      label: 'Ver as artes para sublimar',
      href: '/#preco',
    },
  ],
  related: ['como-sublimar-canecas-passo-a-passo', 'prensa-de-canecas-como-escolher', 'artes-para-sublimacao-de-canecas-guia'],
}

export const BLOG_ARTICLES: BlogArticle[] = [ART1, ART2, ART3, ART4, ART5, ART6, ART7, ART8]

export function getArticle(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug)
}

export function getRelatedArticles(slugs: string[]): BlogArticle[] {
  return slugs.map(getArticle).filter((a): a is BlogArticle => Boolean(a))
}

export const AUTHOR_NOTE_TEXT = AUTHOR_NOTE
