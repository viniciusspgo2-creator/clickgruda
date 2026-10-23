/**
 * Conteúdo editável da página de vendas. Não altera dados do portal.
 * A quantidade oficial e o preço são lidos de /api/catalog quando disponível.
 * Sem resposta da API, usa-se somente uma ESTIMATIVA explicitamente sinalizada.
 */
export const SALES = {
  brand: 'Click&Gruda',
  promoEndsAt: '2026-12-31T23:59:59-03:00',
  promoEndsLabel: '31 de dezembro de 2026',
  estimatedArtCount: 3500,
  defaultPriceCents: 4790,
  /** Opcional: informe URL externa SOMENTE se trocar o checkout próprio. Deixe null para o fluxo atual de cadastro/checkout. */
  CHECKOUT_URL: null as string | null,
  /** Link já presente no rodapé da landing original. */
  EXTERNAL_CATALOG_URL: 'https://www.clickgruda.com.br',
  heroKicker: 'A biblioteca de quem vive de personalizados',
  heroTitle: ['Menos tempo', 'procurando.', 'Mais tempo', 'criando.'],
  heroDescription: 'Artes prontas para sublimação, escolhidas a dedo e organizadas para você encontrar o tema certo sem se perder em pastas.',
  categories: ['Todas', 'Flork', 'Frases', 'Fé & espiritualidade', 'Datas especiais', 'Geek', 'Futebol', 'Música', 'Amizade', 'Humor'],
  steps: [
    { num: '01', title: 'Encontre', subtitle: 'A arte certa, sem caçar arquivo.', description: 'Pesquise, explore categorias e descubra coleções para cada ocasião. Chega de abrir pasta por pasta.' },
    { num: '02', title: 'Baixe e produza', subtitle: 'Da escolha para a sua bancada.', description: 'Selecione sua arte e use o arquivo na produção, respeitando o tamanho e os ajustes da sua caneca.' },
    { num: '03', title: 'Apresente e venda', subtitle: 'Faça seu trabalho aparecer.', description: 'Mostre o resultado ao cliente. Se quiser, use o gerador de mockups 3D e divulgue seus produtos em sua loja online.' },
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
