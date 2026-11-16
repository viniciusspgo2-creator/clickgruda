import { getSessionUser, jsonError } from '@/lib/auth'
import { isSafeOrigin } from '@/lib/security-guards'
import { isAllowedBannerImage, isAllowedHubHref, readHubBanners, writeHubBanners, HUB_BANNER_SECTIONS, type HubBanner } from '@/lib/hub-banners'
export const dynamic = 'force-dynamic'
async function master(){return (await getSessionUser())?.role === 'ADMIN'}
export async function GET(){
  if (!await master()) return jsonError('Acesso restrito ao Admin Mestre',403)
  return Response.json({banners:await readHubBanners()},{headers:{'Cache-Control':'no-store'}})
}
export async function PUT(req:Request){
  if (!await master()) return jsonError('Acesso restrito ao Admin Mestre',403)
  if (!isSafeOrigin(req)) return jsonError('Origem não permitida',403)
  const body = await req.json().catch(()=>null)
  if (!body || !Array.isArray(body.banners) || body.banners.length>100) return jsonError('Lista inválida',400)
  const ids = new Set<string>()
  const banners: HubBanner[] = []
  for(const item of body.banners){
    if(!item || typeof item !== 'object') return jsonError('Banner inválido',400)
    const id=String(item.id||'').trim(),title=String(item.title||'').trim(),description=String(item.description||'').trim(),
      imageUrl=String(item.imageUrl||'').trim(),href=String(item.href||'').trim(),eyebrow=String(item.eyebrow||'').trim()
    if(!/^[\w-]{1,65}$/.test(id)||ids.has(id)||title.length<2||title.length>100||description.length>240||eyebrow.length>45||
      !isAllowedBannerImage(imageUrl)||imageUrl.length>750||!isAllowedHubHref(href)||href.length>750||
      !HUB_BANNER_SECTIONS.some(section=>section.id===item.section)||typeof item.enabled!=='boolean'||
      !Number.isInteger(item.order)||item.order<0||item.order>10000) return jsonError('Verifique título, seção, imagem e link de cada banner',400)
    ids.add(id)
    banners.push({id,title,description,imageUrl,href,eyebrow,section:item.section,enabled:item.enabled,order:item.order})
  }
  await writeHubBanners(banners)
  return Response.json({banners},{headers:{'Cache-Control':'no-store'}})
}
