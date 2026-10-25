import { isIP } from 'node:net'

/** URLs usadas na prévia pública — sem protocolos internos, credenciais ou endereços IP. */
export function validBocaoImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 2048) return false
  if (value.startsWith('/uploads/')) return !value.includes('..') && !value.includes('\\') && !value.includes('?')
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password && !isIP(u.hostname) && u.hostname !== 'localhost' && !u.hostname.endsWith('.local')
  } catch { return false }
}
export function cleanBocaoInput(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const body = value as Record<string, unknown>
  if (typeof body.artId !== 'string' || !body.artId.trim() || body.artId.length > 100 || !validBocaoImageUrl(body.imageUrl)) return null
  if (body.note != null && (typeof body.note !== 'string' || body.note.length > 300)) return null
  return {
    artId: body.artId,
    imageUrl: body.imageUrl,
    originalKey: typeof body.originalKey === 'string' && /^originals\/[a-zA-Z0-9_./-]+$/.test(body.originalKey) ? body.originalKey : null,
    note: (typeof body.note === 'string' ? body.note : '').trim(),
  }
}
