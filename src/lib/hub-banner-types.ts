/** Tipos seguros para o cliente (sem importar Prisma no navegador). */
export type BannerSection = 'novidades' | 'ferramentas' | 'conteudos'
export type HubBanner = { id:string;section:BannerSection;title:string;description:string;imageUrl:string;href:string;eyebrow:string;enabled:boolean;order:number }
export const HUB_BANNER_SECTIONS: {id:BannerSection;title:string;subtitle:string}[]=[
 {id:'ferramentas',title:'Descubra suas ferramentas',subtitle:'Um estúdio completo, uma experiência para cada ideia'},
 {id:'conteudos',title:'Aprenda & evolua',subtitle:'Materiais selecionados para aprimorar suas criações'},
]
