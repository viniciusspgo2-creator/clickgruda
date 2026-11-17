import {getSessionUser} from '@/lib/auth'
import {db} from '@/lib/db'
import {isSafeOrigin} from '@/lib/security-guards'
import {studioMasterCommand} from '@/lib/unified-studio-admin'
import {accessDecision,parseStudioGrant,STUDIO_GRANT_PREFIX} from '@/lib/unified-studio-access'
export const runtime='nodejs'
const headers={'Cache-Control':'private, no-store'}
async function allowed(){const u=await getSessionUser();return u?.role==='ADMIN'&&!u.isDemo&&!u.isPreview}
export async function GET(){
 if(!await allowed())return Response.json({error:'Não autorizado.'},{status:401,headers})
 const users=await db.user.findMany({select:{id:true,name:true,email:true,createdAt:true,hasAccess:true,accessType:true,status:true,isDemo:true,isPreview:true,isStudioOnly:true,role:true},orderBy:{createdAt:'desc'},take:500})
 const overrides=await db.setting.findMany({where:{key:{startsWith:STUDIO_GRANT_PREFIX}},select:{key:true,value:true}})
 const grants=new Map(overrides.map(x=>[x.key.slice(STUDIO_GRANT_PREFIX.length),parseStudioGrant(x.value)]))
 let overview=null,error:string|null=null
 try{overview=await studioMasterCommand({action:'overview'})}catch(e){error=e instanceof Error?e.message:'Studio indisponível.'}
 return Response.json({users:users.map(u=>({id:u.id,name:u.name,email:u.email,accessType:u.accessType,decision:accessDecision(u,grants.get(u.id)||parseStudioGrant(null)),grant:grants.get(u.id)||parseStudioGrant(null)})),overview,error},{headers})
}
export async function PATCH(req:Request){
 if(!await allowed())return Response.json({error:'Não autorizado.'},{status:401,headers})
 if(!isSafeOrigin(req))return Response.json({error:'Origem não autorizada.'},{status:403,headers})
 const body=await req.json().catch(()=>({}))
 const id=String(body.userId||''),mode=body.mode
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id)||!['inherit','grant','block'].includes(mode))return Response.json({error:'Parâmetros inválidos.'},{status:400,headers})
 const expiresAt=mode==='grant'&&body.expiresAt?String(body.expiresAt):null
 if(expiresAt&&(!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now()))return Response.json({error:'A validade deve ser futura.'},{status:400,headers})
 const user=await db.user.findUnique({where:{id},select:{id:true,name:true,role:true,hasAccess:true,status:true,isDemo:true,isPreview:true,isStudioOnly:true,accessType:true,createdAt:true}})
 if(!user)return Response.json({error:'Cliente não encontrado.'},{status:404,headers})
 if(user.isDemo||user.isPreview)return Response.json({error:'Conta de visualização não recebe acesso premium.'},{status:403,headers})
 const value=JSON.stringify({mode,expiresAt,updatedAt:new Date().toISOString()})
 const previous=await db.setting.findUnique({where:{key:STUDIO_GRANT_PREFIX+id}})
 const decision=accessDecision(user,parseStudioGrant(value))
 // Para revogar, o Studio deve confirmar o bloqueio ANTES de gravar a nova regra no Portal.
 if(!decision.allowed){
  try{await studioMasterCommand({action:'sync-user',userId:id,allow:false,mode})}catch(e){return Response.json({error:'Bloqueio não confirmado no Studio. Nenhuma mudança aplicada. '+(e instanceof Error?e.message:'')},{status:503,headers})}
 }
 if(mode==='inherit')await db.setting.deleteMany({where:{key:STUDIO_GRANT_PREFIX+id}})
 else await db.setting.upsert({where:{key:STUDIO_GRANT_PREFIX+id},create:{key:STUDIO_GRANT_PREFIX+id,value},update:{value}})
 let syncPending=false
 if(decision.allowed){
  try{await studioMasterCommand({action:'sync-user',userId:id,allow:true,mode,expiresAt:decision.expiresAt})}catch{syncPending=true}
 }
 return Response.json({ok:true,decision,syncPending,previous:previous?.value?'updated':'new'},{headers})
}
export async function POST(req:Request){
 if(!await allowed())return Response.json({error:'Não autorizado.'},{status:401,headers})
 if(!isSafeOrigin(req))return Response.json({error:'Origem não autorizada.'},{status:403,headers})
 const body=await req.json().catch(()=>({}))
 if(!['legacy-create','legacy-revoke'].includes(body.action))return Response.json({error:'Ação inválida.'},{status:400,headers})
 try{return Response.json(await studioMasterCommand({action:body.action,clientName:body.clientName,days:body.days,code:body.code}),{headers})}
 catch(e){return Response.json({error:e instanceof Error?e.message:'Studio indisponível.'},{status:503,headers})}
}
