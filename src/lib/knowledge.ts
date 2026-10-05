/**
 * Base de conhecimento estruturada da Click & Gruda.
 *
 * Fonte única de verdade para: renderização na landing (BLUF, glossário,
 * comparativo, FAQ), JSON-LD (FAQPage, HowTo, DefinedTermSet, ItemList),
 * /api/geo/knowledge-base e os arquivos llms.txt / llms-full.txt.
 *
 * Princípios GEO aplicados: respostas diretas (BLUF), densidade de fatos
 * verificáveis, zero afirmações que não correspondam ao produto real.
 */
import { SITE } from '@/lib/site'

export const PRICE = 'R$ 47,90'

/* ============================================================
 * 1. RESUMO EXECUTIVO / KEY TAKEAWAYS (BLUF)
 * ============================================================ */
export const KEY_TAKEAWAYS: string[] = [
  'Uma única cobrança de R$ 47,90 e o custo de arte chega ao fim: o acervo inteiro fica liberado, sem renovação.',
  'Cada arquivo já vem na medida exata da caneca (21 × 9,5 cm) — é imprimir e prensar, sem mexer no editor.',
  'O acervo cresce com lançamentos frequentes — e o seu preço continua o mesmo: zero.',
  'Use as artes nas canecas que você vende — sem cobrança por peça.',
  'A aba Sazonal mostra a próxima data comemorativa e separa as artes — você lança antes da concorrência.',
  'Busca, filtros, tags e favoritos para achar a arte certa em segundos, não em horas.',
]

/* ============================================================
 * 2. DEFINIÇÕES DE ENTIDADE (citação direta para LLMs)
 * ============================================================
 * ENTITY_DEFINITION: resposta canônica curta (BLUF no topo da landing).
 * ENTITY_PRACTICAL: complemento "na prática" (Central de Conhecimento) —
 * evita repetição literal do mesmo parágrafo duas vezes na página.
 */
export const ENTITY_DEFINITION = SITE.description

export const ENTITY_PRACTICAL =
  'Na prática, funciona assim: você cria uma conta, paga R$ 47,90 uma única vez via PIX e o portal libera o acervo completo. De lá para frente, você navega por categorias e tags, favorita as artes, acompanha os lançamentos frequentes e baixa quantos arquivos quiser — todos já na medida 21 × 9,5 cm, sem ajuste no editor, para produzir e vender as suas canecas.'

