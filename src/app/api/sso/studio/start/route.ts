import { randomBytes, createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { SSO_TICKET_PREFIX, userStudioDecision } from '@/lib/unified-studio-access'
import { SITE_URL } from '@/lib/site'

export const runtime='nodejs'
const tools = new Set(['3d','2d','editor'])
/** Destino de retorno do SSO: só as ferramentas de bônus do Studio, nunca URL externa. */
const BONUS_NEXT=/^\/bonus(\/(qr|whatsapp|orcamento|pdf|excel))?\/?$/
export async function GET(req:Request){
 const origin = process.env.STUDIO_API_ORIGIN || process.env.NEXT_PUBLIC_STUDIO_URL
 const secret = process.env.UNIFIED_SSO_SECRET
 if(!origin || !secret || secret.length<32)return Response.json({error:'Login integrado ainda não configurado.'},{status:503,headers:{'Cache-Control':'no-store'}})
 let studio:URL
 try{studio=new URL(origin);if(studio.username||studio.password||studio.pathname!=='/'||studio.search||studio.hash||!(['https:'].includes(studio.protocol)||(process.env.NODE_ENV!=='production'&&studio.hostname==='localhost'&&studio.protocol==='http:')))throw Error()}catch{return Response.json({error:'Destino de Studio inválido.'},{status:503})}
 const tool=new URL(req.url).searchParams.get('tool')||''
 if(!tools.has(tool))return Response.json({error:'Ferramenta inválida.'},{status:400})
 const next=new URL(req.url).searchParams.get('next')||''
 const bonusNext=BONUS_NEXT.test(next)?next:null
 const session=await getSessionUser()
 if(!session||session.isDemo||session.isPreview)return NextResponse.redirect(new URL('/',SITE_URL))
 // Acesso só-Studio: só o Studio 3D e o 2D; o Editor de Artes fica fora.
 if(session.isStudioOnly&&tool==='editor')return Response.json({error:'Este acesso é só para o Studio 3D e 2D.'},{status:403,headers:{'Cache-Control':'no-store'}})
 const user=await db.user.findUnique({where:{id:session.id},select:{id:true,role:true,hasAccess:true,status:true,isDemo:true,isPreview:true,isStudioOnly:true,previewMaxSessions:true,accessType:true,createdAt:true}})
 if(!user)return Response.json({error:'Conta não encontrada.'},{status:401})
 const access=await userStudioDecision(user)
 if(!access.allowed)return Response.json({error:'Seu Studio não está ativo. Confira o prazo ou procure o suporte.'},{status:403,headers:{'Cache-Control':'no-store'}})
 const ticket=`${user.id}.${randomBytes(32).toString('base64url')}`
 const value=JSON.stringify({hash:createHash('sha256').update(ticket).digest('hex'),expires:Date.now()+60000,tool})
 await db.setting.upsert({where:{key:SSO_TICKET_PREFIX+user.id},create:{key:SSO_TICKET_PREFIX+user.id,value},update:{value}})
 const url=new URL('/api/sso/consume',studio.origin);url.searchParams.set('ticket',ticket)
 if(bonusNext)url.searchParams.set('next',bonusNext)
 const response=NextResponse.redirect(url,303);response.headers.set('Cache-Control','no-store');response.headers.set('Referrer-Policy','no-referrer')
 return response
}
