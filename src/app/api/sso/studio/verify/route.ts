import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import { db } from '@/lib/db'
import { accessDecision, parseStudioGrant, STUDIO_GRANT_PREFIX, SSO_TICKET_PREFIX } from '@/lib/unified-studio-access'
export const runtime='nodejs'
const noStore={'Cache-Control':'no-store'}
function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
/** Chamado só pelo servidor do Studio; ticket válido por 60 segundos e consumido uma única vez. */
export async function POST(req:Request){
 const secret=process.env.UNIFIED_SSO_SECRET
 if(!secret||secret.length<32)return Response.json({ok:false},{status:503,headers:noStore})
 if(Number(req.headers.get('content-length')||0)>2048)return Response.json({ok:false},{status:413,headers:noStore})
 const {ticket}=await req.json().catch(()=>({ticket:null})) as {ticket?:unknown}
 if(typeof ticket!=='string'||ticket.length>220||!/^[-a-zA-Z0-9_]+\.[-a-zA-Z0-9_]{43}$/.test(ticket))return Response.json({ok:false},{status:401,headers:noStore})
 const provided=req.headers.get('x-studio-sso-signature')??''
 const expected=createHmac('sha256',secret).update(ticket).digest('hex')
 if(!/^[a-f0-9]{64}$/.test(provided)||!equal(provided,expected))return Response.json({ok:false},{status:401,headers:noStore})
 const userId=ticket.split('.')[0],key=SSO_TICKET_PREFIX+userId,hash=createHash('sha256').update(ticket).digest('hex')
 const verified=await db.$transaction(async tx=>{
  const ticketRow=await tx.setting.findUnique({where:{key}})
  if(!ticketRow)return null
  let data:{hash:string;expires:number;tool:string}
  try{data=JSON.parse(ticketRow.value)}catch{return null}
  if(!equal(data.hash,hash)||!Number.isFinite(data.expires)||data.expires<Date.now())return null
  const consumed=await tx.setting.deleteMany({where:{key,value:ticketRow.value}})
  if(consumed.count!==1)return null
  const [user,grantRow]=await Promise.all([
   tx.user.findUnique({where:{id:userId},select:{id:true,name:true,role:true,hasAccess:true,status:true,isDemo:true,isPreview:true,accessType:true,createdAt:true}}),
   tx.setting.findUnique({where:{key:STUDIO_GRANT_PREFIX+userId}}),
  ])
  if(!user)return null
  const decision=accessDecision(user,parseStudioGrant(grantRow?.value))
  if(!decision.allowed)return null
  if(!['3d','2d','editor'].includes(data.tool))return null
  return {id:user.id,name:user.name,registeredAt:user.createdAt.toISOString(),tool:data.tool,kind:decision.kind,expiresAt:decision.expiresAt,override:decision.override}
 })
 if(!verified)return Response.json({ok:false},{status:403,headers:noStore})
 return Response.json({ok:true,user:verified},{headers:noStore})
}