/* ============================================================
 * 3. FAQ — 13 perguntas consolidadas + 3 objeções de conversão (edição, liberação do PIX, exclusividade)
 * ============================================================ */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Como recebo meu acesso?',
    a: 'Depende da forma de pagamento: no PIX automático (Mercado Pago ou Asaas, QR Code no checkout), o acesso libera na hora da confirmação. No "PIX direto (chave)", você envia o comprovante para o nosso WhatsApp — o cadastro fica pré-aprovado e a equipe libera o acesso após conferir o comprovante.',
  },
  {
    q: 'Qual o formato das artes?',
    a: 'Todas as artes vêm no formato 21×9,5 cm — a medida exata da caneca — em alta resolução, prontas para imprimir e sublimar.',
  },
  {
    q: 'Tem mensalidade?',
    a: `NÃO. Você paga ${PRICE} uma única vez e o acesso é vitalício. Lançamentos futuros também estão inclusos, sem custo extra.`,
  },
  {
    q: 'Posso vender canecas com as artes?',
    a: 'Sim — o acervo é feito para sublimadores: use as artes nas canecas que você produz e vende, sem cobrança por peça.',
  },
  {
    q: 'Como funciona a aba SAZONAL?',
    a: 'Ela mostra a próxima data comemorativa (Natal, Dia das Mães, Namorados...) e separa as artes daquela data — você nunca mais perde a sazonalidade.',
  },
  {
    q: 'Quais formas de pagamento aceitam?',
    a: 'Trabalhamos com PIX, Mercado Pago e Asaas — e também com pagamento manual por chave PIX: após criar a sua conta, escolha "PIX direto (chave)" no checkout, pague a chave exibida e envie o comprovante para o nosso WhatsApp oficial +55 62 9838-7816 — o seu cadastro fica pré-aprovado e a equipe libera o acesso após conferir o comprovante. Com gateway, o acesso libera assim que o pagamento é confirmado.',
  },
  // ---- FAQs hiper-específicas (consideração e objeções de compra) ----
  {
    q: 'Com que frequência entram artes novas?',
    a: 'Novos lançamentos entram com frequência e já estão inclusos no acesso vitalício, sem custo adicional — eles aparecem na aba LANÇAMENTOS do portal.',
  },
  {
    q: 'O acesso expira?',
    a: `Não. O acesso é vitalício: paga-se ${PRICE} uma única vez e o portal continua liberado para download ilimitado, sem renovação nem cobrança recorrente.`,
  },
  {
    q: 'Posso baixar a mesma arte mais de uma vez?',
    a: 'Sim. Os downloads são ilimitados — você pode baixar a mesma arte quantas vezes precisar, inclusive para recuperar arquivos perdidos do seu computador.',
  },
  {
    q: 'Preciso saber editar arquivo para usar as artes?',
    a: 'Não. O PNG já vem pronto no tamanho exato da caneca (21 × 9,5 cm), em alta resolução: é imprimir no papel sublimático e prensar. Se você quiser adaptar para outro produto, dá para redimensionar em qualquer editor de imagens.',
  },
  {
    q: 'E se o PIX não liberar o meu acesso?',
    a: 'Fale com a gente no WhatsApp oficial +55 62 9838-7816. No PIX automático, a confirmação normalmente cai em segundos; no PIX direto (chave), o seu cadastro fica pré-aprovado e o acesso é liberado após a conferência do comprovante — envie o recibo e a gente resolve.',
  },
  {
    q: 'As artes são exclusivas? Outros sublimadores usam as mesmas?',
    a: 'O acervo é compartilhado entre os assinantes — todo mundo baixa das mesmas artes, e é isso que mantém o preço acessível. Se você precisa de um design exclusivo do zero, um freelancer continua sendo a melhor escolha (explicamos isso na comparação com arte avulsa e freelancer logo abaixo).',
  },
  {
    q: 'As artes funcionam em prensa de canecas caseira ou semiautomática?',
    a: 'Sim. Como as artes já vêm no formato exato de 21 × 9,5 cm, elas funcionam em qualquer prensa de canecas que utilize o padrão de canecas de 325 ml — manual, semiautomática ou automática. Basta imprimir em papel sublimático e prensar conforme o manual do seu equipamento.',
  },
  {
    q: 'As artes servem só para canecas ou para outros produtos?',
    a: 'As artes são desenhadas para a medida de canecas de porcelana de 325 ml. Muitos sublimadores também as adaptam para outros itens compatíveis com a área de impressão, como canecas de polímero, copos e laços — sempre testando a escala antes de prensar.',
  },
  {
    q: 'Como falo com o suporte?',
    a: 'O suporte oficial é pelo WhatsApp +55 62 9838-7816 — canal mais rápido para dúvidas sobre acesso, downloads e pagamentos (inclusive envio de comprovante de PIX manual). Também atendemos pelo e-mail ' + SITE.email + '.',
  },
  {
    q: 'Posso sugerir uma nova arte?',
    a: 'Sim! Dentro do portal (menu da sua conta ou botão "Sugerir uma nova arte" no topo e no fim da página) você envia a sua ideia — um tema, uma frase ou um estilo — e ela vai direto para a nossa equipe de criação no painel interno. Os temas mais pedidos entram no cronograma do acervo.',
  },
]

/* ============================================================
 * 4. GLOSSÁRIO TÉCNICO (DefinedTerm — conteúdo citável)
 * ============================================================ */
