import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { PHD_LESSONS } from '@/lib/phd-video-course'
import { isSafeOrigin } from '@/lib/security-guards'

export const runtime='nodejs'
export const dynamic='force-dynamic'
const KEY='cg2:academy:phd:youtube-ids:v1'
async function admin(){const user=await getSessionUser();return user?.role==='ADMIN'&&!user.isDemo&&!user.isPreview}
function extractId(input:string):string|null{
 const raw=input.trim()
 if(/^[a-zA-Z0-9_-]{11}$/.test(raw))return raw
 try{const u=new URL(raw),h=u.hostname.toLowerCase();if(h==='youtu.be'||h==='www.youtu.be')return /^[a-zA-Z0-9_-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):null
  if(!['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com'].includes(h))return null
  let id=u.searchParams.get('v')||''
  if(!id&&(/^(\/embed\/|\/shorts\/|\/live\/)/).test(u.pathname))id=u.pathname.split('/')[2]||''
  return /^[a-zA-Z0-9_-]{11}$/.test(id)?id:null
 }catch{return null}
}
export async function GET(){
 if(!await admin())return Response.json({error:'Não autorizado'},{status:403})
 const row=await db.setting.findUnique({where:{key:KEY}})
 let current:Record<string,string>={};try{current=row?.value?JSON.parse(row.value):{}}catch{}
 return Response.json({videos:PHD_LESSONS.map(l=>({...l,youtubeId:current[String(l.number)]||l.youtubeId,custom:Boolean(current[String(l.number)])}))},{headers:{'Cache-Control':'private, no-store'}})
}
export async function PATCH(req:Request){
 if(!isSafeOrigin(req))return Response.json({error:'Origem inválida'},{status:403})
 if(!await admin())return Response.json({error:'Não autorizado'},{status:403})
 if(Number(req.headers.get('content-length')||0)>10240)return Response.json({error:'Payload inválido'},{status:413})
 const body=await req.json().catch(()=>null) as {number?:unknown;url?:unknown}|null
 const number=Number(body?.number),raw=body?.url
 if(!Number.isInteger(number)||number<1||number>60||typeof raw!=='string'||raw.length>320)return Response.json({error:'Aula ou link inválido'},{status:400})
 const videoId=raw.trim()?extractId(raw):null
 if(raw.trim()&&!videoId)return Response.json({error:'Informe um link oficial do YouTube ou ID válido (11 caracteres).'},{status:400})
 await db.$transaction(async tx=>{
  const row=await tx.setting.findUnique({where:{key:KEY}})
  let current:Record<string,string>={};try{current=row?.value?JSON.parse(row.value):{}}catch{}
  if(videoId)current[String(number)]=videoId;else delete current[String(number)]
  await tx.setting.upsert({where:{key:KEY},create:{key:KEY,value:JSON.stringify(current)},update:{value:JSON.stringify(current)}})
 })
 return Response.json({ok:true,number,videoId},{headers:{'Cache-Control':'private, no-store'}})
}
