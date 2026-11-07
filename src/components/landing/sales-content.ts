/**
 * Conteúdo editável da página de vendas. Não altera dados do portal.
 * Não anunciar tamanho do acervo; 20 downloads é a cota do teste. Preço aprovado em uma única constante.
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
  heroTitle: ['Sua próxima caneca', 'começa na', 'Biblioteca.'],
  heroDescription: 'Artes para sublimação organizadas por tema, ocasião e estilo. Escolha a estampa, baixe o arquivo e prepare o próximo pedido do seu cliente. Sua conta também reúne os bônus Studio Mockup e Editor.',
  categories: ['Todas', 'Flork', 'Frases', 'Fé & espiritualidade', 'Datas especiais', 'Geek', 'Futebol', 'Música', 'Amizade', 'Humor'],
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