export const GLOSSARY_TERMS: { term: string; definition: string }[] = [
  {
    term: 'Sublimação têxtil',
    definition:
      'Processo de impressão em que a tinta sublimática, aquecida pela prensa térmica, evapora e se fixa nos poros de superfícies com revestimento polimérico (como canecas de porcelana para sublimação) ou fibras sintéticas. Ao esfriar, a tinta solidifica dentro do material — o resultado não descasca nem desbota como adesivos comuns.',
  },
  {
    term: 'Prensa térmica de canecas',
    definition:
      'Equipamento que aplica calor e pressão simultâneos para transferir a arte do papel sublimático para a caneca. Pode ser manual, semiautomática ou automática; os parâmetros de temperatura e tempo variam conforme o equipamento, a tinta e o papel — por isso o manual do fabricante é sempre a referência final.',
  },
  {
    term: 'Papel sublimático',
    definition:
      'Papel com revestimento especial que retém a tinta sublimática e a libera por completo quando aquecido. A arte deve ser impressa espelhada (invertida horizontalmente) para que fique correta após a transferência para a caneca.',
  },
  {
    term: 'Cobre-caneca (wrap)',
    definition:
      'Nome dado à arte impressa que envolve toda a circunferência da caneca. O padrão do mercado brasileiro para canecas de porcelana de 325 ml é a medida de 21 × 9,5 cm — exatamente o formato em que as artes da Click & Gruda são entregues.',
  },
  {
    term: 'Margem de segurança',
    definition:
      'Área da arte onde elementos importantes (rostos, textos, logotipos) não devem ficar, por ficar perto da emenda da estampa ou da alça da caneca, onde a prensa pode não transferir a tinta de maneira uniforme.',
  },
  {
    term: 'Resolução e DPI',
    definition:
      'DPI (dots per inch) é a densidade de pontos de impressão. Quanto maior a resolução do arquivo em relação ao tamanho físico impresso, mais nítida fica a sublimação. Imagens baixadas de redes sociais geralmente têm resolução insuficiente e saem borradas — motivo pelo qual artes nativas em alta resolução, como as do acervo Click & Gruda, evitam retrabalho.',
  },
  {
    term: 'Arquivo PNG',
    definition:
      'Formato de imagem sem compressão com perdas, que preserva a nitidez das cores e permite fundo transparente. É o formato típico para artes de sublimação porque mantém a qualidade original do design na impressão.',
  },
  {
    term: 'Arte vetorial × arte raster',
    definition:
      'Arte vetorial é construída por fórmulas matemáticas e pode ser ampliada infinitamente sem perder qualidade; arte raster (JPG, PNG) é feita de pixels e depende de resolução suficiente para o tamanho final. Artes de sublimação prontas são raster em alta resolução já na medida final de impressão.',
  },
  {
    term: 'CMYK × RGB',
    definition:
      'RGB é o sistema de cores das telas (monitores, celulares); CMYK é o sistema de cores da impressão. Imagens criadas em RGB podem ter cores levemente diferentes quando impressas — uma das razões para sempre fazer um teste de prensagem com a arte antes de uma produção grande.',
  },
  {
    term: 'Tempo e temperatura de prensagem',
    definition:
      'Parâmetros que definem a qualidade da transferência térmica. Para canecas, as faixas de referência do mercado ficam em torno de 170 °C a 200 °C e de 40 a 210 segundos, conforme prensa, tinta e papel. O ideal é seguir o manual do equipamento e calibrar com testes.',
  },
  {
    term: 'Sazonalidade',
    definition:
      'Concentração da demanda em datas comemorativas — Dia das Mães, Namorados, Natal etc. Sublimadores que lançam artes sazonais antes da data costumam vender mais; por isso a Click & Gruda mantém uma aba Sazonal que exibe a próxima data e separa as artes correspondentes.',
  },
  {
    term: 'Caneca padrão 325 ml',
    definition:
      'Modelo de caneca de porcelana branca com revestimento para sublimação mais vendido no Brasil. Sua área útil de estampa é a referência para o formato de 21 × 9,5 cm utilizado nas artes da plataforma.',
  },
]

