/** Vocabulário pequeno e explícito; não depende de serviços pagos nem reclassifica artes.
 * Mantenha sugestões específicas para evitar resultados sem relação com a busca. */
const ALIASES: Record<string, string[]> = {
  goku: ['dragon ball', 'son goku'],
  dragonball: ['dragon ball', 'goku'],
  naruto: ['uzumaki'],
  onepiece: ['one piece', 'luffy'],
  luffy: ['one piece'],
  pokemon: ['pokémon', 'pikachu'],
  pikachu: ['pokemon', 'pokémon'],
  mae: ['mãe', 'mamãe', 'mamae'],
  mamae: ['mamãe', 'mãe'],
  papai: ['pai'],
  pais: ['pai', 'dia dos pais'],
  maes: ['mães', 'dia das mães'],
  avo: ['avó', 'avô', 'vovó', 'vovô'],
  vovo: ['vovó', 'vovô', 'avó', 'avô'],
  natalino: ['natal', 'papai noel'],
  natalina: ['natal', 'papai noel'],
  pascoa: ['páscoa', 'coelho'],
  dia: [],
  namorados: ['amor', 'romântico'],
  dorama: ['k-drama', 'drama coreano'],
  flork: ['meme', 'bonequinho'],
}

export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

const GENERIC = new Set(['arte', 'artes', 'estampa', 'estampas', 'caneca', 'canecas', 'personalizada', 'personalizadas'])
const CONNECTORS = new Set(['de', 'do', 'da', 'dos', 'das', 'o', 'a', 'os', 'as', 'para', 'com', 'e', 'em'])

/** Remove conectores e termos genéricos SOMENTE quando há termos mais específicos. */
export function searchTokens(query: string): string[] {
  const pieces = query.slice(0, 160).split(/[\s,;/]+/u).map((t) => t.trim()).filter(Boolean)
  const withoutConnectors = pieces.filter((token) => !CONNECTORS.has(normalizeSearch(token)))
  const useful = withoutConnectors.filter((token) => !GENERIC.has(normalizeSearch(token)))
  return (useful.length ? useful : withoutConnectors.length ? withoutConnectors : pieces).slice(0, 5)
}

export function searchVariants(token: string): string[] {
  const clean = token.slice(0, 60)
  const normalized = normalizeSearch(clean).replace(/[^a-z0-9]/g, '')
  return [...new Set([clean, ...(ALIASES[normalized] || [])])].slice(0, 4)
}

export function relatedSearches(query: string): string[] {
  const variants = searchTokens(query).flatMap((token) => searchVariants(token).slice(1))
  return [...new Set(variants)].slice(0, 4)
}
