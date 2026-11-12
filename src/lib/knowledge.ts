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
import { LIFETIME_PRICE_CENTS } from '@/lib/payments/config'
import { formatBRL } from '@/lib/types'

export const LANDING_FAQ_INDICES = [18, 19, 20, 2, 3, 9, 17, 23, 24] as const

export const PRICE = formatBRL(LIFETIME_PRICE_CENTS)

/* ============================================================
 * 1. RESUMO EXECUTIVO / KEY TAKEAWAYS (BLUF)
 * ============================================================ */
export const KEY_TAKEAWAYS: string[] = [
  'Durante a oferta promocional até 31/12/2026, o acesso vitalício custa R$ 47,90 em pagamento único; depois, consulte os planos disponíveis.',
  'Escolha sua arte, baixe o arquivo e confira as medidas para o modelo da sua caneca antes de imprimir.',
  'O acesso completo inclui lançamentos frequentes, Studio Mockup e Editor, sem contratar os bônus separadamente.',
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
  'Tudo começa na Biblioteca. A conta grátis oferece até 20 downloads em 24 horas e gera um código para testar Studio Mockup e Editor por 7 dias desde o cadastro. Os prazos são independentes. A confirmação do acesso completo libera downloads sem a cota do teste e mantém o mesmo código dos bônus sem o prazo de teste. Também existe demonstração com prévias protegidas, sem cadastro.'

/* ============================================================
 * 3. FAQ — base de perguntas; seleção da landing com foco em dúvidas de contratação
 * ============================================================ */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Como recebo meu acesso?',
    a: 'Crie sua conta na Biblioteca com seu e-mail e WhatsApp para começar o teste grátis. Para liberar o pacote completo, finalize a compra pelo checkout da Cakto. Após a confirmação, os downloads deixam de ter a cota do teste e o mesmo código do Studio e do Editor passa a definitivo.',
  },
  {
    q: 'Qual o formato das artes?',
    a: 'Você baixa arquivos de imagem para sublimação de canecas. Antes de imprimir, confira as dimensões da arte, a área de estampa do seu modelo e os ajustes do seu equipamento.',
  },
  {
    q: 'Tem mensalidade?',
    a: `O plano promocional de ${PRICE} está disponível para contratação até 31 de dezembro de 2026, com pagamento único e acesso vitalício para quem contratar durante a campanha. Após a campanha, consulte as condições disponíveis no checkout.`,
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
    a: 'O pagamento é feito no checkout seguro da Cakto. Os meios disponíveis serão apresentados antes da confirmação da compra. O WhatsApp é apenas para suporte.',
  },
  // ---- FAQs hiper-específicas (consideração e objeções de compra) ----
  {
    q: 'Com que frequência entram artes novas?',
    a: 'Novos lançamentos entram com frequência e já estão inclusos no acesso vitalício, sem custo adicional — eles aparecem na aba LANÇAMENTOS do portal.',
  },
  {
    q: 'O acesso expira?',
    a: `O acesso vitalício é a condição da campanha promocional de ${PRICE}, válida até 31/12/2026. Para outros planos, consulte as condições apresentadas na contratação.`,
  },
  {
    q: 'Posso baixar a mesma arte mais de uma vez?',
    a: 'Sim. No teste grátis, cada download conta na cota de 20, inclusive repetições, dentro das 24 horas desde o cadastro. No acesso completo, os downloads são ilimitados, incluindo baixar a mesma arte novamente.',
  },
  {
    q: 'Preciso saber editar arquivo para usar as artes?',
    a: 'Você pode escolher uma arte pronta da biblioteca sem criar um design do zero. Para produzir, prepare a impressão no programa que já utiliza e confira tamanho, espelhamento e ajustes da sua caneca. Alterações de nomes ou elementos dependem do formato e do editor utilizado.',
  },
  {
    q: 'E se o PIX não liberar o meu acesso?',
    a: 'A página de confirmação consulta automaticamente a ativação. Caso o Pix demore, use Verificar novamente; se necessário, contate o suporte informando o e-mail da conta.',
  },
  {
    q: 'As artes são exclusivas? Outros sublimadores usam as mesmas?',
    a: 'O acervo é compartilhado entre os assinantes. Outros profissionais podem usar as mesmas artes; o acesso à biblioteca não inclui exclusividade sobre os designs.',
  },
  {
    q: 'As artes funcionam em prensa de canecas caseira ou semiautomática?',
    a: 'O acervo é voltado à sublimação de canecas. Confira as dimensões do arquivo, a área de estampa do seu modelo e as orientações do fabricante da prensa antes de produzir.',
  },
  {
    q: 'As artes servem só para canecas ou para outros produtos?',
    a: 'As artes são desenhadas para a medida de canecas de porcelana de 325 ml. Muitos sublimadores também as adaptam para outros itens compatíveis com a área de impressão, como canecas de polímero, copos e laços — sempre testando a escala antes de prensar.',
  },
  {
    q: 'Como falo com o suporte?',
    a: 'O suporte oficial é pelo WhatsApp +55 62 9838-7816 — canal mais rápido para dúvidas sobre acesso, downloads e pagamentos (inclusive confirmação de pagamentos pendentes). Também atendemos pelo e-mail ' + SITE.email + '.',
  },
  {
    q: 'Posso sugerir uma nova arte?',
    a: 'Sim! Dentro do portal (menu da sua conta ou botão "Sugerir uma nova arte" no topo e no fim da página) você envia a sua ideia — um tema, uma frase ou um estilo — e ela vai direto para a nossa equipe de criação no painel interno. Os temas mais pedidos entram no cronograma do acervo.',
  },
  { q: 'Posso conhecer a plataforma antes de comprar?', a: 'Sim. Use Conhecer por dentro na página inicial ou no login. A demonstração dispensa cadastro e permite explorar a busca, as categorias e as datas sazonais. As imagens são prévias protegidas, com nitidez limitada e marca-d’água. Downloads e ações de membro ficam bloqueados.' },
  { q: 'Posso acessar em vários aparelhos ao mesmo tempo?', a: 'Nosso sistema acompanha os acessos da conta e identifica automaticamente quando o mesmo login é usado ao mesmo tempo em aparelhos e locais diferentes. O acesso é individual e permite um dispositivo conectado por vez — o compartilhamento é proibido. Ao entrar em outro aparelho, a sessão anterior é encerrada. Para usar mais dispositivos simultaneamente, solicite um acesso adicional (IP adicional) de R$ 14,90 ao suporte, que informa as condições e habilita o adicional após a confirmação.' },
  { q: 'Como funciona o teste grátis da Biblioteca?', a: 'Ao criar sua conta grátis, você pode fazer até 20 downloads individuais em até 24 horas. O prazo começa no cadastro e o teste da Biblioteca termina ao atingir a cota ou completar as 24 horas, o que acontecer primeiro. Não é necessário cartão para criar a conta.' },
  { q: 'Se as 24 horas acabarem, perco o teste do Studio e do Editor?', a: 'Não. Os bônus têm prazo próprio: 7 dias desde a criação da conta na Biblioteca. Atingir os 20 downloads ou encerrar as 24 horas da Biblioteca não reduz os 7 dias do Studio e do Editor.' },
  { q: 'Como recebo meu código do Studio e do Editor?', a: 'O código é gerado automaticamente e aparece no topo do portal, em Meu acesso e código do Studio. Use Copiar código e abra o Studio, que reúne Mockup e Editor em outra plataforma. O botão Studio · Mockup + Editor também oferece Ver meu código do Studio. Quem já é membro usa esse mesmo caminho.' },
  { q: 'O que muda quando ativo o acesso completo?', a: 'A confirmação da compra libera a Biblioteca sem a cota de downloads do teste. O mesmo código do Studio e do Editor passa a definitivo, sem a validade de 7 dias. Isso também vale se você ativar o pacote antes de o teste terminar.' },
  { q: 'O Studio e o Editor são comprados separadamente?', a: 'Não. A Biblioteca é o produto principal. Studio Mockup e Editor são bônus incluídos no pacote de quem ativa o acesso completo à Biblioteca. Você também recebe 7 dias para testá-los ao criar a conta grátis.' },
  { q: 'Meu acesso inclui atualizações e novos produtos?', a: 'Sim. O membro tem acesso às futuras atualizações da plataforma, aos novos lançamentos do acervo e aos novos produtos disponibilizados para membros, conforme forem lançados. As novidades acompanham seu pacote.' },
  { q: 'Vocês fazem edição no serviço Melhorar minha arte?', a: 'Não fazemos edição de conteúdo. O serviço cobre pequenas adaptações, melhoria de nitidez e redução de pixelização, conforme o arquivo permitir. Não inclui troca de nomes ou personagens, criação ou reconstrução da composição.' },
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
      'Nome dado à arte impressa que envolve toda a circunferência da caneca. O padrão do mercado brasileiro para canecas de porcelana de 325 ml é a medida de 21 × 9,5 cm. Confira a medida do arquivo e a área de impressão do seu modelo antes de produzir.',
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
    clickgruda: `${PRICE}, pagamento único na campanha até 31/12/2026`,
    avulsa: 'Preço definido pelo fornecedor',
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
    clickgruda: 'Artes para canecas; confira o arquivo e o modelo antes de imprimir',
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
    clickgruda: 'Downloads ilimitados e novos downloads da mesma arte permitidos',
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
  'Quem perde tempo procurando artes em pastas ou packs sem curadoria',
  'Quem precisa de um acervo organizado para os pedidos de canecas personalizadas',
  'Quem quer capturar datas comemorativas antes da concorrência',
  'Iniciantes que querem custo previsível e acesso imediato',
  'Quem vende em marketplaces, Instagram, WhatsApp ou loja física',
]

