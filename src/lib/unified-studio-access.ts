import 'server-only'
import { db } from '@/lib/db'

/** Teste do Studio/Editor/2D: 3 dias desde o cadastro (conta grátis). */
export const STUDIO_TRIAL_DAYS = 3
export const STUDIO_TRIAL_MS = STUDIO_TRIAL_DAYS * 86400000
export const STUDIO_GRANT_PREFIX = 'hub2:studio-permission:'
export const SSO_TICKET_PREFIX = 'hub2:studio-ticket:'
export type StudioGrant = { mode: 'inherit' | 'grant' | 'block'; expiresAt: string | null; updatedAt: string }
export type AccessDecision = { allowed: boolean; kind: 'MEMBER' | 'TRIAL' | 'GRANT' | 'BLOCKED' | 'EXPIRED' | 'UNAVAILABLE' | 'STUDIO'; expiresAt: string | null; override: StudioGrant['mode'] }
export function parseStudioGrant(value: string | null | undefined): StudioGrant {
 try {
  const g = JSON.parse(value ?? '{}') as Partial<StudioGrant>
  if (g.mode === 'block' || g.mode === 'grant') return {mode:g.mode,expiresAt:typeof g.expiresAt==='string'?g.expiresAt:null,updatedAt:typeof g.updatedAt==='string'?g.updatedAt:''}
 } catch { /* configuração antiga ou vazia */ }
 return {mode:'inherit',expiresAt:null,updatedAt:''}
}
export type StudioUser = {id:string;role:string;hasAccess:boolean;status:string;isDemo:boolean;isPreview:boolean;isStudioOnly:boolean;accessType:string|null;createdAt:Date}
export function accessDecision(user:StudioUser, grant:StudioGrant, now=Date.now()):AccessDecision {
 if(user.status==='BLOCKED'||user.isDemo||user.isPreview) return {allowed:false,kind:'BLOCKED',expiresAt:null,override:grant.mode}
 if(grant.mode==='block')return {allowed:false,kind:'BLOCKED',expiresAt:null,override:grant.mode}
 // Conta universal só-Studio: Studio 3D/2D liberado sem prazo; Biblioteca navegável em prévia protegida e Academia liberada, downloads/bônus bloqueados por hasAccess=false.
 if(user.isStudioOnly) return {allowed:true,kind:'STUDIO',expiresAt:null,override:grant.mode}
 if(grant.mode==='grant'){
  const expires=grant.expiresAt?Date.parse(grant.expiresAt):NaN
  if(grant.expiresAt&&(!Number.isFinite(expires)||expires<=now))return {allowed:false,kind:'EXPIRED',expiresAt:grant.expiresAt,override:grant.mode}
  return {allowed:true,kind:'GRANT',expiresAt:grant.expiresAt,override:grant.mode}
 }
 if(user.role==='ADMIN')return {allowed:true,kind:'MEMBER',expiresAt:null,override:grant.mode}
 if(!user.hasAccess)return {allowed:false,kind:'UNAVAILABLE',expiresAt:null,override:grant.mode}
 if(user.accessType==='TRIAL'){
  const trialEnds=new Date(user.createdAt.getTime()+STUDIO_TRIAL_MS).toISOString()
  return {allowed:now<Date.parse(trialEnds),kind:now<Date.parse(trialEnds)?'TRIAL':'EXPIRED',expiresAt:trialEnds,override:grant.mode}
 }
 return {allowed:true,kind:'MEMBER',expiresAt:null,override:grant.mode}
}
export async function userStudioDecision(user:StudioUser) {
 const grant=parseStudioGrant((await db.setting.findUnique({where:{key:STUDIO_GRANT_PREFIX+user.id},select:{value:true}}))?.value)
 return accessDecision(user,grant)
}
