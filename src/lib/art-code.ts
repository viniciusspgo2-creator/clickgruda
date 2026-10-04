/** Código curto e legível da arte: 42 -> "CG-0042". */
export function formatArtCode(code: number | null | undefined): string {
  if (!code && code !== 0) return ''
  return `CG-${String(code).padStart(4, '0')}`
}

/** Extrai o número de um texto digitado ("CG-0042", "cg42", "0042") ou null. */
export function parseArtCode(input: string): number | null {
  const m = /^\s*(?:cg[\s-]?)?0*(\d{1,7})\s*$/i.exec(input)
  return m ? parseInt(m[1], 10) : null
}
