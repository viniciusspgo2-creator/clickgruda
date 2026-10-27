import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { randomUUID } from 'node:crypto'
import { getMemberProfile } from '@/lib/member-profile'

/* Em produção o AUTH_SECRET é obrigatório: sem ele qualquer pessoa poderia forjar uma sessão de admin. */
const AUTH_SECRET = process.env.AUTH_SECRET
if (!AUTH_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('AUTH_SECRET não configurado. Defina a variável de ambiente na Vercel.')
}
const SECRET = new TextEncoder().encode(AUTH_SECRET || 'click-gruda-dev-only-secret')

export const SESSION_COOKIE = 'cg_session'
export const PUBLIC_DEMO_SECONDS = 2 * 60 * 60

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  hasAccess: boolean
  isDemo: boolean
  isPreview: boolean
  isPublicDemo?: boolean
  /** ACTIVE | PENDING_MANUAL (cadastro aguardando atendimento e ativação manual) */
  status: string
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(userId: string, sid?: string) {
  return new SignJWT(sid ? { sub: userId, sid } : { sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function setSessionCookie(token: string, maxAge = 60 * 60 * 24 * 30) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

/** Visita sem senha, sem criar usuários ou sessões no banco.
 * As permissões vêm do servidor, nunca de flags enviadas pelo visitante. */
export function publicDemoUser(id: string): SessionUser {
  return { id, name: 'Visitante', email: '', role: 'USER', hasAccess: true, isDemo: true, isPreview: true, isPublicDemo: true, status: 'ACTIVE' }
}

export async function createPublicDemoSession() {
  const user = publicDemoUser(`demo_${randomUUID()}`)
  const token = await new SignJWT({ sub: user.id, kind: 'public-demo' })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime(`${PUBLIC_DEMO_SECONDS}s`).sign(SECRET)
  await setSessionCookie(token, PUBLIC_DEMO_SECONDS)
  return user
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export type SessionResolution = {
  user: SessionUser | null
  /** true quando o cookie é válido mas aquele aparelho foi derrubado (limite de dispositivos / admin) */
  revoked: boolean
  reason?: 'SESSION_REVOKED' | 'ACCOUNT_BLOCKED'
  deviceLimit?: number
}

/** Valida o cookie e o aparelho; clientes comuns com cookie antigo sem sid precisam entrar novamente. */
export async function resolveSession(): Promise<SessionResolution> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return { user: null, revoked: false }
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] })
    const userId = payload.sub
    if (!userId) return { user: null, revoked: false }
    if (payload.kind === 'public-demo') {
      if (!/^demo_[0-9a-f-]{36}$/i.test(userId) || typeof payload.exp !== 'number') return { user: null, revoked: false }
      return { user: publicDemoUser(userId), revoked: false }
    }
    const sid = typeof payload.sid === 'string' ? payload.sid : null

    const [user, device] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      sid ? db.userSession.findUnique({ where: { id: sid } }) : Promise.resolve(null),
    ])
    if (!user) return { user: null, revoked: false }
    if (user.status === 'BLOCKED') return { user: null, revoked: true, reason: 'ACCOUNT_BLOCKED' }
    // Sessões antigas sem identificação de dispositivo precisam fazer login novamente.
    if (!sid && user.role !== 'ADMIN' && !user.isDemo && !user.isPreview) return { user: null, revoked: false }

    if (sid) {
      if (!device || device.userId !== user.id || device.revokedAt) {
        if (device?.userId === user.id && device.revokedReason === 'LIMIT' && !user.isDemo && !user.isPreview) return { user: null, revoked: true, reason: 'SESSION_REVOKED', deviceLimit: 1 + (await getMemberProfile(user.id)).extraDevices }
        return { user: null, revoked: false }
      }
      // "visto por último" com intervalo de 10 min (evita escrever no banco a cada requisição)
      if (Date.now() - device.lastSeenAt.getTime() > 10 * 60 * 1000) {
        db.userSession.update({ where: { id: sid }, data: { lastSeenAt: new Date() } }).catch(() => {})
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasAccess: user.hasAccess,
        isDemo: user.isDemo || user.isPreview,
        isPreview: user.isPreview,
        status: user.status,
      },
      revoked: false,
    }
  } catch {
    return { user: null, revoked: false }
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return (await resolveSession()).user
}

/** id do aparelho (sid) do cookie atual — usado no logout para encerrar só este aparelho. */
export async function getCurrentSessionId(): Promise<string | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] })
    return typeof payload.sid === 'string' ? payload.sid : null
  } catch {
    return null
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
