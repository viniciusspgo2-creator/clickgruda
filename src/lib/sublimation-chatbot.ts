/**
 * Base de conhecimento do Assistente Click & Gruda — ChatBot MECÂNICO.
 *
 * NÃO usa IA: as respostas são escolhidas por pontuação de palavras-chave
 * (ver `matchIntent` abaixo). Todas as respostas foram escritas a partir de
 * dados técnicos reais de sublimação de canecas (fichas técnicas de
 * fabricantes como Metalnox, Pampa Tech e Live Sub; guias de impressão
 * Epson/ICC; guias de solução de problemas de sublimação).
 *
 * Regra de ouro: os valores de temperatura/tempo/pressão são PONTOS DE
 * PARTIDA. Cada prensa, tinta, papel e marca de caneca pode pedir um pequeno
 * ajuste — sempre faça um teste antes de produzir em escala.
 */

export type ChatIntent = {
  id: string
  title: string
  /** Palavras e expressões em pt-BR. A comparação é feita com o texto
   *  normalizado (minúsculas, sem acento), então acento é opcional aqui —
   *  mantemos as duas formas por legibilidade. */
  keywords: string[]
  /** Resposta completa em pt-BR, prática e direta, com números reais. */
  answer: string
  /** Sugestões de próxima pergunta depois desta resposta. */
  quickReplies?: string[]
}

export const WHATSAPP_URL =
  'https://wa.me/556298387816?text=' +
  encodeURIComponent('Olá! Vim pela Central Click & Gruda e preciso de ajuda com sublimação de canecas.')

export const QUICK_REPLIES: string[] = [
  'Qual a temperatura ideal da caneca?',
  'Minha arte saiu desbotada, e agora?',
  'Como evitar imagem fantasma?',
  'Qual o lado certo do papel sublimático?',
  'Passo a passo para sublimar uma caneca',
  'Que impressora usar para sublimação?',
  'Quais canecas podem ser sublimadas?',
  'Como precificar minhas canecas?',
]

export const FALLBACK_ANSWER =
  'Não encontrei uma resposta exata para isso na minha base. Tenta reformular com outras palavras — por exemplo, me diga o que aconteceu com a caneca (desbotada, borrada, fantasma, amarelada) ou pergunte sobre temperatura, tempo, papel, tinta ou impressora.\n\nAlguns assuntos que eu domino:\n• Temperatura, tempo e pressão de cada tipo de caneca\n• Papel, tinta, impressora e perfil de cor (ICC)\n• Problemas: desbotada, fantasma, borrada, amarelada, manchas\n• Passo a passo completo da sublimação\n• Materiais, insumos e precificação\n\nSe preferir falar com uma pessoa, chama nosso suporte no WhatsApp — o botão está aqui em cima no chat.'

/** Normaliza texto para comparação: minúsculas, sem acentos, espaços simples. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Escolhe o melhor intent por pontuação mecânica:
 * - conta quantas keywords de cada intent aparecem na mensagem normalizada;
 * - exige pelo menos 1 acerto; desempate pela maior pontuação;
 * - se empatar, prefere o intent com mais keywords (mais específico).
 * Retorna null quando nenhuma keyword bate (aí o componente usa o fallback).
 */
export function matchIntent(message: string): ChatIntent | null {
  const text = ` ${normalizeText(message)} `
  let best: ChatIntent | null = null
  let bestScore = 0
  for (const intent of SUBLIMATION_INTENTS) {
    let score = 0
    for (const raw of intent.keywords) {
      const kw = normalizeText(raw)
      if (!kw) continue
      // Expressão com espaço: exige a frase inteira; palavra única: exige
      // palavra completa (evita "cor" bater dentro de "decorar").
      if (kw.includes(' ')) {
        if (text.includes(` ${kw} `)) score += 2
      } else if (text.includes(` ${kw} `)) {
        score += 1
      }
    }
    if (score > bestScore || (score === bestScore && score > 0 && best && intent.keywords.length > best.keywords.length)) {
      best = intent
      bestScore = score
    }
  }
  return bestScore > 0 ? best : null
}

