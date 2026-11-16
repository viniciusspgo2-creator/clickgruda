/** Conteúdo do painel 2.0. Usa Setting existente; não modifica tabelas de clientes/arte. */
import { db } from '@/lib/db'

export type BannerSection = 'novidades' | 'ferramentas' | 'conteudos'
export type HubBanner = {
  id: string; section: BannerSection; title: string; description: string
  imageUrl: string; href: string; eyebrow: string; enabled: boolean; order: number
}
export const HUB_BANNERS_KEY = 'cg2:hub:banners:v1'
export const HUB_BANNER_SECTIONS: { id: BannerSection; title: string; subtitle: string }[] = [
  { id: 'novidades', title: 'Novidades & destaques', subtitle: 'O que chegou à sua central criativa' },
  { id: 'ferramentas', title: 'Descubra suas ferramentas', subtitle: 'Um estúdio completo, uma experiência para cada ideia' },
  { id: 'conteudos', title: 'Aprenda & evolua', subtitle: 'Materiais selecionados para aprimorar suas criações' },
]
export const DEFAULT_HUB_BANNERS: HubBanner[] = [
  {id:'biblioteca-v2',section:'novidades',eyebrow:'ACERVO CRIATIVO',title:'Artes para criar sem limites',description:'Explore categorias, lançamentos e inspirações para seus personalizados.',imageUrl:'/uploads/rebrand/biblioteca-vitrine.webp',href:'hub:biblioteca',enabled:true,order:1},
  {id:'studio-premium',section:'novidades',eyebrow:'STUDIO PREMIUM',title:'Sua ideia em outro nível',description:'Mockups realistas de canecas com acabamento de estúdio.',imageUrl:'/uploads/rebrand/mockup-studio.webp',href:'hub:3d',enabled:true,order:2},
  {id:'studio-3d',section:'ferramentas',eyebrow:'MODELAGEM & REALISMO',title:'Studio Mockup 3D',description:'Visualizações realistas, diferentes ângulos e exportações.',imageUrl:'/uploads/rebrand/hero-studio-mascote-v2.webp',href:'hub:3d',enabled:true,order:1},
  {id:'editor-creative',section:'ferramentas',eyebrow:'CRIATIVIDADE SEM LIMITES',title:'Editor de Artes',description:'Monte sua estampa com recursos de criação e edição.',imageUrl:'/uploads/rebrand/studio-escritorio.webp',href:'hub:editor',enabled:true,order:2},
  {id:'inspire',section:'conteudos',eyebrow:'CONTEÚDO EXCLUSIVO',title:'Uma central de recursos',description:'Conheça os links e materiais disponíveis para assinantes.',imageUrl:'/uploads/rebrand/ecossistema-completo.webp',href:'hub:bonus',enabled:true,order:1},
  {id:'seasons',section:'conteudos',eyebrow:'CALENDÁRIO CRIATIVO',title:'Antecipe as datas especiais',description:'Encontre temas sazonais e prepare novas coleções.',imageUrl:'/uploads/rebrand/sazonais-calendario.webp',href:'hub:biblioteca',enabled:true,order:2},
]
export function isAllowedHubHref(input: string) {
  if (/^hub:(biblioteca|3d|2d|editor|bonus|conhecimento|catalogo)$/.test(input)) return true
  if (input.startsWith('/') && !input.startsWith('//') && !input.includes('\\') && !input.includes('\n')) return true
  try { const url = new URL(input); return url.protocol === 'https:' && !url.username && !url.password }
  catch { return false }
}
export function isAllowedBannerImage(input: string) {
  if (input.startsWith('/') && !input.startsWith('//') && !input.includes('\\') && !input.includes('\n')) return true
  try { const url = new URL(input); return url.protocol === 'https:' && !url.username && !url.password }
  catch { return false }
}
export function parseHubBanners(value: string | null): HubBanner[] {
  if (!value) return DEFAULT_HUB_BANNERS
  try {
    const source: unknown = JSON.parse(value)
    if (!Array.isArray(source)) return DEFAULT_HUB_BANNERS
    return source.filter((item): item is HubBanner =>
      item && typeof item === 'object' && typeof item.id === 'string' &&
      typeof item.title === 'string' && typeof item.imageUrl === 'string' && typeof item.href === 'string' &&
      HUB_BANNER_SECTIONS.some(section => section.id === item.section) &&
      isAllowedHubHref(item.href) && isAllowedBannerImage(item.imageUrl) && typeof item.enabled === 'boolean'
    ).sort((a,b) => (a.order || 0)-(b.order || 0)).slice(0,100)
  } catch { return DEFAULT_HUB_BANNERS }
}
export async function readHubBanners() {
  const row = await db.setting.findUnique({where:{key:HUB_BANNERS_KEY}})
  return parseHubBanners(row?.value ?? null)
}
export async function writeHubBanners(items: HubBanner[]) {
  const value = JSON.stringify(items)
  await db.setting.upsert({where:{key:HUB_BANNERS_KEY},create:{key:HUB_BANNERS_KEY,value},update:{value}})
}
