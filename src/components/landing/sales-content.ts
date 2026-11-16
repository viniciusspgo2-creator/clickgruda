/**
 * Conteúdo editável da página de vendas. Não altera dados do portal.
 * REGRA DO VINICIUS (2026-11-16): nunca o número exato de artes — usar só "milhares de artes" e manter o mistério. 20 downloads é a cota do teste. Preço aprovado em uma única constante.
 */
import { STUDIO_URL } from '@/lib/site'
import { LIFETIME_PRICE_CENTS } from '@/lib/payments/config'

export const SALES = {
  brand: 'Click&Gruda',
  promoEndsAt: '2026-12-31T23:59:59-03:00',
  promoEndsLabel: '31 de dezembro de 2026',
  defaultPriceCents: LIFETIME_PRICE_CENTS,
  /** Opcional: informe URL externa SOMENTE se trocar o checkout próprio. Deixe null para o fluxo atual de cadastro/checkout. */
  CHECKOUT_URL: null as string | null,
  /** Link já presente no rodapé da landing original. */
  EXTERNAL_CATALOG_URL: 'https://www.clickgruda.com.br',
  STUDIO_URL,
  heroKicker: 'Biblioteca de artes para canecas',
  heroTitle: ['Sua próxima caneca', 'pronta para vender', 'sem criar do zero.'],
  heroDescription: 'Milhares de artes para sublimação organizadas por tema, ocasião e estilo — e as ferramentas para apresentar cada uma: Studio Mockup 3D, Editor Online e Academia. Escolha a estampa, monte a composição e mostre a caneca ao cliente antes de produzir.',
  categories: ['Todas', 'Flork', 'Frases', 'Fé & espiritualidade', 'Datas especiais', 'Geek', 'Futebol', 'Música', 'Amizade', 'Humor'],
  /** Dores que a seção de problema/agitação nomeia. */
  problems: [
    { title: 'Perdeu o pedido', text: 'O cliente pediu uma arte e você não tinha nada pronto para mostrar. Ele foi para outro lugar.' },
    { title: 'Compra pack por pack', text: 'Cada pack novo é um gasto, e a maioria das artes nem serve para o seu público.' },
    { title: 'Cria tudo do zero', text: 'Horas desenhando para um pedido que paga pouco — e o prazo apertando.' },
    { title: 'Não consegue mostrar antes', text: 'O cliente só vê a caneca depois de pronta. Se não gostar, o prejuízo é seu.' },
  ],
  /** Benefícios como resultado (não como recurso). */
  benefits: [
    { title: 'Ache a arte em segundos', text: 'Busca e categorias por tema, ocasião e estilo. Nada de pastas bagunçadas.' },
    { title: 'Venda antes de produzir', text: 'Mostre a caneca em 3D ao cliente antes de gastar tinta e porcelana.' },
    { title: 'Monte sem programa pago', text: 'O Editor Online monta a composição sem Corel nem Photoshop.' },
    { title: 'Aprenda e evolua', text: 'Academia e curso de impressão para dominar a sublimação de verdade.' },
    { title: 'Renove o acervo sempre', text: 'Novos lançamentos e atualizações incluídos no seu acesso vitalício.' },
  ],
  /** Para quem é / para quem não é. */
  forWho: [
    'Sublimadores que vendem canecas personalizadas',
    'Quem faz lembranças, presentes e brindes',
    'Quem quer parar de comprar pack por pack',
    'Quem está começando e precisa de arte pronta',
  ],
  notForWho: [
    'Quem quer arte exclusiva sob medida (aqui as artes são um acervo compartilhado)',
    'Quem não trabalha com sublimação de canecas',
  ],
  /** Tudo que está incluído — pilha de valor (sem preço inventado por item). */
  valueStack: [
    { name: 'Biblioteca de artes para canecas', detail: 'Milhares de artes com curadoria, organizadas por tema e ocasião, com novos lançamentos.', tag: 'CARRO-CHEFE' },
    { name: 'Studio Mockup 3D', detail: 'Apresente a caneca em 3D ao cliente antes de produzir.', tag: 'INCLUÍDO' },
    { name: 'Editor Online (Mockup 2D)', detail: 'Monte a composição da caneca direto no navegador.', tag: 'INCLUÍDO' },
    { name: 'Academia de Sublimação + curso de impressão', detail: 'Trilhas, videoaulas e guias para dominar a técnica.', tag: 'INCLUÍDO' },
    { name: 'Área Bônus', detail: 'Recursos extras, ferramentas e materiais de apoio.', tag: 'INCLUÍDO' },
    { name: 'Atualizações vitalícias', detail: 'Novas artes e novos recursos entram no seu acesso sem custo extra.', tag: 'INCLUÍDO' },
  ],
  /** Depoimentos reais — só entram os autorizados, com nome e resultado. Vazio = seção não aparece. */
  testimonials: [] as { name: string; role: string; quote: string; result: string }[],
  guarantee: {
    title: 'Risco zero: 7 dias de garantia incondicional',
    text: 'Teste por 7 dias. Se não for para você, devolvemos 100% do valor — sem perguntas, sem burocracia. É o seu direito (art. 49 do CDC) e a nossa garantia. E o teste grátis (20 downloads) já deixa você decidir antes de pagar.',
  },
  steps: [
    { num: '01', title: 'Comece pela Biblioteca', subtitle: 'Crie sua conta e encontre sua próxima arte.', description: 'Busque por tema, explore categorias e escolha o arquivo que combina com o pedido do seu cliente.' },
    { num: '02', title: 'Crie e apresente', subtitle: 'Mockup e Editor reunidos no Studio.', description: 'Monte a composição no Editor e mostre a caneca em 3D no Mockup. O Studio acompanha seu pacote e abre em outra plataforma.' },
    { num: '03', title: 'Ative o acesso completo', subtitle: 'Produza agora e acompanhe a evolução da plataforma.', description: 'A confirmação da compra libera os downloads sem a cota do teste. Seu código do Studio passa a definitivo e você continua com o acervo e as ferramentas do pacote.' },
  ],
  artworks: [
    { src: '/uploads/showcase/arte-flork-casal-nesmo.webp', title: 'Frase de atitude', category: 'Frases' },
    { src: '/uploads/showcase/arte-flork-cafe-coragem.webp', title: 'Deus, café e coragem', category: 'Flork' },
    { src: '/uploads/showcase/arte-flork-lugar-favorito.webp', title: 'Meu lugar favorito', category: 'Flork' },
    { src: '/uploads/showcase/arte-amigas-vencedoras.webp', title: 'Amigas vencedoras', category: 'Amizade' },
    { src: '/uploads/showcase/arte-boho-acalme-mente.webp', title: 'Acalme a mente', category: 'Frases' },
    { src: '/uploads/showcase/arte-frases-rock-paz.webp', title: 'Protejo minha paz', category: 'Frases' },
    { src: '/uploads/showcase/arte-paz-espirito.webp', title: 'Paz de espírito', category: 'Fé & espiritualidade' },
    { src: '/uploads/showcase/arte-deus-fiel-flores.webp', title: 'Deus é fiel', category: 'Fé & espiritualidade' },
    { src: '/uploads/showcase/arte-religiosa-eu-te-amo.webp', title: 'Eu te amo', category: 'Fé & espiritualidade' },
    { src: '/uploads/showcase/arte-halloween-terror-doce.webp', title: 'Halloween', category: 'Datas especiais' },
    { src: '/uploads/showcase/arte-calendario-senna-2027.webp', title: 'Calendário 2027', category: 'Datas especiais' },
    { src: '/uploads/showcase/arte-rita-lee-tributo.webp', title: 'Tributo a Rita Lee', category: 'Música' },
    { src: '/uploads/showcase/arte-calendario-goku-2027.webp', title: 'Goku — Calendário 2027', category: 'Geek' },
    { src: '/uploads/showcase/arte-goku-trono-paz.webp', title: 'Saiyajin — Trono', category: 'Geek' },
    { src: '/uploads/showcase/arte-meninas-superpoderosas.webp', title: 'Linda? Eu sei!', category: 'Frases' },
    { src: '/uploads/showcase/arte-corinthians-futebol.webp', title: 'Corinthians', category: 'Futebol' },
    { src: '/uploads/showcase/arte-fluminense-futebol.webp', title: 'Fluminense', category: 'Futebol' },
    { src: '/uploads/showcase/arte-flork-matrix.webp', title: 'Flork Matrix', category: 'Flork' },
    { src: '/uploads/showcase/arte-grita-te-achei.webp', title: 'Te achei!', category: 'Geek' },
    { src: '/uploads/showcase/arte-shopee-promocao.webp', title: 'Minha lojinha favorita', category: 'Humor' },
  ],
  seasons: [
    { index: '01', name: 'Dia das Mães', moment: 'Maio', note: 'Afeto que vira presente' },
    { index: '02', name: 'Dia dos Namorados', moment: 'Junho', note: 'Artes para surpreender' },
    { index: '03', name: 'Dia dos Professores', moment: 'Outubro', note: 'Homenagens que marcam' },
    { index: '04', name: 'Natal', moment: 'Dezembro', note: 'Uma temporada de ideias' },
  ],
  faqIndices: [0, 2, 6, 8, 9, 11, 14],
} as const