export const SUBLIMATION_INTENTS: ChatIntent[] = [
  {
    id: 'saudacao',
    title: 'Saudação',
    keywords: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'eae', 'e ai', 'e aí', 'tudo bem', 'opa'],
    answer:
      'Olá! 👋 Eu sou o Assistente Click & Gruda, seu ajudante de sublimação de canecas.\n\nPosso te ajudar com:\n• Temperatura, tempo e pressão de cada tipo de caneca\n• Papel, tinta, impressora e perfil de cor\n• Problemas: arte desbotada, fantasma, borrada, amarelada, manchas\n• Passo a passo completo e macetes de produção\n• Materiais, insumos e precificação\n\nÉ só escrever sua dúvida — ou tocar num dos botões abaixo.',
    quickReplies: ['Passo a passo para sublimar uma caneca', 'Qual a temperatura ideal da caneca?', 'Minha arte saiu desbotada, e agora?'],
  },
  {
    id: 'capacidades',
    title: 'O que você sabe fazer',
    keywords: ['o que voce sabe', 'o que você sabe', 'o que voce faz', 'o que você faz', 'o que pode fazer', 'o que pode me ajudar', 'me ajuda com o que', 'suas funcoes', 'suas funções', 'como funciona', 'o que e voce', 'o que é você', 'quem e voce', 'quem é você'],
    answer:
      'Eu sou um assistente mecânico da Click & Gruda, especialista em sublimação de canecas. Não sou IA — minhas respostas vêm de uma base técnica montada com fichas de fabricantes e guias de sublimação.\n\nO que eu sei responder:\n1. Temperatura, tempo e pressão — cerâmica, mágica, metalizada, cônica, chope, xícara, squeeze e vidro\n2. Papel sublimático, tinta, impressora Epson e perfil ICC\n3. Problemas e soluções — desbotada, fantasma, borrada, amarelada, manchas, papel grudando\n4. Passo a passo completo, do zero até a caneca pronta\n5. Materiais, estoque, o que evitar e precificação\n\nPergunta direto, por exemplo: "qual temperatura da caneca mágica?" ou "minha arte saiu com fantasma".',
    quickReplies: ['Passo a passo para sublimar uma caneca', 'Qual a temperatura ideal da caneca?', 'Quais canecas podem ser sublimadas?'],
  },
  {
    id: 'agradecimento',
    title: 'Agradecimento',
    keywords: ['obrigado', 'obrigada', 'valeu', 'vlw', 'agradeço', 'agradeco', 'show', 'top', 'perfeito', 'ajudou', 'deu certo', 'funcionou'],
    answer:
      'Por nada! 😊 Fico feliz em ajudar. Se surgir outra dúvida na hora de prensar — temperatura, papel, fantasma, cor fraca — é só chamar aqui.\n\nE lembra: na Biblioteca de Artes da Click & Gruda você tem milhares de artes prontas em 21 x 9,5 cm para sublimar. Bons trabalhos e boas vendas! 🍶',
    quickReplies: ['Como precificar minhas canecas?', 'Dicas para economizar tinta'],
  },
  {
    id: 'despedida',
    title: 'Despedida',
    keywords: ['tchau', 'adeus', 'flw', 'falou', 'ate mais', 'até mais', 'ate logo', 'até logo', 'vou indo', 'encerrar'],
    answer:
      'Até mais! 👋 Boa produção por aí — e qualquer dúvida de sublimação, o assistente está aqui na Central. Sucesso nas suas canecas! 🍶',
  },
  {
    id: 'passo-a-passo',
    title: 'Passo a passo completo da sublimação',
    keywords: ['passo a passo', 'como sublimar', 'como fazer', 'como personalizar', 'como estampar', 'tutorial', 'como comecar', 'como começar', 'primeira caneca', 'do zero', 'sublimar uma caneca', 'sublimar caneca'],
    answer:
      'Passo a passo completo para sublimar uma caneca de cerâmica:\n\n1. CRIE OU BAIXE A ARTE — tamanho 21 x 9,5 cm, 300 DPI. Na Click & Gruda as artes já vêm nesse formato.\n2. IMPRIMA ESPELHADA — no driver da impressora, ative "Espelhar imagem" (Mirror). Imprima no lado certo do papel sublimático (o lado mais branco e liso).\n3. DEIXE A IMPRESSÃO SECAR — não prense com a tinta úmida, senão borra.\n4. LIMPE A CANECA — pano seco e limpo, sem gordura, poeira ou dedo marcado.\n5. PRÉ-AQUEÇA A CANECA — 10 segundos só o fundo e 3 segundos o restante, para tirar a umidade.\n6. POSICIONE A ARTE — enrole o papel na caneca, alinhe as bordas e fixe com fita térmica (em cima, embaixo e na emenda). O papel não pode se mexer.\n7. PRENSE — 200 °C, 180 segundos, pressão média. Espere a prensa voltar à temperatura antes de contar o tempo.\n8. RETIRE COM CUIDADO — abra a prensa, puxe o papel num movimento único e suave, sem arrastar sobre a caneca quente (evita fantasma).\n9. ESFRIE — deixe a caneca esfriar naturalmente. Não mergulhe em água fria: choque térmico pode trincar a cerâmica.\n10. CONFIRA — a cor final só aparece depois de fria. Lave só com água e sabão neutro.\n\nDica: faça sempre uma caneca de teste antes de produzir em lote.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Qual o lado certo do papel sublimático?', 'Como evitar imagem fantasma?'],
  },
  {
    id: 'temperatura-ceramica',
    title: 'Temperatura, tempo e pressão — caneca de cerâmica',
    keywords: ['temperatura', 'tempo', 'pressao', 'pressão', 'quantos graus', 'qual temperatura', 'tempo ideal', 'temperatura ideal', 'configuracao', 'configuração', 'ceramica', 'cerâmica', 'caneca branca', 'caneca comum', 'caneca normal', 'graus'],
    answer:
      'Caneca de cerâmica branca 325 ml (a mais comum):\n\n• Temperatura: 200 °C\n• Tempo: 180 segundos\n• Pressão: MÉDIA\n\nDetalhes importantes:\n• Comece a contar o tempo SÓ quando a prensa voltar a 200 °C depois de fechar — ao fechar, a temperatura cai para uns 150 °C, e isso é normal.\n• Para cobrir a arte até a base (altura total de 9,5 cm): depois dos 180 s, gire a caneca 180° e prense por mais 60 segundos, na mesma temperatura.\n• Pressão média = a alavanca fecha com firmeza, mas sem forçar; a caneca não pode girar dentro da resistência.\n• Se a cor sair fraca, aumente o tempo em 10 a 20 segundos (não a temperatura de primeira).\n• Se sair amarelada ou com aspecto queimado, reduza o tempo em 10 a 20 segundos.\n\nEsses valores são o ponto de partida usado pelos fabricantes (Pampa Tech, Metalnox). Cada prensa varia um pouco — faça um teste antes do lote.',
    quickReplies: ['Qual a temperatura da caneca mágica?', 'Minha arte saiu desbotada, e agora?', 'Como ajustar a pressão da prensa?'],
  },
  {
    id: 'caneca-magica',
    title: 'Caneca mágica',
    keywords: ['caneca magica', 'caneca mágica', 'magica', 'mágica', 'muda de cor', 'termica', 'térmica', 'efeito magico', 'efeito mágico', 'preta', 'revela'],
    answer:
      'Caneca mágica (a que revela a arte com líquido quente):\n\n• Temperatura: 180 a 200 °C\n• Tempo: 180 segundos\n• Pressão: MÉDIA\n\nCuidados específicos da mágica:\n1. ESPERE ESFRIAR para tirar o papel — o revestimento termossensível fica sensível em alta temperatura. Retirar o papel com a caneca muito quente pode danificar o efeito mágico.\n2. NÃO use micro-ondas nem lava-louças na caneca mágica: o calor e o detergente forte degradam o revestimento.\n3. Área de sublimação: 20 x 9 cm (um pouco menor que a caneca branca comum).\n4. Lave com a parte macia da esponja e sabão neutro.\n5. O efeito mágico some com o tempo de uso intenso — avise o cliente que é uma caneca de efeito, não eterna.\n\nO restante do processo é igual ao da cerâmica comum: arte espelhada, fita térmica e papel bem fixo.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Como retirar o papel depois de prensar?', 'Quais canecas podem ser sublimadas?'],
  },
  {
    id: 'caneca-metalizada',
    title: 'Caneca metalizada / dourada / espelhada',
    keywords: ['metalizada', 'metalica', 'metálica', 'dourada', 'espelhada', 'prateada', 'cobre', 'champagne', 'metal', 'brilho'],
    answer:
      'Caneca metalizada (dourada, prateada, cobre, espelhada):\n\n• Temperatura: 200 °C\n• Tempo: 180 segundos\n• Pressão: MÉDIA\n\nCuidados:\n1. A parte metalizada é um revestimento delicado — não esfregue com o lado áspero da esponja.\n2. A tinta de sublimação é translúcida: sobre o fundo metalizado, as cores ficam com efeito metálico. Branco da arte NÃO aparece — fica o metal no lugar.\n3. Não leve ao micro-ondas.\n4. Pré-aqueça o fundo da caneca por 10 segundos e o restante por 3 segundos antes de posicionar a arte (tira a umidade e melhora a aderência).\n5. Evite pressão forte demais: pode marcar o revestimento.\n\nSe a cor sair fraca, o problema costuma ser pressão irregular — regule a prensa com ela já quente, pois a resistência dilata com o calor.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Minha arte saiu desbotada, e agora?', 'Como ajustar a pressão da prensa?'],
  },
  {
    id: 'caneca-conica',
    title: 'Caneca cônica',
    keywords: ['conica', 'cônica', 'cone', 'afunilada', 'tronco de cone', 'base menor'],
    answer:
      'Caneca cônica (base mais estreita que a boca):\n\n• Temperatura: 200 °C\n• Tempo: 160 a 200 segundos\n• Pressão: MÉDIA\n\nCuidados:\n1. Use resistência PRÓPRIA para cônica — a resistência cilíndrica comum não encosta direito na parte de baixo e a arte sai falha na base.\n2. A arte precisa ser adaptada ao formato: a parte de baixo da arte fica mais "comprimida". Use o gabarito da caneca cônica (a largura da arte diminui embaixo).\n3. Fixe muito bem com fita térmica: o formato inclinado faz o papel escorregar com mais facilidade.\n4. Se a base sair fraca, gire a caneca e faça um segundo ciclo curto só na parte de baixo.\n\nSem a resistência certa, não adianta aumentar tempo ou temperatura — o problema é contato, não calor.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Como ajustar a pressão da prensa?', 'Partes da arte não transferiram'],
  },
  {
    id: 'caneca-chope',
    title: 'Caneca de chope / chopp',
    keywords: ['chope', 'chopp', 'chopp', 'caneca de chopp', 'caneca de chope', 'cerveja', 'pilsen'],
    answer:
      'Caneca de chope (vidro ou cerâmica, formato alto):\n\n• Temperatura: 180 °C\n• Tempo: 180 segundos\n• Pressão: MÉDIA (vidro) a MÉDIA-FORTE (cerâmica)\n\nCuidados:\n1. Se for de VIDRO fosco (jateado): 190 °C por 200 segundos, pressão MÉDIA. Vidro quebra com pressão forte — nunca force a alavanca.\n2. Use resistência de diâmetro compatível com a caneca de chope (ela é mais larga que a caneca comum).\n3. O revestimento do vidro fosco é sensível a riscos — não deixe as canecas batendo umas nas outras no armazenamento.\n4. Não use micro-ondas em caneca de vidro sublimada.\n\nAtenção: caneca de chope de vidro comum, sem tratamento para sublimação, NÃO funciona — a tinta não fixa.',
    quickReplies: ['Caneca de vidro pode sublimar?', 'Quais canecas podem ser sublimadas?', 'Qual a temperatura ideal da caneca?'],
  },
  {
    id: 'xicara',
    title: 'Xícara / caneca cafezinho 180 ml',
    keywords: ['xicara', 'xícara', 'cafezinho', 'cafe', 'café', '180ml', '180 ml', 'pequena', '6oz', '6 oz'],
    answer:
      'Xícara / caneca cafezinho 180 ml:\n\n• Temperatura: 200 °C\n• Tempo: 180 segundos\n• Pressão: MÉDIA\n\nCuidados:\n1. A xícara tem diâmetro menor (cerca de 7,5 cm) — a resistência comum de caneca 325 ml NÃO fecha direito nela.\n2. Use resistência de SQUEEZE ou uma manta de silicone para compensar a diferença de diâmetro e garantir o contato.\n3. A área de sublimação é menor — reduza a arte proporcionalmente, não use o gabarito 21 x 9,5 cm.\n4. Prenda bem a arte com fita térmica: em peças pequenas, qualquer deslocamento aparece muito.\n\nSem a resistência certa ou a manta, a arte sai fraca nas laterais.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Squeeze de alumínio: temperatura e tempo', 'Como ajustar a pressão da prensa?'],
  },
  {
    id: 'squeeze-aluminio',
    title: 'Squeeze de alumínio',
    keywords: ['squeeze', 'aluminio', 'alumínio', 'garrafa', 'garrafinha', 'cantil'],
    answer:
      'Squeeze de alumínio:\n\n• Na prensa de caneca: 180 °C, 180 segundos, pressão MÉDIA\n• No forno 3D: 175 °C por 18 minutos\n\nCuidados:\n1. Use resistência própria para squeeze (diâmetro menor que o da caneca).\n2. Vire a squeeze e sublime o verso separadamente, depois a parte de cima — o ideal é prensar em 2 a 3 etapas girando a peça.\n3. Retire a tampa antes de prensar: só o corpo vai para a prensa.\n4. A tinta é translúcida — sobre alumínio, o branco da arte não aparece; as cores ficam com aspecto metálico.\n5. Não use pressão forte: alumínio amassa fácil.\n\nPara squeeze de inox de parede dupla, os parâmetros mudam (veja a resposta sobre squeeze inox).',
    quickReplies: ['Squeeze inox: temperatura e tempo', 'Qual a temperatura ideal da caneca?', 'Quais canecas podem ser sublimadas?'],
  },
  {
    id: 'squeeze-inox',
    title: 'Squeeze inox (parede dupla / térmica)',
    keywords: ['inox', 'aco', 'aço', 'termica', 'térmica', 'parede dupla', 'inox termica', 'inox térmica'],
    answer:
      'Squeeze inox de parede dupla (térmica):\n\n• Temperatura: 195 °C\n• Tempo: 320 segundos (cerca de 5 min e 20 s)\n• Pressão: LEVE\n\nCuidados:\n1. Pressão LEVE é essencial: feche a prensa com um dedo só, sem forçar. Pressão forte AMASSA o inox.\n2. Gire a squeeze a cada 40 segundos para distribuir o calor por igual.\n3. Comece a contar o tempo só quando a prensa voltar à temperatura de trabalho (195 °C).\n4. Retire a tampa antes de prensar.\n5. Use resistência de diâmetro compatível — se a resistência for grande demais, o contato fica falho e a arte sai manchada.\n\nÉ um dos produtos mais demorados da sublimação, mas tem ótima margem de venda.',
    quickReplies: ['Squeeze de alumínio: temperatura e tempo', 'Como ajustar a pressão da prensa?', 'Como precificar minhas canecas?'],
  },
  {
    id: 'caneca-vidro',
    title: 'Caneca de vidro',
    keywords: ['vidro', 'transparente', 'jateada', 'jateado', 'fosca', 'fosco', 'cristal'],
    answer:
      'Caneca de vidro (só funciona a fosca/jateada com tratamento):\n\n• Temperatura: 190 °C\n• Tempo: 200 segundos\n• Pressão: MÉDIA\n\nCuidados:\n1. Vidro comum transparente NÃO sublima — só o vidro fosco/jateado com revestimento próprio para sublimação.\n2. NUNCA force a pressão: vidro quebra. A alavanca deve fechar suave.\n3. O revestimento fosco risca fácil — armazene as canecas separadas, sem bater uma na outra.\n4. Deixe esfriar naturalmente. Choque térmico (água fria na caneca quente) pode trincar o vidro.\n5. A tinta é translúcida: sobre vidro, as cores ficam mais suaves que na cerâmica branca.\n\nSe a arte sair apagada, o problema geralmente é o revestimento do vidro (qualidade) ou pressão fraca — não aumente a temperatura, que pode trincar a peça.',
    quickReplies: ['Quais canecas podem ser sublimadas?', 'Quais canecas NÃO podem ser sublimadas?', 'Qual a temperatura ideal da caneca?'],
  },
  {
    id: 'caneca-glitter',
    title: 'Caneca glitter',
    keywords: ['glitter', 'purpurina', 'brilho', 'gliter'],
    answer:
      'Caneca glitter:\n\n• Temperatura: 200 °C\n• Tempo: 215 segundos\n• Pressão: MÉDIA a FORTE\n\nCuidados:\n1. A caneca glitter precisa de um pouco mais de tempo que a branca comum (215 s em vez de 180 s).\n2. NÃO leve ao micro-ondas nem à lava-louças: o calor e o detergente danificam o glitter e a resina.\n3. Lave com a parte macia/amarela da esponja, para não riscar e não deixar o glitter fosco.\n4. A área de sublimação é 21 x 9,8 cm.\n\nÉ uma das canecas mais vendidas para presente — capriche na embalagem.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Como lavar a caneca sublimada?', 'Como precificar minhas canecas?'],
  },
  {
    id: 'caneca-preta-tarja',
    title: 'Caneca preta com tarja branca',
    keywords: ['preta', 'tarja', 'faixa branca', 'caneca preta', 'listra'],
    answer:
      'Caneca preta com tarja branca (só a tarja é sublimável):\n\n• Temperatura: 190 °C\n• Tempo: 200 segundos\n• Pressão: MÉDIA\n\nCuidados:\n1. É uma das canecas MAIS DIFÍCEIS de sublimar: só a faixa branca recebe a tinta, e a pressão precisa estar perfeita.\n2. Regule a pressão COM A PRENSA JÁ QUENTE e com a caneca dentro: a resistência dilata com o calor e a regulagem muda entre uma caneca e outra.\n3. Área de sublimação: 19,4 x 8,5 cm (só a tarja).\n4. O objetivo é um preto bem fechado na arte — as configurações podem variar conforme o perfil de cor do seu software.\n5. Faça um teste antes de cada lote: essa caneca é a que mais dá retrabalho.\n\nSe a arte sair fraca, quase sempre é pressão — não adianta subir a temperatura.',
    quickReplies: ['Como ajustar a pressão da prensa?', 'Minha arte saiu desbotada, e agora?', 'Qual a temperatura ideal da caneca?'],
  },

  {
    id: 'papel',
    title: 'Papel sublimático — lado certo e gramatura',
    keywords: ['papel', 'lado certo', 'lado do papel', 'gramatura', 'papel sublimatico', 'papel sublimático', 'folha', 'papel errado', 'lado branco', 'lado liso', 'papel rosa', 'papel jojo', 'qual papel'],
    answer:
      'Papel sublimático — o que você precisa saber:\n\nLADO CERTO:\n• Imprima SEMPRE no lado revestido: é o lado mais branco, mais liso e brilhante. O verso é mais áspero e fosco.\n• Se errar o lado, a tinta fica no papel e quase nada transfere para a caneca.\n• Dica: alguns papéis têm marca d\'água ou o nome da marca no verso — use isso como referência. Papel rosa (fundo rosa) ajuda a identificar o lado na hora.\n\nGRAMATURA:\n• Para canecas e objetos rígidos: use 90 g/m² ou mais.\n• Para tecidos: 70 g/m² já serve.\n• Papel muito fino deforma na prensa, enruga e pode deixar marca d\'água na impressão.\n\nOUTROS CUIDADOS:\n• Aqueça o papel na prensa por 5 segundos antes de imprimir: tira a umidade e melhora a transferência.\n• Guarde o papel em local seco, longe de umidade — papel úmido é uma das maiores causas de manchas e cores fracas.\n• Não use papel comum (sulfite): ele não tem o revestimento que libera a tinta com o calor.\n• Deixe a impressão secar completamente antes de prensar.',
    quickReplies: ['Que impressora usar para sublimação?', 'Minha arte saiu desbotada, e agora?', 'Como evitar manchas brancas?'],
  },
  {
    id: 'tinta',
    title: 'Tinta sublimática',
    keywords: ['tinta', 'tinta sublimatica', 'tinta sublimática', 'tinta genesis', 'tinta gênesis', 'qual tinta', 'tinta original', 'tinta falsificada', 'tanque', 'recarregar'],
    answer:
      'Tinta sublimática — o essencial:\n\n1. NUNCA misture tinta comum com tinta sublimática, e nunca misture marcas diferentes no mesmo tanque. A tinta comum não sublima e entope tudo.\n2. Use tinta de marca conhecida e confiável (a mais usada no Brasil é a Gênesis). Tinta barata e sem procedência é a maior causa de cor fraca e entupimento.\n3. Depois de converter a impressora para sublimação, NÃO volte a usar tinta comum nela.\n4. Faça limpeza de bico e verificação de jatos toda semana se imprimir pouco — a tinta sublimática seca e entope os bicos com facilidade.\n5. Imprima pelo menos 1 folha por semana para manter a tinta circulando.\n6. Guarde os frascos bem fechados, longe de sol e calor.\n\nSinal de tinta ruim ou vencida: cores apagadas mesmo com temperatura e tempo certos, e falhas nas impressões (listras).',
    quickReplies: ['Que impressora usar para sublimação?', 'Perfil de cor ICC: como instalar?', 'Minha arte saiu desbotada, e agora?'],
  },
  {
    id: 'impressora',
    title: 'Impressora para sublimação (Epson EcoTank)',
    keywords: ['impressora', 'epson', 'ecotank', 'l3250', 'l3150', 'l3550', 'l1250', 'surecolor', 'f170', 'sawgrass', 'qual impressora', 'impressora sublimatica', 'impressora sublimática', 'converter impressora'],
    answer:
      'Impressora para sublimação:\n\nMODELOS MAIS USADOS NO BRASIL:\n• Epson EcoTank L3150, L3250 e L3550 — as mais comuns. São impressoras comuns CONVERTIDAS: você enche os tanques com tinta sublimática em vez da tinta original.\n• Epson SureColor F170 — impressora NATIVA de sublimação (já vem pronta, sem adaptação).\n• Sawgrass — também nativa, mais cara.\n\nCONFIGURAÇÃO DO DRIVER (Epson):\n1. Tipo de papel: "Premium Presentation Paper Matte" (Papel Fosco de Apresentação Premium)\n2. Qualidade: ALTA (nunca rascunho nem alta velocidade)\n3. Ative "Espelhar imagem" (Mirror Image)\n4. Desative a correção automática de cor do driver SE você usa perfil ICC\n5. Resolução: 300 DPI\n\nATENÇÃO NA CONVERSÃO:\n• A impressora precisa ser NOVA ou nunca ter usado tinta comum — se já usou tinta original, a conversão dá muito problema.\n• Depois de converter, não volte para tinta comum.\n• Impressora jato de tinta comum (HP, Canon com cartucho) NÃO serve para sublimação — precisa ser Epson com tanque (MicroPiezo) ou uma nativa.',
    quickReplies: ['Perfil de cor ICC: como instalar?', 'Preciso espelhar a imagem?', 'Qual o lado certo do papel sublimático?'],
  },
  {
    id: 'perfil-icc',
    title: 'Perfil de cor ICC',
    keywords: ['icc', 'perfil de cor', 'perfil de cores', 'perfil icc', 'calibrar cor', 'cor fiel', 'cores erradas', 'instalar perfil', 'perceptual'],
    answer:
      'Perfil de cor ICC — o que é e como instalar:\n\nO QUE É:\nO perfil ICC diz para a impressora como reproduzir as cores para a SUA combinação exata de impressora + tinta + papel. Sem ele, a cor da tela quase nunca bate com a cor da caneca.\n\nCOMO INSTALAR (exemplo Gênesis + Epson):\n1. Entre no site do fabricante da sua tinta (ex: Gênesis) e baixe o perfil do SEU modelo de impressora + SEU papel.\n2. Instale o arquivo .icc (botão direito > Instalar perfil, no Windows).\n3. No programa de arte (CorelDRAW, Photoshop), vá em Imprimir > Propriedades da impressora > aba Cor e selecione o perfil instalado.\n4. Intenção de renderização: PERCEPTUAL.\n5. No driver da Epson, DESATIVE a correção de cor da impressora (para não corrigir duas vezes) e desative a impressão bidirecional.\n6. Ative "Espelhar imagem".\n\nSINAIS DE QUE FALTA O PERFIL:\n• Cores apagadas na caneca, mesmo com tempo e temperatura certos.\n• Vermelho saindo laranja, azul saindo roxo, pele saindo amarelada.\n\nCada combinação (impressora + tinta + papel) tem seu perfil. Trocou o papel? Baixe o perfil daquele papel.',
    quickReplies: ['Que impressora usar para sublimação?', 'A cor saiu errada, o que fazer?', 'RGB ou CMYK?'],
  },
  {
    id: 'espelhar',
    title: 'Espelhar a imagem',
    keywords: ['espelhar', 'espelho', 'mirror', 'invertida', 'invertido', 'ao contrario', 'ao contrário', 'texto invertido', 'texto ao contrario', 'imagem invertida', 'espelhada'],
    answer:
      'Espelhar a imagem — regra obrigatória:\n\nA arte é transferida de cabeça para baixo: o papel fica virado para a caneca. Se você NÃO espelhar, o texto sai ao contrário e a imagem sai invertida.\n\nCOMO FAZER:\n• No driver da Epson: marque "Espelhar imagem" (Mirror Image) antes de imprimir.\n• No CorelDRAW/Photoshop/Illustrator: espelhe a arte antes de enviar para impressão.\n• Na Click & Gruda: as artes já vêm prontas para imprimir — é só ativar o espelhamento na hora de imprimir.\n\nEXCEÇÃO:\n• Arte totalmente simétrica (sem texto e sem direção) até passa sem espelhar, mas crie o hábito de espelhar SEMPRE.\n\nSe a sua caneca saiu com o texto ao contrário, a causa é 100% essa: a impressão não foi espelhada.',
    quickReplies: ['Passo a passo para sublimar uma caneca', 'Qual o lado certo do papel sublimático?', 'Que impressora usar para sublimação?'],
  },
  {
    id: 'rgb-cmyk',
    title: 'RGB ou CMYK',
    keywords: ['rgb', 'cmyk', 'espaco de cor', 'espaço de cor', 'cor rgb', 'cor cmyk', 'srgb', 'modo de cor'],
    answer:
      'RGB ou CMYK na sublimação:\n\n• CRIE A ARTE EM RGB — o RGB tem uma gama de cores maior, e a maioria dos fluxos de sublimação trabalha em RGB antes da conversão pelo perfil ICC.\n• A IMPRESSORA usa tinta CMYK sublimática, mas a conversão de RGB para CMYK é feita pelo perfil ICC na hora de imprimir.\n• NÃO converta a arte para CMYK manualmente antes de imprimir: você perde cores vibrantes à toa.\n• A cor da tela NUNCA será exatamente igual à da caneca: são três espaços de cor diferentes (tela sRGB, tinta CMYK, superfície da caneca). O perfil ICC é o que aproxima os três.\n• Se for trabalhar com foto, deixe a foto em RGB e confie no perfil ICC.\n\nResumo: crie em RGB, instale o perfil ICC certo e deixe o perfil fazer a conversão.',
    quickReplies: ['Perfil de cor ICC: como instalar?', 'A cor saiu errada, o que fazer?', 'Qualidade da imagem: quantos DPI?'],
  },
  {
    id: 'dpi',
    title: 'Resolução da imagem (DPI)',
    keywords: ['dpi', 'resolucao', 'resolução', 'qualidade da imagem', 'imagem borrada', 'pixelada', 'pixelado', 'baixa resolucao', 'baixa resolução', '300 dpi', 'nitidez', 'imagem embaçada'],
    answer:
      'Resolução da imagem — regra dos 300 DPI:\n\n• Use artes com PELO MENOS 300 DPI no tamanho final de impressão (21 x 9,5 cm). Abaixo disso, a imagem sai pixelada ou borrada na caneca.\n• Uma imagem de internet com 72 DPI, esticada para 21 cm, vai sair borrada — não tem como recuperar nitidez depois.\n• A Click & Gruda entrega as artes em 2480 x 1122 px (300 DPI no tamanho 21 x 9,5 cm), prontas para imprimir.\n• Antes de imprimir, confira: no seu programa, veja o tamanho real da imagem em cm e a resolução em DPI. Se estiver abaixo de 150 DPI no tamanho final, a culpa do borrado é da imagem, não da prensa.\n• Formato: prefira PNG (preserva transparência e nitidez) em vez de JPG para artes com texto e linhas finas.\n\nSe a impressão no papel já saiu borrada, o problema é a imagem ou a impressora — a prensa não borra uma impressão que já estava nítida.',
    quickReplies: ['Minha arte saiu borrada, por quê?', 'Qual o tamanho da arte da caneca?', 'Que impressora usar para sublimação?'],
  },
  {
    id: 'prensa',
    title: 'Prensa cilíndrica — ajuste e pressão',
    keywords: ['prensa', 'prensa cilindrica', 'prensa cilíndrica', 'ajustar pressao', 'ajustar pressão', 'pressao forte', 'pressão forte', 'pressao fraca', 'pressão fraca', 'resistencia', 'resistência', 'como ajustar a prensa', 'alavanca'],
    answer:
      'Prensa cilíndrica — ajuste e pressão:\n\nCOMO REGULAR A PRESSÃO:\n1. Ligue a prensa e deixe chegar na temperatura de trabalho (200 °C) ANTES de regular — a resistência dilata com o calor e a regulagem muda.\n2. Coloque a caneca (com o papel) e feche a alavanca. A pressão certa é quando a alavanca fecha com firmeza, mas sem você precisar forçar o corpo.\n3. A caneca NÃO pode girar dentro da resistência quando fechada.\n4. Entre uma caneca e outra, confira a regulagem: a dilatação da resistência pode afrouxar ou apertar.\n\nPRESSÃO ERRADA — SINTOMAS:\n• Pressão FRACA: cores fracas e falhadas, principalmente nas bordas e na base.\n• Pressão FORTE demais: marca a caneca, amassa squeeze de alumínio, pode quebrar vidro e deixa marca da borda do papel.\n\nOUTROS CUIDADOS:\n• Pré-aqueça a prensa antes de começar o lote.\n• Use a resistência do diâmetro certo para cada caneca (caneca 325 ml, squeeze, cônica e xícara usam resistências diferentes).\n• Limpe a resistência com pano seco quando esfriar — resíduo de papel queimado mancha a próxima caneca.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Minha arte saiu desbotada, e agora?', 'Partes da arte não transferiram'],
  },
  {
    id: 'pre-aquecimento',
    title: 'Pré-aquecimento da caneca',
    keywords: ['pre aquecer', 'pré aquecer', 'pre-aquecimento', 'pré-aquecimento', 'aquecer a caneca', 'preaquecer', 'umidade', 'caneca umida', 'caneca úmida'],
    answer:
      'Pré-aquecimento da caneca — por que e como fazer:\n\nPOR QUE:\nA cerâmica absorve umidade do ar. Se você prensar a caneca úmida, a umidade vira vapor durante a prensagem e causa manchas brancas, bolhas e cores falhadas.\n\nCOMO FAZER:\n1. Coloque a caneca vazia na prensa já quente.\n2. Pré-aqueça o FUNDO por 10 segundos e o restante da caneca por 3 segundos (recomendação dos fabricantes).\n3. Tire a caneca, deixe esfriar uns segundos e posicione a arte.\n\nTAMBÉM PRÉ-AQUEÇA O PAPEL:\n• Aqueça o papel sublimático na prensa por 5 segundos antes de imprimir — tira a umidade do papel e melhora a transferência.\n\nEm dias úmidos ou chuvosos, o pré-aquecimento é ainda mais importante. Se as manchas brancas aparecerem do nada num dia de chuva, a umidade é a primeira suspeita.',
    quickReplies: ['Como evitar manchas brancas?', 'Passo a passo para sublimar uma caneca', 'Como limpar a caneca antes de sublimar?'],
  },
  {
    id: 'tamanho-arte',
    title: 'Tamanho da arte da caneca',
    keywords: ['tamanho da arte', 'tamanho', '21x9', '21 x 9', 'medida da arte', 'gabarito', 'dimensao', 'dimensão', 'largura', 'altura da arte', '2480'],
    answer:
      'Tamanho da arte da caneca:\n\n• Caneca cerâmica 325 ml: 21 x 9,5 cm (2480 x 1122 px a 300 DPI).\n• Caneca mágica: 20 x 9 cm.\n• Caneca preta com tarja: 19,4 x 8,5 cm (só a tarja).\n• Caneca glitter: 21 x 9,8 cm.\n• Xícara 180 ml: arte menor, proporcional ao diâmetro (não use o gabarito da 325 ml).\n\nREGRAS PRÁTICAS:\n1. Meça a circunferência da SUA caneca com uma fita métrica — marcas diferentes variam alguns milímetros.\n2. Deixe uma pequena sobreposição (2 a 3 mm) onde as pontas do papel se encontram, para não ficar uma linha branca na emenda.\n3. Não estique uma arte pequena para 21 cm: ela perde nitidez. Use artes no tamanho certo — as da Click & Gruda já vêm em 21 x 9,5 cm.\n4. Centralize a arte na altura: deixe a mesma margem em cima e embaixo.\n5. Se a arte for só na frente (não volta inteira), posicione no centro da caneca, do lado oposto à alça.',
    quickReplies: ['Linha branca na emenda, como resolver?', 'Preciso espelhar a imagem?', 'Qualidade da imagem: quantos DPI?'],
  },
  {
    id: 'limpar-caneca',
    title: 'Limpar a caneca antes de sublimar',
    keywords: ['limpar', 'limpeza', 'limpar a caneca', 'poeira', 'gordura', 'dedo', 'marca de dedo', 'preparar a caneca', 'preparacao', 'preparação'],
    answer:
      'Limpar a caneca antes de sublimar:\n\n1. Passe um pano limpo e seco (sem fiapos) em toda a caneca.\n2. Se tiver gordura ou marca de dedo, limpe com álcool isopropílico e deixe secar.\n3. NÃO toque na área da arte com os dedos depois de limpa — a gordura da mão vira mancha na sublimação.\n4. Segure a caneca pela alça ou por dentro enquanto posiciona o papel.\n5. Faça o pré-aquecimento (10 s no fundo, 3 s no restante) para tirar a umidade.\n\nUma caneca com poeira ou gordura é uma das causas mais bobas de manchas — e das mais comuns. Cinco segundos de limpeza evitam uma caneca perdida.',
    quickReplies: ['Como evitar manchas brancas?', 'Passo a passo para sublimar uma caneca', 'Pré-aquecimento da caneca'],
  },
  {
    id: 'fita-termica',
    title: 'Fita térmica',
    keywords: ['fita', 'fita termica', 'fita térmica', 'fita kapton', 'kapton', 'fixar o papel', 'prender o papel', 'papel se mexendo', 'papel se movendo'],
    answer:
      'Fita térmica — sua melhor amiga contra o fantasma:\n\n1. Use SEMPRE fita térmica (a marrom/amarelada, resistente ao calor). Fita comum DERRETE na prensa e gruda na caneca.\n2. Fixe o papel em pelo menos 3 pontos: em cima, embaixo e na emenda.\n3. Estique bem o papel antes de fixar: papel enrugado ou com dobra transfere a dobra para a caneca.\n4. Na emenda, cole a fita por cima da sobreposição do papel, bem rente.\n5. Não economize fita: o custo dela é centavos, e uma caneca perdida por causa de papel que se mexeu custa muito mais.\n\nA fita térmica também serve para fixar a arte em squeeze e em peças curvas. Guarde os rolos longe do calor e da umidade.',
    quickReplies: ['Como evitar imagem fantasma?', 'Passo a passo para sublimar uma caneca', 'Minha arte saiu borrada, por quê?'],
  },
  {
    id: 'resfriamento',
    title: 'Resfriamento e retirada do papel',
    keywords: ['esfriar', 'resfriar', 'resfriamento', 'retirar o papel', 'tirar o papel', 'quente ou frio', 'retirar quente', 'retirar frio', 'mergulhar', 'agua fria', 'água fria', 'cura', 'esperar esfriar'],
    answer:
      'Resfriamento e retirada do papel:\n\nRETIRAR O PAPEL:\n• Caneca cerâmica comum: retire o papel logo após abrir a prensa, num movimento único e suave, sem arrastar o papel sobre a caneca quente. Arrastar = fantasma.\n• Caneca mágica: ESPERE ESFRIAR antes de tirar o papel — o revestimento termossensível é sensível ao calor.\n\nESFRIAMENTO:\n• Deixe a caneca esfriar NATURALMENTE, em pé, sobre uma superfície que aguente calor.\n• NUNCA mergulhe a caneca quente em água fria: o choque térmico pode trincar a cerâmica e o vidro.\n• Não coloque a caneca quente sobre superfície fria e úmida.\n\nA COR FINAL:\n• A cor só aparece de verdade depois que a caneca esfria. Quente, ela parece mais escura ou diferente — não se assuste.\n• A sublimação "cura" com o resfriamento: a tinta termina de fixar no polímero enquanto a peça esfria.',
    quickReplies: ['Como evitar imagem fantasma?', 'Caneca mágica: temperatura e tempo', 'Como lavar a caneca sublimada?'],
  },

  {
    id: 'desbotada',
    title: 'Arte desbotada / cor fraca',
    keywords: ['desbotada', 'desbotado', 'desbotou', 'fraca', 'fraco', 'apagada', 'apagado', 'sem brilho', 'cor fraca', 'cores fracas', 'sem cor', 'clarinha', 'pálida', 'palida', 'deslavada', 'opaca', 'opaco'],
    answer:
      'Arte desbotada ou com cor fraca — causas e soluções:\n\nCAUSAS (da mais comum para a mais rara):\n1. TEMPO OU TEMPERATURA BAIXOS — a tinta não virou gás por completo. Aumente o tempo em 10 a 20 segundos (antes de mexer na temperatura).\n2. PRESSÃO FRACA — o papel não encostou bem na caneca. Regule a prensa quente, com a caneca dentro.\n3. PAPEL OU TINTA DE BAIXA QUALIDADE — não existe configuração que salve insumo ruim.\n4. PERFIL DE COR FALTANDO — sem o ICC certo, as cores saem apagadas. Instale o perfil do fabricante da tinta.\n5. CANECA SEM REVESTIMENTO — caneca comum, sem polímero, não fixa a tinta.\n6. IMPRESSÃO EM MODO RASCUNHO — imprima sempre em qualidade ALTA, 300 DPI.\n\nCOMO DESCOBRIR A CAUSA:\n• Mude UMA coisa por vez. Se mudar temperatura, tempo e papel ao mesmo tempo, você não sabe o que resolveu.\n• Teste padrão: 200 °C, 180 s, pressão média, papel e tinta de marca conhecida, perfil ICC instalado.\n• Se a impressão no papel já saiu fraca, o problema é impressora/tinta/perfil — não é a prensa.\n• Se SÓ as bordas saíram fracas, é pressão irregular ou resistência de diâmetro errado.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Perfil de cor ICC: como instalar?', 'Como ajustar a pressão da prensa?'],
  },
  {
    id: 'fantasma',
    title: 'Imagem fantasma (ghosting)',
    keywords: ['fantasma', 'ghosting', 'sombra', 'duplicada', 'duplicado', 'dupla', 'imagem dupla', 'deslocada', 'deslocado', 'borrao', 'borrão', 'imagem com sombra', 'efeito fantasma'],
    answer:
      'Imagem fantasma (ghosting) — aquela sombra ou imagem duplicada ao lado da arte:\n\nCAUSA: o papel SE MEXEU durante ou logo depois da prensagem, enquanto a tinta ainda estava em estado gasoso. A tinta transferiu uma vez, o papel deslocou um milímetro e transferiu de novo.\n\nCOMO EVITAR:\n1. FITA TÉRMICA em pelo menos 3 pontos: em cima, embaixo e na emenda. Não economize fita.\n2. Estique bem o papel antes de fixar — papel frouxo escorrega.\n3. Abra a prensa com cuidado, sem puxar ou balançar a caneca.\n4. Retire o papel num movimento único e suave, SEM arrastar sobre a caneca quente.\n5. Não deixe a caneca quente balançando na bancada enquanto o papel ainda está nela.\n\nCOMO IDENTIFICAR:\n• O fantasma aparece como uma segunda imagem mais clara, levemente deslocada para um lado.\n• Se a imagem inteira está borrada sem duplicação, o problema é outro (resolução baixa ou calor demais).\n\nInfelizmente, caneca com fantasma não tem conserto — é refazer. Mas com fita térmica bem colocada, o fantasma praticamente some.',
    quickReplies: ['Fita térmica: como usar?', 'Como retirar o papel depois de prensar?', 'Passo a passo para sublimar uma caneca'],
  },
  {
    id: 'borrada',
    title: 'Arte borrada',
    keywords: ['borrada', 'borrado', 'borrou', 'embaçada', 'embacada', 'embaçado', 'desfocada', 'desfocado', 'sem nitidez', 'falhada', 'falhado'],
    answer:
      'Arte borrada — descubra onde está o problema:\n\n1. A IMPRESSÃO NO PAPEL JÁ SAIU BORRADA?\n• Sim: o problema é a imagem (resolução abaixo de 300 DPI) ou a impressora (modo rascunho, bico entupido, tinta úmida). A prensa não borra uma impressão nítida.\n• Verifique: imprima em qualidade ALTA, 300 DPI, e deixe secar antes de prensar.\n\n2. A IMPRESSÃO ESTAVA NÍTIDA, MAS A CANECA SAIU BORRADA?\n• CALOR DEMAIS: tempo ou temperatura acima do ideal fazem a tinta se espalhar além do desenho. Reduza 10 a 20 segundos.\n• PAPEL SE MEXEU: veja a resposta sobre imagem fantasma — use fita térmica.\n• PAPEL ÚMIDO: umidade vira vapor e espalha a tinta. Pré-aqueça o papel (5 s na prensa) e a caneca.\n• PRESSÃO EXCESSIVA: em peças sensíveis, pressão forte espalha a tinta.\n\nREGRA: se o borrado é uniforme na caneca toda, é calor ou imagem. Se é só numa direção (sombra), é fantasma (papel que se moveu).',
    quickReplies: ['Qualidade da imagem: quantos DPI?', 'Como evitar imagem fantasma?', 'Qual a temperatura ideal da caneca?'],
  },
  {
    id: 'amarelada',
    title: 'Arte amarelada / queimada',
    keywords: ['amarelada', 'amarelado', 'amarelou', 'queimada', 'queimado', 'queimou', 'marrom', 'escura', 'escuro', 'mancha amarela', 'tom amarelado', 'superaquecimento', 'super aquecimento'],
    answer:
      'Arte amarelada ou com aspecto queimado:\n\nCAUSA: calor ou tempo DEMAIS. A tinta passou do ponto e o revestimento da caneca começou a amarelar.\n\nSOLUÇÃO:\n1. Reduza o tempo em 10 a 20 segundos (mantenha os 200 °C).\n2. Se ainda amarelar, reduza a temperatura para 190 °C e teste de novo.\n3. Confira se o termostato da prensa está certo: prensas antigas podem marcar 200 °C e estar a 220 °C de verdade. Um termômetro infravermelho ajuda a conferir.\n4. Não deixe a caneca na prensa depois que o timer apitar.\n\nATENÇÃO:\n• Amarelado também aparece quando a resistência está suja com resíduo de papel queimado — limpe a resistência com pano seco quando esfriar.\n• Se o amarelado é só nas bordas, pode ser pressão forte demais concentrando calor na borda.\n\nLembre: é mais fácil corrigir cor fraca (aumentando o tempo) do que corrigir queimado. Comece sempre pelo tempo menor e vá subindo.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Minha arte saiu desbotada, e agora?', 'Como ajustar a pressão da prensa?'],
  },
  {
    id: 'manchas-brancas',
    title: 'Manchas brancas / falhas',
    keywords: ['mancha branca', 'manchas brancas', 'manchas', 'mancha', 'falha', 'falhas', 'bolha', 'bolhas', 'branco', 'pontos brancos', 'falhado'],
    answer:
      'Manchas brancas ou falhas na arte:\n\nCAUSAS MAIS COMUNS:\n1. UMIDADE — a número 1. Caneca ou papel úmido: a umidade vira vapor na prensagem e impede a tinta de fixar. Solução: pré-aqueça a caneca (10 s fundo + 3 s restante) e o papel (5 s). Em dia de chuva, redobre o cuidado.\n2. GORDURA OU DEDO — marca de dedo ou gordura na caneca vira mancha branca. Limpe com pano seco e álcool isopropílico, e não toque na área da arte.\n3. POEIRA — poeira na caneca ou no papel vira pontinho branco. Limpe antes de posicionar.\n4. PRESSÃO IRREGULAR — falha só num lado: a resistência não está encostando direito (diâmetro errado ou regulagem).\n5. PAPEL ENRUGADO — dobra no papel vira falha na transferência. Estique bem o papel.\n6. RESISTÊNCIA SUJA — resíduo grudado na resistência transfere sujeira. Limpe com pano seco.\n\nSe as manchas apareceram do nada num dia úmido, é umidade. Se apareceram depois de trocar de caneca, é a qualidade do revestimento do novo lote.',
    quickReplies: ['Pré-aquecimento da caneca', 'Como limpar a caneca antes de sublimar?', 'Qual a temperatura ideal da caneca?'],
  },
  {
    id: 'cor-errada',
    title: 'Cor errada (diferente da tela)',
    keywords: ['cor errada', 'cores erradas', 'cor diferente', 'vermelho laranja', 'azul roxo', 'cor estranha', 'nao bate a cor', 'não bate a cor', 'cor nao bate', 'cor não bate', 'tons errados', 'pele amarelada', 'cor alterada'],
    answer:
      'A cor saiu diferente da tela — causas e soluções:\n\n1. FALTA O PERFIL ICC — a causa número 1. Sem o perfil da sua tinta + impressora + papel, o vermelho vira laranja, o azul vira roxo e a pele fica amarelada. Instale o perfil do fabricante da tinta.\n2. CORREÇÃO DUPLA — você ativou o perfil ICC E deixou a correção de cor do driver ligada. Desative a correção do driver quando usar ICC.\n3. MODO DE COR ERRADO — crie a arte em RGB, não converta para CMYK manualmente.\n4. TINTA DE MARCA DIFERENTE — trocou a tinta e não trocou o perfil? Cada tinta tem seu perfil.\n5. A TELA ENGANA — monitor sem calibrar mostra cores diferentes. A cor da tela nunca será 100% igual à da caneca; o perfil ICC é o que mais aproxima.\n\nTESTE PRÁTICO:\nImprima uma escala de cores (um arquivo com vários tons) e prense numa caneca de teste. Anote qual configuração deu o tom mais fiel e use como referência.\n\nSe as cores estão apenas FRACAS (não erradas), veja a resposta sobre arte desbotada.',
    quickReplies: ['Perfil de cor ICC: como instalar?', 'RGB ou CMYK?', 'Minha arte saiu desbotada, e agora?'],
  },
  {
    id: 'sem-transferir',
    title: 'Partes da arte não transferiram',
    keywords: ['nao transferiu', 'não transferiu', 'nao pegou', 'não pegou', 'falta um pedaco', 'falta um pedaço', 'incompleta', 'incompleto', 'só o meio', 'so o meio', 'só a parte de cima', 'só embaixo', 'base fraca', 'borda fraca', 'laterais fracas'],
    answer:
      'Partes da arte não transferiram (falha localizada):\n\n1. SÓ A BASE OU SÓ AS BORDAS FALHARAM:\n• Pressão irregular — a resistência não encosta igual em toda a caneca. Regule com a prensa quente.\n• Resistência de diâmetro errado para a caneca.\n• Solução para a base: gire a caneca 180° e prense mais 60 segundos.\n\n2. SÓ UM LADO FALHOU:\n• O papel não estava bem esticado ou a fita soltou de um lado.\n• A caneca estava torta dentro da resistência.\n\n3. NADA TRANSFERIU (a caneca saiu quase branca):\n• Você imprimiu no lado ERRADO do papel (o verso, sem revestimento).\n• Tinta comum em vez de tinta sublimática.\n• Caneca sem revestimento de polímero (caneca comum de mercado).\n• Prensa não aqueceu de verdade (termostato com problema).\n\n4. A ARTE SAIU CORTADA OU DESLOCADA:\n• O papel se moveu na prensagem — use fita térmica.\n• A arte estava maior que a área da caneca.\n\nDica: quando a falha é sempre no mesmo lugar, o problema é mecânico (pressão/resistência), não é temperatura.',
    quickReplies: ['Como ajustar a pressão da prensa?', 'Qual o lado certo do papel sublimático?', 'Como evitar imagem fantasma?'],
  },
  {
    id: 'papel-grudando',
    title: 'Papel grudando na caneca',
    keywords: ['papel grudou', 'papel grudando', 'grudou', 'grudando', 'papel colado', 'papel nao sai', 'papel não sai', 'papel preso', 'residuo', 'resíduo', 'papel rasgando'],
    answer:
      'Papel grudando na caneca depois de prensar:\n\nCAUSAS:\n1. TEMPERATURA OU TEMPO DEMAIS — o papel "cozinhou" e grudou no revestimento. Reduza 10 a 20 segundos.\n2. PAPEL DE BAIXA QUALIDADE — papéis ruins grudam mais, principalmente os muito finos.\n3. TINTA EXCEDENTE — impressão com tinta demais (modo de qualidade errado) gruda o papel.\n4. CANECA DE REVESTIMENTO RUIM — alguns lotes de caneca barata têm resina que gruda no papel.\n\nO QUE FAZER:\n• Deixe a caneca esfriar um pouco antes de puxar o papel — com a caneca morna, o papel solta mais fácil.\n• Puxe o papel devagar, num movimento contínuo, sem arrancar de uma vez.\n• Se ficar resíduo de papel grudado, passe um pano úmido (caneca já fria) e esfregue de leve com a parte macia da esponja.\n• NUNCA raspe com objeto duro — risca o revestimento.\n\nPREVENÇÃO:\n• Use papel sublimático de marca conhecida e gramatura adequada (90 g/m²+).\n• Respeite tempo e temperatura — papel grudando é quase sempre excesso de calor.',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Qual o lado certo do papel sublimático?', 'Como retirar o papel depois de prensar?'],
  },
  {
    id: 'linha-emenda',
    title: 'Linha branca na emenda',
    keywords: ['linha branca', 'emenda', 'risco branco', 'faixa branca', 'juncao', 'junção', 'encontro do papel', 'costura'],
    answer:
      'Linha branca na emenda (onde as pontas do papel se encontram):\n\nCAUSA: a arte ficou mais estreita que a circunferência da caneca — sobrou um filete sem cobertura.\n\nCOMO RESOLVER:\n1. MEÇA a circunferência da sua caneca com fita métrica (marcas variam alguns milímetros).\n2. Faça a arte 2 a 3 mm MAIS LARGA que a medida, deixando uma pequena sobreposição na emenda.\n3. Na sobreposição, cole a fita térmica por cima, bem rente, para o papel não abrir.\n4. Se a linha é muito fina (1 mm), geralmente é só a medida: aumente a largura da arte em 2 mm e teste de novo.\n\nATENÇÃO:\n• Não adianta aumentar tempo ou temperatura — linha branca é problema de MEDIDA, não de calor.\n• Se você usa artes prontas da Click & Gruda (21 cm), e a linha aparece numa marca específica de caneca, meça essa caneca: ela pode ter circunferência maior que 21 cm.',
    quickReplies: ['Qual o tamanho da arte da caneca?', 'Fita térmica: como usar?', 'Passo a passo para sublimar uma caneca'],
  },
  {
    id: 'quais-funcionam',
    title: 'Quais canecas podem ser sublimadas',
    keywords: ['quais canecas', 'que canecas', 'quais produtos', 'que produtos', 'pode sublimar', 'podem ser sublimadas', 'serve para sublimar', 'funciona', 'polimero', 'polímero', 'resinada', 'resinado', 'revestimento'],
    answer:
      'Quais canecas podem ser sublimadas:\n\nA regra é simples: a caneca precisa ter um REVESTIMENTO DE POLÍMERO (resina) próprio para sublimação. A tinta só fixa nesse revestimento.\n\nPODEM SER SUBLIMADAS:\n• Caneca de cerâmica branca resinada 325 ml (a mais comum)\n• Caneca mágica (termossensível)\n• Caneca metalizada (dourada, prateada, cobre)\n• Caneca glitter\n• Caneca cônica resinada\n• Caneca de chope de cerâmica ou vidro fosco resinado\n• Xícara 180 ml resinada\n• Caneca preta com tarja branca (só a tarja)\n• Squeeze de alumínio e inox com revestimento\n• Caneca de vidro fosco/jateado com tratamento\n\nCOMO IDENTIFICAR:\n• O fornecedor vende como "para sublimação" — compre sempre de fornecedor de sublimação, não de loja comum.\n• A caneca resinada tem um leve brilho diferente e a superfície bem lisa.\n• Na dúvida, faça o teste: sublime uma arte pequena. Se não fixar nada, não é resinada.\n\nLembre: a tinta de sublimação é translúcida e não tem branco — sobre fundo escuro ou metalizado, o branco da arte não aparece.',
    quickReplies: ['Quais canecas NÃO podem ser sublimadas?', 'Qual a temperatura ideal da caneca?', 'Onde comprar insumos?'],
  },
  {
    id: 'quais-nao-funcionam',
    title: 'Quais canecas NÃO podem ser sublimadas',
    keywords: ['nao pode', 'não pode', 'nao funciona', 'não funciona', 'nao serve', 'não serve', 'caneca comum', 'caneca de mercado', 'porcelana comum', 'plastico', 'plástico', 'acrilico', 'acrílico', 'inox sem revestimento', 'nao sublima', 'não sublima'],
    answer:
      'Quais canecas NÃO podem ser sublimadas:\n\n• Caneca de cerâmica COMUM (de mercado, sem resina) — a tinta não fixa, sai tudo na lavagem.\n• Caneca de porcelana comum sem tratamento.\n• Caneca de plástico ou acrílico — derrete na prensa.\n• Caneca de vidro transparente comum — sem revestimento, a tinta não fixa.\n• Caneca de inox ou alumínio SEM revestimento sublimático.\n• Caneca de barro ou cerâmica artesanal sem resina.\n• Qualquer caneca com a superfície áspera, porosa ou sem o brilho da resina.\n\nCOMO NÃO CAIR NESSA:\n• Compre canecas de fornecedores de sublimação, que vendem o produto já resinado e especificado "para sublimação".\n• Desconfie de caneca muito barata sem especificação: o barato sai caro em retrabalho.\n• Se você comprou caneca comum por engano, ela NÃO vira sublimável — não existe "verniz caseiro" confiável para resiná-la.\n\nSe a sua arte não fixou nada na caneca, a primeira suspeita é essa: a caneca não era resinada.',
    quickReplies: ['Quais canecas podem ser sublimadas?', 'Minha arte saiu desbotada, e agora?', 'Onde comprar insumos?'],
  },
  {
    id: 'economizar-tinta',
    title: 'Economizar tinta e evitar desperdício',
    keywords: ['economizar', 'economia', 'desperdicio', 'desperdício', 'gastar menos', 'tinta cara', 'aproveitar papel', 'evitar desperdicio', 'evitar desperdício', 'custo'],
    answer:
      'Dicas para economizar tinta e evitar desperdício:\n\n1. APROVEITE A FOLHA — monte 2 artes na mesma folha A4 quando a arte for menor (ex: 2 xícaras), ou imprima a arte da caneca e complete o espaço com etiquetas e miniartes.\n2. IMPRIMA SÓ O NECESSÁRIO — não imprima o lote inteiro antes de testar 1 caneca. Um teste evita 10 canecas perdidas.\n3. NÃO IMPRIMA EM RASCUNHO — parece economia, mas a qualidade cai e você perde a caneca (que custa mais que a tinta).\n4. MANTENHA A IMPRESSORA ATIVA — imprima pelo menos 1 folha por semana: limpeza de bico por entupimento gasta muito mais tinta que uma impressão semanal.\n5. CUIDE DO PAPEL — papel úmido ou amassado é folha e tinta no lixo. Guarde em local seco.\n6. REAPROVEITE O PAPEL DE TESTE — o verso de uma impressão com erro pode servir para testar temperatura (não para vender).\n7. FAÇA A MANUTENÇÃO — bico entupido faz a impressora gastar tinta em limpezas. Verificação de jatos semanal evita isso.\n8. COMPRE INSUMOS DE QUALIDADE — tinta e papel baratos dão mais retrabalho e mais perda do que a economia inicial.\n\nA maior economia da sublimação não é tinta: é NÃO ERRAR a caneca. Cada caneca perdida custa o valor da caneca + papel + tinta + tempo.',
    quickReplies: ['Como precificar minhas canecas?', 'Materiais que preciso ter em estoque', 'Minha arte saiu desbotada, e agora?'],
  },
  {
    id: 'evitar-erros',
    title: 'O que EVITAR — erros de iniciante',
    keywords: ['evitar', 'erros', 'erro comum', 'erros de iniciante', 'iniciante', 'nao fazer', 'não fazer', 'cuidado', 'armadilha', 'o que nao fazer', 'o que não fazer'],
    answer:
      'Os 10 erros que mais fazem iniciante perder caneca (e dinheiro):\n\n1. NÃO ESPELHAR a imagem — texto sai ao contrário. Espelhe SEMPRE.\n2. IMPRIMIR NO LADO ERRADO do papel — imprima no lado branco e liso.\n3. PRENSAR COM A TINTA ÚMIDA — espere a impressão secar.\n4. NÃO USAR FITA TÉRMICA — o papel se mexe e dá fantasma.\n5. CONTAR O TEMPO ANTES da prensa voltar à temperatura — espere voltar a 200 °C.\n6. USAR CANECA COMUM sem resina — a tinta não fixa.\n7. MUDAR TUDO DE UMA VEZ quando dá errado — mude uma coisa por vez para saber o que resolveu.\n8. NÃO FAZER TESTE antes do lote — 1 caneca de teste evita 10 perdidas.\n9. TOCAR NA ÁREA DA ARTE com o dedo — gordura vira mancha.\n10. MERGULHAR A CANECA QUENTE em água fria — choque térmico trinca a cerâmica.\n\nBÔNUS: não compre insumo sem procedência só porque é barato. Papel, tinta e caneca ruins são a causa de metade dos problemas de quem está começando.',
    quickReplies: ['Passo a passo para sublimar uma caneca', 'Minha arte saiu desbotada, e agora?', 'Como evitar imagem fantasma?'],
  },
  {
    id: 'materiais-estoque',
    title: 'Materiais e insumos — o que ter em estoque',
    keywords: ['materiais', 'insumos', 'estoque', 'o que preciso', 'o que comprar', 'lista de materiais', 'equipamentos', 'o que ter', 'kit inicial', 'comecar', 'começar', 'investimento inicial'],
    answer:
      'Materiais e insumos para começar (e manter em estoque):\n\nEQUIPAMENTOS (compra única):\n• Impressora Epson EcoTank (L3250 é a mais comum) + tinta sublimática\n• Prensa cilíndrica para canecas (com resistência 325 ml; depois compre as de squeeze e cônica)\n• Computador com CorelDRAW, Photoshop ou programa gratuito (Photopea, Canva)\n\nINSUMOS (reposição constante):\n• Canecas resinadas 325 ml (branca e mágica são as que mais vendem)\n• Papel sublimático A4 (90 g/m²+ para canecas)\n• Tinta sublimática (CMYK)\n• Fita térmica\n• Caixas para presente e plástico bolha (embalagem vende!)\n\nCONSUMO DE APOIO:\n• Pano limpo sem fiapos e álcool isopropílico (limpeza)\n• Luvas (evita marca de dedo e queimadura)\n• Termômetro infravermelho (confere se a prensa marca a temperatura real)\n\nESTOQUE MÍNIMO SUGERIDO:\n• 36 canecas brancas + 12 mágicas (caixa fechada sai mais barato)\n• 1 pacote de papel (100 folhas)\n• 1 jogo de tinta reserva\n• 2 rolos de fita térmica\n\nNunca deixe zerar a fita térmica e o papel no meio de um pedido — são os itens mais baratos e os que mais travam a produção.',
    quickReplies: ['Onde comprar insumos?', 'Como precificar minhas canecas?', 'Que impressora usar para sublimação?'],
  },
  {
    id: 'precificacao',
    title: 'Precificação básica e margem',
    keywords: ['preco', 'preço', 'precificar', 'precificacao', 'precificação', 'quanto cobrar', 'quanto custa', 'margem', 'lucro', 'valor da caneca', 'vender por quanto', 'calcular preco', 'calcular preço'],
    answer:
      'Precificação básica da caneca sublimada (orientação — ajuste para sua realidade):\n\nCOMO CALCULAR:\nPreço = (custo da caneca + papel + tinta + embalagem + energia) + seu tempo + margem de lucro\n\n1. SOME OS CUSTOS DIRETOS: caneca resinada + fração do papel + fração da tinta + fita + caixa/embalagem.\n2. SOME SEU TEMPO: quanto vale sua hora? Uma caneca leva de 5 a 10 minutos entre imprimir, prensar e embalar.\n3. ADICIONE A MARGEM: trabalhe com margem de 50% a 100% sobre o custo total (custo + tempo). Personalizados são produto de valor agregado, não commodity.\n4. COMPARE O MERCADO: veja quanto cobram na sua cidade, mas não entre em guerra de preço com quem vende caneca comum — o seu diferencial é a arte e o acabamento.\n\nDICAS:\n• Caneca mágica, glitter e metalizada custam mais caro para você — cobre mais caro por elas.\n• Pedido em quantidade (lembrancinha de festa) pode ter desconto por volume, mas nunca abaixo do seu custo + tempo.\n• Embalagem para presente agrega valor: uma caixa bonita justifica um preço maior.\n• Não esqueça os custos invisíveis: taxa da maquininha, frete, reposição de resistência da prensa e canecas de teste.\n\nNão inventei valores fixos aqui porque os preços de insumo mudam por região e fornecedor — faça a conta com os SEUS custos reais.',
    quickReplies: ['Materiais que preciso ter em estoque', 'Dicas para economizar tinta', 'Onde comprar insumos?'],
  },
  {
    id: 'onde-comprar',
    title: 'Onde comprar insumos',
    keywords: ['onde comprar', 'comprar insumos', 'fornecedor', 'fornecedores', 'loja de sublimacao', 'loja de sublimação', 'comprar caneca', 'comprar papel', 'atacado', 'distribuidor'],
    answer:
      'Onde comprar insumos de sublimação:\n\n• FORNECEDORES ESPECIALIZADOS em sublimação (lojas de insumos para personalizados) — são a melhor opção: vendem caneca já resinada, papel e tinta com especificação certa. Exemplos de marcas/fornecedores conhecidos no Brasil: Live Sub, Metalnox, Pampa Tech, Gênesis (tinta), Jojo (papel).\n• ATACADO — compre a caixa fechada de canecas (geralmente 36 unidades): o preço unitário cai bastante.\n• MARKETPLACES — dá para comprar, mas confira a reputação do vendedor e se o produto é especificado "para sublimação". Caneca sem especificação é loteria.\n\nO QUE CONFERIR ANTES DE COMPRAR:\n1. A caneca é "para sublimação" (resinada)?\n2. O papel é sublimático e qual a gramatura?\n3. A tinta é sublimática e compatível com sua impressora?\n4. O fornecedor tem nota fiscal e troca em caso de defeito?\n\nEvite comprar caneca em loja de utilidades domésticas: sem resina, não sublima. E desconfie de preço muito abaixo do mercado — insumo ruim é o maior gerador de retrabalho.',
    quickReplies: ['Materiais que preciso ter em estoque', 'Quais canecas podem ser sublimadas?', 'Como precificar minhas canecas?'],
  },
  {
    id: 'lavar-caneca',
    title: 'Como lavar e cuidar da caneca sublimada',
    keywords: ['lavar', 'lavagem', 'limpeza da caneca pronta', 'microondas', 'micro-ondas', 'lava loucas', 'lava-louças', 'durabilidade', 'dura quanto tempo', 'desbota com o tempo', 'cuidados'],
    answer:
      'Como lavar e cuidar da caneca sublimada:\n\nLAVAGEM:\n• Lave com água e sabão neutro, usando a parte MACIA da esponja.\n• A parte áspera da esponja risca o revestimento e vai apagando a arte com o tempo.\n• A sublimação é permanente (a tinta penetra no polímero), então a arte não sai com lavagem normal.\n\nO QUE EVITAR:\n• Micro-ondas: evite, principalmente em caneca mágica, glitter e metalizada — o calor degrada o revestimento.\n• Lava-louças: o detergente forte e o calor reduzem a vida útil da estampa. Lavar à mão dura muito mais.\n• Esponja de aço ou lado áspero: risca e fosqueia.\n• Deixar de molho por horas: não é necessário e pode enfraquecer o revestimento.\n\nDURABILIDADE:\n• Com cuidado normal (lavar à mão, sabão neutro), a estampa dura anos sem desbotar.\n• Avise o cliente: a caneca sublimada é para uso diário, mas lavar à mão preserva a arte por muito mais tempo.\n\nDica de venda: inclua um cartãozinho de cuidados junto com a caneca — o cliente percebe o capricho e a arte dura mais.',
    quickReplies: ['Caneca mágica: temperatura e tempo', 'Quais canecas podem ser sublimadas?', 'Como precificar minhas canecas?'],
  },
  {
    id: 'o-que-e-sublimacao',
    title: 'O que é sublimação',
    keywords: ['o que e sublimacao', 'o que é sublimação', 'sublimacao', 'sublimação', 'como funciona a sublimacao', 'como funciona a sublimação', 'o que significa'],
    answer:
      'O que é sublimação:\n\nSublimação é uma técnica de personalização em que a tinta, ao ser aquecida (cerca de 180 a 200 °C), vira GÁS e penetra no revestimento de polímero do objeto — sem passar pelo estado líquido. Quando esfria, a tinta fica presa DENTRO do revestimento, e não por cima dele.\n\nPor isso a estampa sublimada:\n• Não descasca, não craquela e não tem relevo\n• Não sai na lavagem\n• Tem cores vibrantes e duradouras\n\nO QUE VOCÊ PRECISA:\n1. Impressora com tinta sublimática\n2. Papel sublimático\n3. Prensa térmica\n4. Objeto com revestimento de polímero (caneca resinada, tecido 100% poliéster, etc.)\n\nLIMITES DA TÉCNICA:\n• Só funciona em materiais com polímero/poliéster ou com revestimento próprio.\n• A tinta é translúcida e não tem branco: só funciona bem sobre fundo claro.\n• Não sublima algodão puro nem materiais sem tratamento.\n\nQuer o passo a passo completo? Pergunte "passo a passo para sublimar uma caneca".',
    quickReplies: ['Passo a passo para sublimar uma caneca', 'Quais canecas podem ser sublimadas?', 'Que impressora usar para sublimação?'],
  },
  {
    id: 'suporte',
    title: 'Falar com o suporte',
    keywords: ['suporte', 'atendimento', 'falar com alguem', 'falar com alguém', 'falar com humano', 'humano', 'whatsapp', 'contato', 'ajuda humana', 'preciso de ajuda', 'nao resolveu', 'não resolveu', 'falar com voce', 'falar com você'],
    answer:
      'Claro! Se preferir falar com uma pessoa da nossa equipe, chama a gente no WhatsApp — é só tocar no botão "Falar com suporte no WhatsApp" aqui em cima no chat.\n\nNosso WhatsApp: (62) 98387-816\n\nAtendimento para dúvidas de sublimação, da plataforma e dos seus pedidos. Se for dúvida técnica, manda uma foto da caneca com problema que a gente te ajuda a identificar a causa. 👍',
    quickReplies: ['Qual a temperatura ideal da caneca?', 'Minha arte saiu desbotada, e agora?'],
  },
];
