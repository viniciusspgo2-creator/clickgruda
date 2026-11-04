/** Bocões são artes complementares, usando exclusivamente Art + Tag existentes. */
import { formatArtCode, parseArtCode } from '@/lib/art-code'

export const BOCAO_MARKER = 'bocao'
export const BOCAO_PARENT_PREFIX = 'bocao-arte-'

export function bocaoParentTag(code: number): string {
  return `${BOCAO_PARENT_PREFIX}${code}`
}

export function bocaoParentFromTags(tags: readonly string[]): number | null {
  for (const name of tags) {
    if (!name.startsWith(BOCAO_PARENT_PREFIX)) continue
    const value = name.slice(BOCAO_PARENT_PREFIX.length)
    if (!/^\d+$/.test(value)) continue
    return parseArtCode(value)
  }
  return null
}

export function isBocaoTags(tags: readonly string[]): boolean {
  return tags.includes(BOCAO_MARKER)
}

export function bocaoDisplayTitle(description: string, parent: number): string {
  const clean = description.trim().replace(/^boc[aã]o\s*(?:da|de)?\s*arte:?\s*(?:CG-?\d+)?\s*(?:[—–-]\s*)?/i, '')
  return `Bocão da arte ${formatArtCode(parent)}${clean ? ` — ${clean}` : ''}`
}