export const NOT_FOR_WHO: string[] = [
  'Quem exige exclusividade absoluta de arte — o acervo é compartilhado entre assinantes; nesse caso, o caminho é contratar um designer',
  'Quem procura arte vetorial para redimensionar infinitamente (as artes são raster em alta resolução, já na medida final)',
  'Quem precisa de mockups desenhados sob encomenda para cada produto — o gerador aplica artes nos modelos disponíveis',
  'Quem quer design personalizado por encomenda com briefing próprio',
]

/* ============================================================
 * 7. HOWTO — como sublimar uma caneca com artes da plataforma
 * ============================================================ */
export const HOWTO_STEPS: { name: string; text: string }[] = [
  {
    name: 'Assine e baixe a arte',
    text: `Escolha o plano disponível, entre no portal, filtre as artes por categoria, tag ou busca e baixe o arquivo para produzir a peça, com downloads ilimitados para contas com acesso ativo.`,
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
    name: 'Posicione e prense',
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
  businessModel: 'Oferta de acesso vitalício por pagamento único até 31/12/2026; após a campanha, planos conforme condições vigentes',
  price: PRICE,
  artFormatCm: '21 × 9,5 cm',
  mugStandard: 'Canecas de porcelana de 325 ml',
  downloads: 'Teste grátis: até 20 downloads em 24 horas desde o cadastro, incluindo repetições. Acesso completo: downloads ilimitados',
  commercialUse: 'Para produzir e vender as suas canecas',
  newArtsFrequency: 'Lançamentos frequentes inclusos no acesso',
  payment:
    'Compra pelo checkout da Cakto, com liberação após confirmação. Atendimento e ativações assistidas pelo WhatsApp oficial +55 62 9838-7816',
  portalFeatures:
    'Busca com filtros, tags, favoritos, abas Lançamentos e Sazonal com contagem regressiva da próxima data comemorativa',
}
