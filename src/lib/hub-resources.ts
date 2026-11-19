/** Links de recursos: importado apenas pela API server-side, nunca pelo bundle do cliente. */
export type BonusItem = {id:string;name:string;description:string;url:string|null;theme?:string;icon?:string}
export type BonusGroup = {id:string;title:string;description:string;icon:string;items:BonusItem[];notice?:string}
const drive=(folder:string)=>`https://drive.google.com/drive/folders/${folder}`
const DRIVE_ICON='/bonus-icons/drive.svg'
export const BONUS_GROUPS:BonusGroup[]=[
 {id:'drive-de-pobre',title:'Drive de Pobre — Acervo Aberto',description:'Mais de 1 milhão de arquivos e 55 TB: cursos em vídeo, PDFs e preparatórios — ENEM, concursos, militares, idiomas, medicina e tecnologia. Download grátis, sem cadastro.',icon:'layers',items:[
   {id:'drive-de-pobre-site',name:'Drive de Pobre — Todos os Cursos',description:'Busque por curso, professor ou assunto: videoaulas, PDFs, preparatórios e banco de questões.',url:'https://drivedepobre.com/',icon:'/bonus-icons/book-3d.png'},
 ]},
 {id:'cursos',title:'Pack de Cursos',description:'Materiais de estudo em pastas do Google Drive.',icon:'graduation-cap',items:[
   {id:'pack-cursos-1',name:'Cursos Connect Premium — Pastas 1 e 2',description:'Cursos Connect Premium: pastas 1 e 2.',url:drive('1AYsHXmYnInMkDchdF8GowUnEBY5pbB4N'),icon:DRIVE_ICON},
   {id:'pack-cursos-2',name:'Cursos Connect Premium — Pastas 3 e 4',description:'Cursos Connect Premium: pastas 3 e 4.',url:drive('1GKaxxcl-DP6Wfih2tegbJ_YguO8RGplj'),icon:DRIVE_ICON},
   {id:'pack-cursos-3',name:'Drive Plus Digital Black — Mega Coleção',description:'Mega coleção Drive Plus: negócios, TI, marketing, idiomas, fotografia e mais.',url:drive('1KEGjg9wL5p7g5BL0RM-4ryZ6z0-e-IqH'),icon:DRIVE_ICON},
   {id:'curso-tgr',name:'Treinamento TGR — Marketing Digital',description:'Treinamento completo de marketing digital em 30 módulos.',url:drive('1sQBSQ0tiPImopMb38Rs6gexVetEhYzcn'),icon:DRIVE_ICON},
   {id:'curso-novos-aqui',name:'Cursos Novos Aqui',description:'Administração, eletrônica e cursos profissionalizantes 2024.',url:drive('1k6AzGYDetwiHU_WBvDgF10HRYRFtMRYQ'),icon:DRIVE_ICON},
   {id:'curso-drive-plus-diversos',name:'Drive Plus — Diversos',description:'Coleção variada de cursos: vendas, leitura, direção, marketing e mais.',url:drive('1vRFjw_rcdllg0p9gC4R468hRs43McPW2'),icon:DRIVE_ICON},
   {id:'curso-drive-plus-pessoal',name:'Drive Plus — Desenvolvimento Pessoal',description:'Oratória, persuasão, produtividade, carisma e mindset.',url:drive('1KARIkqEHxd-yzKLl2ywo7ALMaiYnSKCQ'),icon:DRIVE_ICON},
   {id:'curso-drive-plus-financeiro',name:'Drive Plus — Mercado Financeiro',description:'Bolsa, cripto, trader, CPA-10/20 e finanças pessoais.',url:drive('1GdaKQXsrNvYO_IuLAY0Cx03nlSlJwRcX'),icon:DRIVE_ICON},
   {id:'curso-500gb',name:'500 GB de Cursos',description:'Acervo com centenas de cursos: edição, marketing, programação, idiomas e mais.',url:drive('1BLu8z5NQLThtTiXL0YlmMBu-hqhQOX0m'),icon:DRIVE_ICON},
   {id:'curso-onedrive',name:'Cursos (OneDrive)',description:'Pasta de cursos no OneDrive.',url:'https://brpucrs-my.sharepoint.com/personal/cristiano_dias_edu_pucrs_br/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fcristiano%5Fdias%5Fedu%5Fpucrs%5Fbr%2FDocuments%2FCursos&ga=1',icon:'/bonus-icons/book-3d.png'},
   {id:'curso-teologia',name:'Teologia Descomplicada — Curso Completo',description:'Curso de teologia em 20 módulos, com apostilas e lives.',url:drive('1O8S72bQSxBBc5EUTTHVbhVV86OilXkBx'),icon:DRIVE_ICON},
   {id:'curso-detran',name:'Curso Detran — Habilitação',description:'Curso completo para habilitação: legislação, direção defensiva, primeiros socorros e simulado.',url:drive('1mtDKUbALSq4la6ICNK1CFrn0JNjqi6kr'),icon:DRIVE_ICON},
   {id:'curso-mega-videos',name:'Cursos e Vídeos (Mega)',description:'Cursos e vídeos no Mega.',url:'https://mega.nz/folder/6fxBRSDD#3v-snDKSjlvpovuYpLyhYg/folder/6a5V0CSK',icon:'/bonus-icons/video-3d.png'},
   {id:'curso-gratuitos-online',name:'Cursos Gratuitos Online — +5.000 Cursos',description:'Plataforma com mais de 5 mil cursos gratuitos em 40 áreas, com certificado opcional.',url:'https://onlinecursosgratuitos.com.br/',icon:'/bonus-icons/book-3d.png'},
 ]},
 {id:'ia-prompts',title:'IA & Prompts',description:'Cursos e prompts de inteligência artificial para criar mais rápido.',icon:'bot',items:[
   {id:'curso-ia-zero',name:'Curso de IA do Zero ao Profissional',description:'Curso completo de inteligência artificial, do zero ao profissional.',url:'https://ia-do-zero-ao-profissional.lovable.app/',icon:'/bonus-icons/ai-3d.png'},
   {id:'prompts-chatgpt-500',name:'500 Prompts ChatGPT',description:'Coleção com 500 prompts prontos para o ChatGPT.',url:'https://puzzle-jute-202.notion.site/500-Best-ChatGPT-Prompts-f5b4ad65deec4b6385316fdb8740af74',icon:'/bonus-icons/chat-3d.png'},
   {id:'pack-copys-prompts',name:'Pack Copys, Prompts e Fornecedores',description:'Copys, prompts, planilhas e lista de fornecedores.',url:drive('14nir2zdAWQVXtW1x-yBXG_mz2-9ubNNP'),icon:DRIVE_ICON},
   {id:'hacker-ferramentas-ia',name:'Hacker das Ferramentas IA',description:'Diretório com centenas de ferramentas de IA por categoria.',url:'https://mestres.notion.site/Hacker-das-Ferramentas-IA-b099917244224e2595e756a6128ed3c2',icon:'/bonus-icons/ai-3d.png'},
 ]},
 {id:'copy-scripts',title:'Copy & Scripts',description:'Scripts de vendas e modelos de copy prontos para usar.',icon:'message-circle',items:[
   {id:'scripts-magneticos',name:'Scripts Magnéticos',description:'Scripts de vendas para WhatsApp: pré-venda, venda, objeções, fechamento e follow-up.',url:'https://luisvercosa.notion.site/Scripts-Magn-ticos-d6c3e8d8ec5e47fbbc3b0f6590c9aed7',icon:'/bonus-icons/chat-3d.png'},
   {id:'modelos-copy-na-veia',name:'Modelos Prontos — Copy na Veia',description:'Modelos de copy: e-mails, funil de vendas, WhatsApp, headlines e gatilhos mentais.',url:drive('1bpmVGd2-vxVtFpH2Gw2eSCnRZSx0Gnaq'),icon:DRIVE_ICON},
 ]},
 {id:'plr',title:'Pack PLRs',description:'Coleção de materiais e recursos diversos.',icon:'folder-open',items:[
   {id:'pack-plr-1',name:'10 mil Ebooks PLR',description:'Coleção com 10 mil ebooks PLR.',url:drive('1pWej_QADKPGUz5eKkHL6OowfzMp2RXKM'),icon:DRIVE_ICON},
   {id:'pack-plr-2',name:'Pacote PLR em Vídeo (Licenciados)',description:'Cursos PLR em vídeo, licenciados.',url:drive('16cRT8fodZmTw6sDiPMShnQgae8q_XZma'),icon:DRIVE_ICON},
   {id:'pack-plr-3',name:'750 Ebooks PLR',description:'750 ebooks PLR em português e inglês, com iscas.',url:drive('15OWz_nF3SMoXRarsL0WVUIFq6h6YPFJV'),icon:DRIVE_ICON},
   {id:'pack-plr-4',name:'PLRs por Tema — Ebooks Organizados',description:'Ebooks PLR organizados por tema: marketing, saúde, negócios e mais.',url:drive('1D5tYbiXzx8bMSeebH2xZA4TjAEzcEzZ8'),icon:DRIVE_ICON},
 ]},
 {id:'planilhas',title:'Planilhas Excel',description:'Modelos úteis para organizar seu negócio.',icon:'table-2',items:[
   {id:'planilha-1',name:'74 Planilhas Excel — Pacotes e Modelos',description:'74 planilhas Excel: pacotes, engenharia, controle pessoal e modelos de cartas.',url:drive('1AG70-OFfJuhNG19svmWIjWww4uLdGMlN'),icon:DRIVE_ICON},
   {id:'planilha-2',name:'+13 mil Planilhas Excel — Coleção por Temas',description:'Mais de 13 mil planilhas Excel organizadas por tema: financeiro, estoque, RH, vendas e mais.',url:drive('1bxQfNYszLoQ87AzWXbupyAY1K7-kLXtX'),icon:DRIVE_ICON},
   {id:'planilha-3',name:'Super Pack +15 mil Planilhas Excel + Curso Bônus',description:'Super pack com mais de 15 mil planilhas Excel prontas e editáveis, mais curso bônus.',url:drive('1YMAWNnvVjZ4a-C_z0L3vlJ2XIAKviaN9'),icon:DRIVE_ICON},
 ]},
 {id:'livros',title:'Livros & PDFs',description:'Leituras e bibliotecas digitais.',icon:'book-open',items:[{id:'livro-1',name:'O Pior Ano da Sua Vida — Curso e Livro',description:'Curso e livro digital com módulos e bônus.',url:'https://drive.google.com/drive/u/0/folders/1UxJwwUiUlBUE_K0QTJQnSxWKekzL3y1o',icon:DRIVE_ICON},{id:'livro-2',name:'Livros sobre Dinheiro e Negócios',description:'Coleção de livros sobre dinheiro, vendas e negócios.',url:drive('1go1kGH8H56m_KL332MUz8e7tTfDarLWg'),icon:DRIVE_ICON},{id:'livro-3',name:'Biblioteca Alexandrina — Livros de A a Z',description:'Biblioteca com livros organizados de A a Z.',url:drive('1EEi7bB3L2TIshhTOI-HJzQ4mgQ8F2k5i'),icon:DRIVE_ICON},{id:'livro-4',name:'O Ouro do Mercado — Livros de Marketing Digital',description:'Livros e ebooks de marketing digital, copy e vendas.',url:drive('1dOwWTelEaOYu3ioc14gRQU_gJIJilAgH'),icon:DRIVE_ICON},{id:'livro-5',name:'Livros de Direito — Por Área',description:'Livros de direito organizados por área, mais concursos.',url:drive('13YuZfaAHJBNTnuDfMzL2mBxzmaEk64qa'),icon:DRIVE_ICON},{id:'livro-6',name:'Livros sobre Mentalidade e Marketing',description:'Livros de mentalidade, persuasão e marketing digital.',url:drive('11yQW7TM2cAAY6-zlRa-kAYGPMQ1dwJr4'),icon:DRIVE_ICON},{id:'livro-7',name:'Livros Pablo Marçal',description:'Livros do Pablo Marçal: Antimedo, O Pior Ano da Sua Vida e mais.',url:drive('1fxHIZiTQmCFIDJe1Uat1snlwj2KsgDlF'),icon:DRIVE_ICON},{id:'livro-8',name:'Livros — Ficção e HQs',description:'Livros de ficção e HQs: Harry Potter, Duna, Marvel, DC, Jogos Vorazes e mais.',url:drive('1FdoFCXg85qGoPqqYMOOQ6EgZzolG0jFG'),icon:DRIVE_ICON},{id:'livro-9',name:'Books — Biblioteca por Temas',description:'Biblioteca de livros organizada por tema: administração, concursos, empreendedorismo, ficção, psicologia, programação e mais.',url:'https://drive.google.com/drive/folders/0ByZzLGrTEIc3OTgxOW02MUktSDQ?resourcekey=0-PXPjY9BFcIG0CQBTy5TJ0A',icon:DRIVE_ICON},{id:'livro-10',name:'Livros de Autoajuda',description:'Livros de autoajuda: Brené Brown, Napoleon Hill, Dale Carnegie, Augusto Cury e mais.',url:'https://drive.google.com/drive/folders/0B5wSRZ7-kfAhU2VTSXpOdFMzUTg?resourcekey=0-wg8aqYB6EZpCPI3YKJzzGQ',icon:DRIVE_ICON}]},
 {id:'virais',title:'Conteúdo que Viraliza',description:'Vídeos, memes, referências e tendências para conteúdo digital.',icon:'clapperboard',items:[
   {id:'virais-1',name:'Conteúdo que Viraliza',description:'Biblioteca externa de vídeos e referências',url:'https://multigads-cortesvirais.netlify.app/',icon:'/bonus-icons/video-3d.png'},
   {id:'virais-2',name:'50 Mil Cortes Virais',description:'Acervo com 50 mil cortes virais para redes sociais.',url:'https://conectaresultados.notion.site/50-MIL-CORTES-VIRAIS-1739797d125980cfb3bec9c6d904a4e7',icon:'/bonus-icons/video-3d.png'},
 ]},
 {id:'sons-whatsapp',title:'Sons para WhatsApp',description:'Sons e efeitos para dar vida às suas conversas no WhatsApp.',icon:'music',items:[
   {id:'sons-whatsapp-1',name:'Biblioteca de Sons para WhatsApp',description:'Sons e efeitos para usar no WhatsApp.',url:'https://www.myinstants.com/pt/index/br/',icon:'/bonus-icons/sound-3d.png'},
 ]},
 {id:'receitas',title:'Receitas Batidas na Garrafa',description:'Receitas de batidas na garrafa para vender ou presentear.',icon:'chef-hat',items:[
   {id:'receitas-1',name:'Receitas Batidas na Garrafa',description:'Pasta com receitas de batidas na garrafa.',url:drive('17Hg37YO8-eCrzZ7NfeJzkRcSKBa002Ii'),icon:DRIVE_ICON},
 ]},
 {id:'canais-ao-vivo',title:'Canais Ao Vivo',description:'Canais de TV ao vivo do mundo inteiro em um só lugar.',icon:'tv',items:[
   {id:'canais-ao-vivo-1',name:'Canais Ao Vivo do Mundo Inteiro',description:'Assista canais de TV ao vivo do mundo inteiro.',url:'https://famelack.com/',icon:'/bonus-icons/tv-3d.png'},
 ]},
 {id:'editor-drives',title:'Recursos do Studio Editor',description:'Fundos, PNGs, personagens, frases e materiais criativos em pastas organizadas por tema.',icon:'palette',items:[
   // --- Fundos ---
   {id:'fundos',name:'Fundos',description:'Coleção de fundos para suas artes.',url:drive('1Pwkzeqvf0L0p-9a0I1WKtP1v2921_JM2'),theme:'Fundos'},
   {id:'fundos-ilustracao',name:'Fundos com ilustração montada',description:'Fundos prontos com ilustração montada.',url:drive('1Eulyg8Ip56bxyuWS99yrUxN2wHWEO9BI'),theme:'Fundos'},
   {id:'fundos-1',name:'Fundos Gerais (20 fundos)',description:'Coleção de 20 fundos gerais para suas artes.',url:drive('1I4xU8wRnwL2v_Vi4WP-g1gMbCIDGcJ4W'),theme:'Fundos',icon:DRIVE_ICON},
   {id:'fundos-2',name:'Fundos Namorados — 44 fundos de amor',description:'44 fundos românticos para o Dia dos Namorados.',url:drive('1hbbTFJ6At1JITj7qCigiuBr4ZcXJwUiP'),theme:'Fundos',icon:DRIVE_ICON},
   {id:'fundos-texturas',name:'Fundos e texturas',description:'Fundos e texturas para compor artes.',url:drive('1DekeP4zpTmQ2kSDaKtMrUjb-xoKYK5ol'),theme:'Fundos'},
   // --- Personagens ---
   {id:'personagens-png',name:'Personagens PNG',description:'Personagens em PNG para compor artes.',url:drive('17lu97sO22iu0JlH-XsGGca7EejQrSp3p'),theme:'Personagens'},
   {id:'figuras-png-mulheres',name:'Figuras PNG, clipart e mulheres',description:'Figuras em PNG, cliparts e mulheres para suas artes.',url:drive('1tLsM4r7_g2vxqvd1u-IPnbVXFcfHqPCc'),theme:'Personagens'},
   {id:'personagens-drive',name:'Personagens',description:'Pasta de personagens para compor artes.',url:drive('1rCvBmIRjHMgztcR_GnxGoPSa2SY2r6_V'),theme:'Personagens'},
   {id:'avatares-personagens',name:'Avatares e personagens',description:'Avatares, personagens e elementos.',url:drive('1AmSs9DCntjkVPmF3L8Yc1maMoYNuh2eT'),theme:'Personagens'},
   {id:'moana-baby',name:'Moana Baby — elementos',description:'Elementos do tema Moana Baby.',url:drive('1_swsUq9vr2yzkEb1h1VaXaNPt50RbVDF'),theme:'Personagens'},
   {id:'mundo-bita-1',name:'Mundo Bita — Kit 04 (Menino)',description:'Kit Mundo Bita menino: elementos, fonte e arquivos Studio.',url:drive('1Clr1Q1HsjgiYhBtmdWJuDzGs3t5NVyFb'),theme:'Personagens',icon:DRIVE_ICON},
   {id:'mundo-bita-2',name:'Mundo Bita Rosa — Kit 24 (Festa)',description:'Kit Mundo Bita rosa para festa: elementos, fotos e arquivos Studio.',url:drive('11KWNPDrkM_XNEZvx5d6pJ3qJhjSzk8bQ'),theme:'Personagens',icon:DRIVE_ICON},
   // --- Frases ---
   {id:'frases',name:'Frases para canecas',description:'Frases prontas para estampar.',url:drive('1ufPqoSwqaO0zosxf58ZDexHgfA-PcG2P'),theme:'Frases'},
   {id:'frases-pacote',name:'Pacote de frases',description:'Pacote com várias frases em PNG.',url:drive('1xr2aPs4UJa5OHEC_nLPtDemVHwHetMOl'),theme:'Frases'},
   {id:'frases-png',name:'Frases em PNG',description:'Frases em PNG com fundo transparente.',url:drive('1-RkFtkp8fHIllNACcPhrx0fId_AF4jmF'),theme:'Frases'},
   // --- Romântico ---
   {id:'figuras-romanticas',name:'Figuras românticas e namorados',description:'Figuras românticas para presentear.',url:drive('14Q8_zRSliWKoyFay6QV29tTgxuNsJqPB'),theme:'Romântico'},
   {id:'frases-namorados',name:'Frases de namorados',description:'Frases românticas para presentear.',url:drive('1YL7fLAJ9IPjqEexzTgJoqrNA1JB34k8H'),theme:'Romântico'},
   {id:'frases-romanticas-2',name:'Frases românticas — namorados 2',description:'Mais frases românticas para canecas.',url:drive('1vTWVQEM3BYYfkwKGAQj2BEFDri01YPVJ'),theme:'Romântico'},
   // --- Flork ---
   {id:'flork-elementos',name:'Elementos Flork',description:'Elementos e bonequinhos Flork para suas artes.',url:drive('1ux8BEl9xp8L8vNeGMm1UDn-puA0gfqwT'),theme:'Flork'},
   {id:'flork-frases-1',name:'Flork Frases Coloridas — Signos e Canecas',description:'Frases Flork coloridas com signos e canecas.',url:drive('1TZ7_jMBsB5BfvkYJz0R1sVsd5gp7QwLl'),theme:'Flork',icon:DRIVE_ICON},
   {id:'flork-frases-2',name:'Flork Frases Preto — Signos e Canecas',description:'Frases Flork em preto com signos e canecas.',url:drive('1KdQLmADZXath_z__4dXt9DwntQdi94sM'),theme:'Flork',icon:DRIVE_ICON},
   {id:'flork-frases-3',name:'Flork — Artes Prontas para Caneca',description:'Artes Flork prontas para estampar em canecas.',url:drive('1jvc6Cre9Lqspqj6BKkuOgdt7sVkxiVww'),theme:'Flork',icon:DRIVE_ICON},
   // --- Alfabetos ---
   {id:'alfabeto-pandoca',name:'Alfabeto Pandoca',description:'Alfabeto temático Pandoca.',url:drive('1sxp-yeLa8TkJRB9LNuq4QiHIWPbCN1fR'),theme:'Alfabetos'},
   {id:'alfabeto-geral',name:'Alfabeto geral',description:'Alfabeto para montar nomes e frases.',url:drive('1tTxC3vaMrKrml8siQvHKCtTDEuJHzTQ5'),theme:'Alfabetos'},
   {id:'alfabeto-1',name:'Alfabeto — Vários Estilos',description:'Alfabetos em vários estilos: dourado, floral, infantil, natalino e mais.',url:drive('1OmZ7Nmy3Y7RrjMZhmf2rvISLrFtXGtiW'),theme:'Alfabetos',icon:DRIVE_ICON},
   {id:'alfabeto-2',name:'Letras Coloridas',description:'Letras coloridas em PNG para montar nomes.',url:drive('1Zpi2oRYrN0TBTuMgXRXI-K7Tw25D70Dv'),theme:'Alfabetos',icon:DRIVE_ICON},
   {id:'alfabeto-3',name:'Alfabeto — Letras em Imagem',description:'Alfabeto em imagens e PDF para montar nomes.',url:drive('1561Gg9YDywIMvKmJARLfZEulcZpH2Fee'),theme:'Alfabetos',icon:DRIVE_ICON},
   {id:'alfabeto-4',name:'Letras A–Z em PNG',description:'Letras de A a Z em PNG de alta qualidade.',url:drive('1KQtJGIm3-VSdG3XW70M9cpuH80svC5nJ'),theme:'Alfabetos',icon:DRIVE_ICON},
   {id:'alfabeto-5',name:'Alfabeto Glamour',description:'Alfabeto glamour de A a Z, com mockup.',url:drive('1qapejhIxPH4MqO2mnQp3fVAvRh3x-Sd8'),theme:'Alfabetos',icon:DRIVE_ICON},
   {id:'alfabeto-mickey',name:'Alfabeto Mickey e Minnie',description:'Alfabeto temático Mickey e Minnie.',url:drive('14LpJHI4FAfBXiFdTJseIVJbVhxhWR9x1'),theme:'Alfabetos'},
   // --- Natal ---
   {id:'natal-elementos',name:'Elementos de Natal',description:'24 coleções de Natal com quase 1.000 arquivos: Grinch, Disney, Bluey, Papai Noel, frases e mais.',url:drive('1eRddMBmDz8Vk8LuvrN3BKnuO7PPegkoU'),theme:'Natal'},
   {id:'alfabeto-natalino',name:'Alfabeto Natalino',description:'Alfabeto temático de Natal.',url:drive('1cuae3rTpleCUzO8xHHOaqkmrai2ZN-gd'),theme:'Natal'},
   // --- Datas comemorativas ---
   {id:'festa',name:'Festa — 650 arquivos',description:'Arquivos de festa para suas artes.',url:drive('1kJ7QVU_j69AvI9UfFjh0RGRCxCGD1NDy'),theme:'Datas comemorativas'},
   {id:'frases-pascoa',name:'Frases de Páscoa',description:'Frases de Páscoa para canecas.',url:drive('1f6yjA021lXn0zb9SVNcyz35UFiyBgAQc'),theme:'Datas comemorativas'},
   {id:'figurinhas-pais',name:'Figurinhas avulsas — Pais',description:'Figurinhas para o Dia dos Pais e homenagens.',url:drive('1MV6-KFrVDAzO3IuzdCNAm7_h5lVN95OV'),theme:'Datas comemorativas'},
   // --- Diversos ---
   {id:'complementos-gerais',name:'Complementos gerais',description:'Complementos e extras para suas artes.',url:drive('1Zb_zGwut_sp7wYEWQB9GNr4E5KyblWPW'),theme:'Diversos'},
   {id:'escudos-times',name:'Escudos de times de futebol',description:'Escudos dos times para artes de torcedor.',url:'https://drive.google.com/file/d/170fRytBLsEUQ1p7Q-VsxgVB_PZS1ZLyI/view',theme:'Diversos'},
   {id:'logomarcas',name:'Logomarcas famosas',description:'Logomarcas de marcas famosas.',url:drive('1mCzyXm9XeH3Jbjof4X3BrwgBNRQSzcTs'),theme:'Diversos'},
   {id:'fontes',name:'11 mil fontes',description:'Pacote com 11 mil fontes para baixar.',url:drive('1TdQbyrP9Q1r2xoBq7ehyNTW1CrUvWXpd'),theme:'Diversos'},
   // --- Volta às aulas ---
   {id:'volta-aulas',name:'Volta às aulas + agenda',description:'Materiais de volta às aulas e agenda.',url:drive('1xfxgRjH__wh2zvRPuUjOS0oarN6XIGTE'),theme:'Volta às aulas'},
   {id:'kit-professores',name:'Kit professores',description:'Kit com materiais para professores.',url:drive('1vS8KA3JI2hs1rfH1dwBI1c-D4N3q7C59'),theme:'Volta às aulas'},
   // --- Pack do Editor ---
   {id:'pack-editor',name:'Pack do Editor para Designers e Editores de Vídeo',description:'Pack para designers e editores de vídeo.',url:'https://drive.google.com/file/d/14WusAgczt7PT6jiv6D6qTozOZT8VKjUy/view',theme:'Pack do Editor',icon:DRIVE_ICON},
   {id:'pack-pngs-hd',name:'Pack Imagens HD — 34 mil PNGs',description:'Pack com 34 mil arquivos PNG em alta definição, mais imagens de comida e hambúrguer.',url:drive('1zvUK7oBzboR273Sqx9uj8KdE8og5z1Bx'),theme:'Diversos',icon:DRIVE_ICON},
 ]},
 {id:'artes-200mil',title:'+ de 200 mil artes para canecas',description:'Acervos externos com mais de 200 mil artes para canecas.',icon:'library',notice:'Atenção: não garantimos qualidade, integridade etc. São layouts avulsos coletados de packs na internet — você terá que garimpar e pegar o que for útil para você. Recomendamos acompanhar a Biblioteca de Artes, onde subimos apenas artes selecionadas.',items:[
   {id:'artes-200mil-1',name:'Drive 1 — Full',description:'Acervo completo com mais de 200 mil artes.',url:drive('1K3m9XhBrrWHIHsu4QSoHCpaF22-qFi5a'),icon:DRIVE_ICON},
   {id:'artes-200mil-2',name:'Drive 2',description:'Segundo acervo com mais de 200 mil artes.',url:drive('1WY52n7slsHRhwwc_kYIEgsGG8gqZv3BX'),icon:DRIVE_ICON},
   {id:'pack-sublimacao',name:'Pack de Sublimação — 100 mil arquivos',description:'Acervo externo com mais de 100 mil arquivos de sublimação.',url:'https://sublimacaocamiseta-multigads.netlify.app/',icon:'/bonus-icons/coffee-3d.png'},
   {id:'artes-canecas-transporte',name:'Artes para Canecas — Transporte e Automobilismo',description:'Artes de carros, motos, F1 e mecânica para canecas.',url:drive('1f2fBN8m34No9rrInpfMxsgQRSvxrN-9i'),icon:DRIVE_ICON},
   {id:'artes-canecas-games',name:'Artes para Canecas — Games',description:'Artes de games para canecas: GTA, God of War, Fortnite, Minecraft e mais.',url:drive('1nWjESRy3i6jADCSuQBUmJ39Rwj6-V5w5'),icon:DRIVE_ICON},
   {id:'artes-series',name:'Artes para Sublimação — Tema Séries',description:'Artes de séries para sublimação: Game of Thrones, Stranger Things, Breaking Bad, Friends e mais.',url:drive('13C6abX2NTTkHUhO-j2leKNGb-HSoL6Gj'),icon:DRIVE_ICON},
   {id:'estampas-camisas',name:'Estampas para Camisas',description:'Estampas para camisas, incluindo 500 estampas de animais.',url:drive('1KA2laAkQv4I8x1R2_Z6--jV-BAfe68WO'),icon:DRIVE_ICON},
   {id:'estampas-chinelos',name:'Estampas para Chinelos — 5.320 artes',description:'Mais de 5 mil estampas para chinelos: feminino, masculino, infantil e times.',url:drive('196fkwohZ-RmLDPr-6ZjIqlx6KZcZFI3W'),icon:DRIVE_ICON},
   {id:'estampas-almofadas',name:'Estampas para Almofadas',description:'Estampas para almofadas em imagens e vetor.',url:drive('1gYrNLexXEUrpRZn9qCfnnIedeUfXfo_T'),icon:DRIVE_ICON},
   {id:'estampas-800mil',name:'800 mil Estampas — Camisas, Almofadas, Canecas, Chinelos e Quadros',description:'Super pack com 800 mil estampas para camisas, almofadas, canecas, chinelos e quadros.',url:drive('1ehGx0PJytHHA1cbxscuM1LW6wbnjJ_tS'),icon:DRIVE_ICON},
 ]},
 {id:'bonus-studio',title:'Ferramentas da Plataforma',description:'Utilitários preservados do Studio original. Necessário também estar conectado ao Studio.',icon:'wrench',items:[
   {id:'tool-qr',name:'Gerador de QR Code',description:'QR Codes personalizados',url:(process.env.NEXT_PUBLIC_STUDIO_URL || 'https://studio.clickgruda.com.br').replace(/\/$/,'')+'/bonus/qr'},
   {id:'tool-whatsapp',name:'Links para WhatsApp',description:'Gere links para atendimento',url:(process.env.NEXT_PUBLIC_STUDIO_URL || 'https://studio.clickgruda.com.br').replace(/\/$/,'')+'/bonus/whatsapp'},
   {id:'tool-orcamento',name:'Gerador de Orçamento',description:'Propostas e orçamentos',url:(process.env.NEXT_PUBLIC_STUDIO_URL || 'https://studio.clickgruda.com.br').replace(/\/$/,'')+'/bonus/orcamento'},
   {id:'tool-pdf',name:'Editor PDF',description:'Documentos PDF',url:(process.env.NEXT_PUBLIC_STUDIO_URL || 'https://studio.clickgruda.com.br').replace(/\/$/,'')+'/bonus/pdf'},
   {id:'tool-excel',name:'Leitor de Excel',description:'Consultar planilhas',url:(process.env.NEXT_PUBLIC_STUDIO_URL || 'https://studio.clickgruda.com.br').replace(/\/$/,'')+'/bonus/excel'},
 ]},
 {id:'ferramentas',title:'Ferramentas & Links úteis',description:'Os recursos de edição e inspiração já presentes no Studio Editor.',icon:'wand-sparkles',items:[
   {id:'pixelcut',name:'Pixelcut',description:'Remover fundo',url:'https://www.pixelcut.ai/pt-br/remover-fundo'},
   {id:'photoroom',name:'Photoroom',description:'Remover fundo',url:'https://www.photoroom.com/tools/background-remover'},
   {id:'removebg',name:'Remove.bg',description:'Remover fundo',url:'https://www.remove.bg/pt-br'},
   {id:'picsart',name:'Picsart',description:'Melhorar imagem',url:'https://picsart.com/pt/ai-image-enhancer/unpixelate-image/'},
   {id:'magnific',name:'Magnific AI',description:'Aprimorar e ampliar imagens',url:'https://magnific.ai/'},
   {id:'pinterest',name:'Pinterest',description:'Inspiração',url:'https://br.pinterest.com/'},
   {id:'cosmos',name:'Cosmos',description:'Referências criativas',url:'https://www.cosmos.so/'},
   {id:'dribbble',name:'Dribbble',description:'Portfólios e ideias',url:'https://dribbble.com/'},
   {id:'behance',name:'Behance',description:'Portfólios e projetos',url:'https://www.behance.net/'},
   {id:'freepik',name:'Freepik',description:'Recursos visuais',url:'https://www.freepik.com'},
   {id:'vecteezy',name:'Vecteezy',description:'Vetores e imagens',url:'https://www.vecteezy.com'},
   {id:'pngtree',name:'Pngtree',description:'Elementos PNG',url:'https://pngtree.com'},
   {id:'123apps',name:'123apps',description:'Ferramentas online gratuitas: converter, cortar e editar arquivos',url:'https://123apps.com/pt/'},
 ]},
]
export function validResourceUrl(url:string|null):string|null {
 if(!url)return null
 try { const parsed=new URL(url);return (parsed.protocol==='https:'||(process.env.NODE_ENV!=='production'&&parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))&&!parsed.username&&!parsed.password?parsed.href:null }catch{return null}
}
