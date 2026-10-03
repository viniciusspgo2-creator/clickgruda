import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'

/* Em produção o AUTH_SECRET é obrigatório: sem ele qualquer pessoa poderia forjar uma sessão de admin. */
const AUTH_SECRET = process.env.AUTH_SECRET
if (!AUTH_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('AUTH_SECRET não configurado. Defina a variável de ambiente na Vercel.')
}
const SECRET = new TextEncoder().encode(AUTH_SECRET || 'click-gruda-dev-only-secret')

export const SESSION_COOKIE = 'cg_session'

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
  hasAccess: boolean
  isDemo: boolean
  /** ACTIVE | PENDING_MANUAL (cadastro pré-aprovado aguardando liberação do PIX manual) */
  status: string
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function setSessionCookie(token: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearSessionCookie() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    const userId = payload.sub
    if (!userId) return null
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return null
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasAccess: user.hasAccess,
      isDemo: user.isDemo,
      status: user.status,
    }
  } catch {
    return null
  }
}

export function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}
