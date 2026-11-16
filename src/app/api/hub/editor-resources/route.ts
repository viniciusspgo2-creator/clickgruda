import { getSessionUser } from '@/lib/auth'
import { BONUS_GROUPS, validResourceUrl } from '@/lib/hub-resources'
import { db } from '@/lib/db'

export const dynamic='force-dynamic'
/** Link de recurso do Studio Editor só é entregue ao usuário autenticado com acesso ou teste ativo. */
export async function GET(){
 const user=await getSessionUser()
 // O prazo de 7 dias vem da data original de cadastro, nunca de cada sessão.
 const trialRecord=user?.isTrial && !user.isDemo && !user.isPreview
  ? await db.user.findUnique({where:{id:user.id},select:{createdAt:true}})
  : null
 const trialValid=Boolean(trialRecord && Date.now() < trialRecord.createdAt.getTime()+7*24*60*60*1000)
 const canAccess=Boolean(user && !user.isDemo && !user.isPreview && (user.role==='ADMIN'||(user.hasAccess&&!user.isTrial)||trialValid))
 const groups=BONUS_GROUPS.filter(group=>['editor-drives','ferramentas'].includes(group.id)).map(group=>({
  ...group,
  items:group.items.map(item=>({...item,url:canAccess?validResourceUrl(item.url):null,available:!!validResourceUrl(item.url)})),
 }))
 return Response.json({groups,canAccess},{headers:{'Cache-Control':'private, no-store'}})
}
