/** Cache em memória só da amostra já reduzida e marcada. Nunca guarda originais.
 * A rota valida a sessão antes de consultar o cache, inclusive em acertos. */
const MAX_BYTES = 16 * 1024 * 1024
const TTL = 20 * 60 * 1000
const entries = new Map<string, { bytes: Buffer; expires: number }>()
let used = 0
export function cachedProtectedPreview(key: string): Buffer | null {
  const entry = entries.get(key)
  if (!entry) return null
  entries.delete(key)
  if (entry.expires <= Date.now()) { used -= entry.bytes.length; return null }
  entries.set(key, entry)
  return entry.bytes
}
export function cacheProtectedPreview(key: string, bytes: Buffer) {
  const prior = entries.get(key)
  if (prior) { entries.delete(key); used -= prior.bytes.length }
  if (bytes.length > MAX_BYTES) return
  entries.set(key, { bytes, expires: Date.now() + TTL }); used += bytes.length
  while (used > MAX_BYTES) {
    const oldest = entries.entries().next().value
    if (!oldest) break
    entries.delete(oldest[0]); used -= oldest[1].bytes.length
  }
}
