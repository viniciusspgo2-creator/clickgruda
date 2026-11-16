import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { PHD_LESSONS } from '@/lib/phd-video-course'

export const dynamic='force-dynamic'
export async function GET(){
 const user=await getSessionUser()
 const canAccess=Boolean(user && !user.isDemo && !user.isPreview && (user.role==='ADMIN'||(user.hasAccess&&!user.isTrial)))
 if(!canAccess)return Response.json({canAccess:false,videos:[]},{headers:{'Cache-Control':'private, no-store'}})
 const row=await db.setting.findUnique({where:{key:'cg2:academy:phd:youtube-ids:v1'}})
 let overrides:Record<string,string>={}
 try{overrides=row?.value?JSON.parse(row.value):{}}catch{}
 const videos=PHD_LESSONS.map(lesson=>({number:lesson.number,youtubeId:typeof overrides[String(lesson.number)]==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(overrides[String(lesson.number)])?overrides[String(lesson.number)]:lesson.youtubeId}))
 return Response.json({canAccess:true,videos},{headers:{'Cache-Control':'private, no-store'}})
}
