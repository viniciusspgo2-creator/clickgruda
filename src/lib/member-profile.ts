import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

export const MEMBER_PREFIX = 'member-profile:'
export type MemberProfile = { whatsapp: string; extraDevices: number; contactPurpose?: string; registeredAt?: string }
type Client = Pick<Prisma.TransactionClient, 'setting'>

export function normalizeWhatsapp(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Informe seu WhatsApp com DDD.')
  let digits = value.replace(/\D/g, '')
  if (!value.trim().startsWith('+') && [10, 11].includes(digits.length)) digits = '55' + digits
  if (!/^[1-9]\d{9,14}$/.test(digits) || /^(\d)\1+$/.test(digits)) throw new Error('WhatsApp inválido. Informe o DDD e o número; para outro país, use + e o código do país.')
  if (digits.startsWith('55') && !/^55[1-9]\d\d{8,9}$/.test(digits)) throw new Error('Informe um WhatsApp válido com DDD.')
  return digits
}
export function parseMemberProfile(value?: string | null): MemberProfile {
  try {
    const data = JSON.parse(value || '{}')
    return { ...data, whatsapp: typeof data.whatsapp === 'string' ? data.whatsapp : '', extraDevices: Number.isInteger(data.extraDevices) ? Math.max(0, Math.min(20, data.extraDevices)) : 0 }
  } catch { return { whatsapp: '', extraDevices: 0 } }
}
export async function getMemberProfile(id: string, client: Client = db) {
  const row = await client.setting.findUnique({ where: { key: MEMBER_PREFIX + id } })
  return parseMemberProfile(row?.value)
}
export async function saveMemberProfile(id: string, profile: MemberProfile, client: Client = db) {
  const value = JSON.stringify(profile)
  await client.setting.upsert({ where: { key: MEMBER_PREFIX + id }, create: { key: MEMBER_PREFIX + id, value }, update: { value } })
}
