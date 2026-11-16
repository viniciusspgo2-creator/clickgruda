import { getSessionUser } from '@/lib/auth'
import { BONUS_GROUPS,validResourceUrl } from '@/lib/hub-resources'
export const dynamic='force-dynamic'
export async function GET(){
  const user=await getSessionUser()
  const canAccess = Boolean(user && !user.isDemo && (user.role==='ADMIN'||(user.hasAccess&&!user.isTrial)))
  // Links externos só são enviados aos assinantes. No visitante/teste, só metadados.
  const groups=BONUS_GROUPS.filter(group=>!['editor-drives','ferramentas'].includes(group.id)).map(group=>({...group,items:group.items.map(item=>({...item,url:canAccess?validResourceUrl(item.url):null,available:!!validResourceUrl(item.url)}))}))
  return Response.json({groups,canAccess},{headers:{'Cache-Control':'private, no-store'}})
}
