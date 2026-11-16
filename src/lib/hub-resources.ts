/** Links de recursos: importado apenas pela API server-side, nunca pelo bundle do cliente. */
export type BonusItem = {id:string;name:string;description:string;url:string|null;theme?:string}
export type BonusGroup = {id:string;title:string;description:string;icon:string;items:BonusItem[];notice?:string}
const drive=(folder:string)=>`https://drive.google.com/drive/folders/${folder}`
function numbered(ids:string[],label:string,theme?:string):BonusItem[]{return ids.map((id,i)=>({id:`${label.toLowerCase().replace(/\W/g,'-')}-${i+1}`,name:`${label} ${String(i+1).padStart(2,'0')}`,description:'Abrir pasta no Google Drive',url:drive(id),theme}))}
export const BONUS_GROUPS:BonusGroup[]=[
 {id:'cursos',title:'Pack de Cursos',description:'Materiais de estudo em pastas do Google Drive.',icon:'graduation-cap',items:numbered(['1AYsHXmYnInMkDchdF8GowUnEBY5pbB4N','1GKaxxcl-DP6Wfih2tegbJ_YguO8RGplj','1KEGjg9wL5p7g5BL0RM-4ryZ6z0-e-IqH'],'Pack Cursos')},
 {id:'plr',title:'Pack PLRs',description:'Coleção de materiais e recursos diversos.',icon:'folder-open',items:numbered(['1pWej_QADKPGUz5eKkHL6OowfzMp2RXKM','16cRT8fodZmTw6sDiPMShnQgae8q_XZma','15OWz_nF3SMoXRarsL0WVUIFq6h6YPFJV','1D5tYbiXzx8bMSeebH2xZA4TjAEzcEzZ8'],'Pack PLR')},
 {id:'planilhas',title:'Planilhas Excel',description:'Modelos úteis para organizar seu negócio.',icon:'table-2',items:numbered(['1AG70-OFfJuhNG19svmWIjWww4uLdGMlN'],'Planilha')},
 {id:'livros',title:'Livros & PDFs',description:'Leituras e bibliotecas digitais.',icon:'book-open',items:[{id:'livro-1',name:'Biblioteca de Livros 01',description:'Coleção digital no Google Drive',url:'https://drive.google.com/drive/u/0/folders/1UxJwwUiUlBUE_K0QTJQnSxWKekzL3y1o'},{id:'livro-2',name:'Biblioteca de Livros 02',description:'Coleção digital no Google Drive',url:drive('1go1kGH8H56m_KL332MUz8e7tTfDarLWg')}]},
 {id:'virais',title:'Conteúdo que Viraliza',description:'Vídeos, memes, referências e tendências para conteúdo digital.',icon:'clapperboard',items:[{id:'virais-1',name:'Conteúdo que Viraliza',description:'Biblioteca externa de vídeos e referências',url:'https://multigads-cortesvirais.netlify.app/'}]},
 {id:'editor-drives',title:'Recursos do Studio Editor',description:'Fundos, PNGs, personagens, formas e materiais criativos em uma pasta central.',icon:'palette',items:[
   {id:'acervo-editor',name:'Biblioteca completa de recursos',description:'Drive com PNGs, personagens, fundos prontos e materiais para criar e montar suas artes.',url:'https://drive.google.com/drive/folders/1X0di7y6xJThbGtVvfdk0jqMeP2qd062B'},
   {id:'fundos',name:'Fundos e padrões',description:'Coleções do Studio Editor',url:process.env.NEXT_PUBLIC_EDITOR_DRIVE_FUNDOS_URL||null,theme:'Coleções do Editor'},
   {id:'personagens',name:'Personagens',description:'Coleções do Studio Editor',url:process.env.NEXT_PUBLIC_EDITOR_DRIVE_PERSONAGENS_URL||null,theme:'Coleções do Editor'},
   {id:'formas',name:'Formas e elementos',description:'Coleções do Studio Editor',url:process.env.NEXT_PUBLIC_EDITOR_DRIVE_FORMAS_URL||null,theme:'Coleções do Editor'},
   {id:'diversos',name:'Diversos e extras',description:'Coleções do Studio Editor',url:process.env.NEXT_PUBLIC_EDITOR_DRIVE_DIVERSOS_URL||null,theme:'Coleções do Editor'},
   // --- Elementos (pastas do Google Drive) ---
   {id:'flork-elementos',name:'Elementos Flork',description:'Elementos e bonequinhos Flork para suas artes.',url:drive('1ux8BEl9xp8L8vNeGMm1UDn-puA0gfqwT'),theme:'Flork'},
   ...numbered(['1TZ7_jMBsB5BfvkYJz0R1sVsd5gp7QwLl','1KdQLmADZXath_z__4dXt9DwntQdi94sM','1jvc6Cre9Lqspqj6BKkuOgdt7sVkxiVww'],'Flork Frases','Flork'),
   {id:'frases',name:'Frases para canecas',description:'Frases prontas para estampar.',url:drive('1ufPqoSwqaO0zosxf58ZDexHgfA-PcG2P'),theme:'Frases'},
   {id:'frases-pacote',name:'Pacote de frases',description:'Pacote com várias frases em PNG.',url:drive('1xr2aPs4UJa5OHEC_nLPtDemVHwHetMOl'),theme:'Frases'},
   {id:'frases-namorados',name:'Frases de namorados',description:'Frases românticas para presentear.',url:drive('1YL7fLAJ9IPjqEexzTgJoqrNA1JB34k8H'),theme:'Frases'},
   {id:'frases-png',name:'Frases em PNG',description:'Frases em PNG com fundo transparente.',url:drive('1-RkFtkp8fHIllNACcPhrx0fId_AF4jmF'),theme:'Frases'},
   {id:'escudos-times',name:'Escudos de times de futebol',description:'Escudos dos times para artes de torcedor.',url:'https://drive.google.com/file/d/170fRytBLsEUQ1p7Q-VsxgVB_PZS1ZLyI/view',theme:'Diversos'},
   {id:'personagens-drive',name:'Personagens',description:'Pasta de personagens para compor artes.',url:drive('1rCvBmIRjHMgztcR_GnxGoPSa2SY2r6_V'),theme:'Personagens'},
   {id:'avatares-personagens',name:'Avatares e personagens',description:'Avatares, personagens e elementos.',url:drive('1AmSs9DCntjkVPmF3L8Yc1maMoYNuh2eT'),theme:'Personagens'},
   {id:'moana-baby',name:'Moana Baby — elementos',description:'Elementos do tema Moana Baby.',url:drive('1_swsUq9vr2yzkEb1h1VaXaNPt50RbVDF'),theme:'Personagens'},
   ...numbered(['1Clr1Q1HsjgiYhBtmdWJuDzGs3t5NVyFb','11KWNPDrkM_XNEZvx5d6pJ3qJhjSzk8bQ'],'Mundo Bita','Personagens'),
   {id:'logomarcas',name:'Logomarcas famosas',description:'Logomarcas de marcas famosas.',url:drive('1mCzyXm9XeH3Jbjof4X3BrwgBNRQSzcTs'),theme:'Diversos'},
   ...numbered(['1I4xU8wRnwL2v_Vi4WP-g1gMbCIDGcJ4W','1hbbTFJ6At1JITj7qCigiuBr4ZcXJwUiP'],'Fundos','Fundos'),
   {id:'fundos-texturas',name:'Fundos e texturas',description:'Fundos e texturas para compor artes.',url:drive('1DekeP4zpTmQ2kSDaKtMrUjb-xoKYK5ol'),theme:'Fundos'},
   {id:'festa',name:'Festa — 650 arquivos',description:'Arquivos de festa para suas artes.',url:drive('1kJ7QVU_j69AvI9UfFjh0RGRCxCGD1NDy'),theme:'Festa'},
   {id:'alfabeto-pandoca',name:'Alfabeto Pandoca',description:'Alfabeto temático Pandoca.',url:drive('1sxp-yeLa8TkJRB9LNuq4QiHIWPbCN1fR'),theme:'Alfabetos'},
   {id:'alfabeto-geral',name:'Alfabeto geral',description:'Alfabeto para montar nomes e frases.',url:drive('1tTxC3vaMrKrml8siQvHKCtTDEuJHzTQ5'),theme:'Alfabetos'},
   ...numbered(['1OmZ7Nmy3Y7RrjMZhmf2rvISLrFtXGtiW','1Zpi2oRYrN0TBTuMgXRXI-K7Tw25D70Dv','1561Gg9YDywIMvKmJARLfZEulcZpH2Fee','1KQtJGIm3-VSdG3XW70M9cpuH80svC5nJ','1qapejhIxPH4MqO2mnQp3fVAvRh3x-Sd8'],'Alfabeto','Alfabetos'),
   {id:'alfabeto-mickey',name:'Alfabeto Mickey e Minnie',description:'Alfabeto temático Mickey e Minnie.',url:drive('14LpJHI4FAfBXiFdTJseIVJbVhxhWR9x1'),theme:'Alfabetos'},
   {id:'volta-aulas',name:'Volta às aulas + agenda',description:'Materiais de volta às aulas e agenda.',url:drive('1xfxgRjH__wh2zvRPuUjOS0oarN6XIGTE'),theme:'Volta às aulas'},
   {id:'kit-professores',name:'Kit professores',description:'Kit com materiais para professores.',url:drive('1vS8KA3JI2hs1rfH1dwBI1c-D4N3q7C59'),theme:'Volta às aulas'},
   {id:'fontes',name:'11 mil fontes',description:'Pacote com 11 mil fontes para baixar.',url:drive('1TdQbyrP9Q1r2xoBq7ehyNTW1CrUvWXpd'),theme:'Diversos'},
 ]},
 {id:'artes-200mil',title:'+ de 200 mil artes para canecas',description:'Acervos externos com mais de 200 mil artes para canecas.',icon:'library',notice:'Atenção: não garantimos qualidade, integridade etc. São layouts avulsos coletados de packs na internet — você terá que garimpar e pegar o que for útil para você. Recomendamos acompanhar a Biblioteca de Artes, onde subimos apenas artes selecionadas.',items:[
   {id:'artes-200mil-1',name:'Drive 1 — Full',description:'Acervo completo com mais de 200 mil artes.',url:drive('1K3m9XhBrrWHIHsu4QSoHCpaF22-qFi5a')},
   {id:'artes-200mil-2',name:'Drive 2',description:'Segundo acervo com mais de 200 mil artes.',url:drive('1WY52n7slsHRhwwc_kYIEgsGG8gqZv3BX')},
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
 ]},
]
export function validResourceUrl(url:string|null):string|null {
 if(!url)return null
 try { const parsed=new URL(url);return (parsed.protocol==='https:'||(process.env.NODE_ENV!=='production'&&parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))&&!parsed.username&&!parsed.password?parsed.href:null }catch{return null}
}