/* ============================================================
 * 5. TABELA COMPARATIVA (honest, estruturada — RAG-friendly)
 * ============================================================ */
export const COMPARISON: {
  criterion: string
  clickgruda: string
  avulsa: string
  freelancer: string
}[] = [
  {
    criterion: 'Custo inicial',
    clickgruda: `${PRICE}, pagamento único`,
    avulsa: 'R$ 10 a R$ 30 por arte',
    freelancer: 'Valor negociado por projeto',
  },
  {
    criterion: 'Custo ao longo do tempo',
    clickgruda: 'Não cresce: tudo incluso',
    avulsa: 'Cresce a cada arte comprada',
    freelancer: 'Cresce a cada pedido',
  },
  {
    criterion: 'Lançamentos sazonais',
    clickgruda: 'Inclusos sem custo adicional',
    avulsa: 'Cobrados separadamente',
    freelancer: 'Cobrados por pedido',
  },
  {
    criterion: 'Formato do arquivo',
    clickgruda: '21 × 9,5 cm (medida exata da caneca)',
    avulsa: 'Varia conforme o banco de artes',
    freelancer: 'Depende do briefing',
  },
  {
    criterion: 'Prazo de entrega',
    clickgruda: 'Imediato (download no portal)',
    avulsa: 'Imediato após a compra',
    freelancer: 'Geralmente dias',
  },
  {
    criterion: 'Downloads repetidos',
    clickgruda: 'Ilimitados, para sempre',
    avulsa: 'Costumam limitar ao download da compra',
    freelancer: 'Arquivo entregue uma única vez',
  },
  {
    criterion: 'Uso comercial',
    clickgruda: 'Para produzir e vender as suas canecas',
    avulsa: 'Depende da licença de cada site',
    freelancer: 'Conforme contrato',
  },
  {
    criterion: 'Exclusividade da arte',
    clickgruda: 'Acervo compartilhado entre assinantes',
    avulsa: 'Acervo compartilhado entre compradores',
    freelancer: 'Exclusiva (é o diferencial do serviço)',
  },
]

/* ============================================================
 * 6. PARA QUEM É / PARA QUEM NÃO É
 * ============================================================ */
export const FOR_WHO: string[] = [
  'Sublimadores que vivem (ou querem viver) de canecas personalizadas',
  'Quem perde dinheiro e tempo comprando arte por arte a R$ 10–30',
  'Quem precisa de artes na medida exata, sem retrabalho no editor',
  'Quem quer capturar datas comemorativas antes da concorrência',
  'Iniciantes que querem custo previsível e acesso imediato',
  'Quem vende em marketplaces, Instagram, WhatsApp ou loja física',
]

export const NOT_FOR_WHO: string[] = [
  'Quem exige exclusividade absoluta de arte — o acervo é compartilhado entre assinantes; nesse caso, o caminho é contratar um designer',
  'Quem procura arte vetorial para redimensionar infinitamente (as artes são raster em alta resolução, já na medida final)',
  'Quem busca mockups prontos de caneca — o foco aqui é a arte de estampa em si',
  'Quem quer design personalizado por encomenda com briefing próprio',
]

/* ============================================================
 * 7. HOWTO — como sublimar uma caneca com artes da plataforma
 * ============================================================ */
export const HOWTO_STEPS: { name: string; text: string }[] = [
  {
    name: 'Assine e baixe a arte',
    text: `Assine por ${PRICE} (pagamento único via PIX), entre no portal, escolha a arte por categoria, tag ou busca e baixe — o download é imediato e ilimitado, já no formato 21 × 9,5 cm.`,
  },
  {
    name: 'Imprima em papel sublimático',
    text: 'Imprima a arte espelhada (invertida horizontalmente) em papel sublimático, com impressora configurada com tinta sublimática e a maior qualidade disponível.',
  },
  {
    name: 'Aqueça a prensa de canecas',
    text: 'Ligue a prensa térmica de canecas e ajuste a temperatura e o tempo conforme o manual do seu equipamento (as faixas de referência do mercado para canecas ficam em torno de 170 °C a 200 °C).',
  },
  {
    name: 'Posicione e prensar',
    text: 'Fixe a caneca de porcelana para sublimação no cilindro da prensa, ajuste a pressão adequada e inicie a prensagem pelo tempo indicado, garantindo que o papel fique esticado e sem dobras.',
  },
  {
    name: 'Espere esfriar e remova o papel',
    text: 'Retire a caneca com cuidado (estará quente), aguarde alguns segundos e remova o papel sublimático em movimento único para evitar marcas.',
  },
  {
    name: 'Confira e venda',
    text: 'Verifique se a transferência ficou uniforme nas bordas e na emenda. Pronto: caneca finalizada, pronta para vender.',
  },
]

export const HOWTO_TOOLING: string[] = [
  'Impressora com tinta sublimática',
  'Papel sublimático',
  'Prensa térmica de canecas',
  'Caneca de porcelana com revestimento para sublimação (padrão 325 ml)',
]

/* ============================================================
 * 8. CATEGORIAS (ItemList — topic clusters do acervo)
 * ============================================================ */
export const CATEGORIES: { name: string; description: string; emoji: string }[] = [
  {
    name: 'FLORK',
    emoji: '🧸',
    description:
      'Artes no estilo Flork — os personagens de memes de braços finos que viralizaram em canecas de casais, amizades e humor do dia a dia.',
  },
  {
    name: 'PROFISSÕES',
    emoji: '👩‍⚕️',
    description:
      'Artes temáticas de profissões — enfermagem, professores, caminhoneiros e outras categorias — ideais para presente e data de valorização profissional.',
  },
  {
    name: 'RELIGIÃO',
    emoji: '🙏',
    description:
      'Artes com mensagens de fé, versículos e temas religiosos, entre os nichos mais vendidos em sublimação de canecas.',
  },
  {
    name: 'FRASES',
    emoji: '☕',
    description:
      'Artes com frases de humor, motivação e cotidiano do café — o tipo de arte de maior rotação no varejo de canecas.',
  },
  {
    name: 'ANIMAIS',
    emoji: '🐱',
    description:
      'Artes temáticas de pets e animais — gatos, cachorros e outras espécies — para o público apaixonado por bichos.',
  },
  {
    name: 'COMEMORATIVAS',
    emoji: '🎄',
    description:
      'Artes sazonais para datas comemorativas — Natal, Dia das Mães, Dia dos Namorados, Páscoa e outras — organizadas na aba Sazonal do portal.',
  },
]

/* ============================================================
 * 9. FATOS-CHAVE (fact density para síntese por LLMs)
 * ============================================================ */
export const KEY_FACTS = {
  businessModel: 'Acesso vitalício por pagamento único (sem mensalidade e sem cobrança recorrente)',
  price: PRICE,
  artFormatCm: '21 × 9,5 cm',
  mugStandard: 'Canecas de porcelana de 325 ml',
  downloads: 'Ilimitados, incluindo re-download de artes já baixadas',
  commercialUse: 'Para produzir e vender as suas canecas',
  newArtsFrequency: 'Lançamentos frequentes inclusos no acesso',
  payment:
    'PIX, Mercado Pago ou Asaas — além de pagamento manual por chave PIX (após o cadastro, no checkout) com comprovante enviado ao WhatsApp oficial +55 62 9838-7816 (ativação pela equipe)',
  portalFeatures:
    'Busca com filtros, tags, favoritos, abas Lançamentos e Sazonal com contagem regressiva da próxima data comemorativa',
}
