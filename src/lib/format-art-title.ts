/** Ajusta somente títulos TOTALMENTE EM MAIÚSCULAS; nunca altera dados originais. */
export function formatArtTitle(value: string): string {
  const text = value.trim()
  const letters = text.match(/\p{L}/gu)?.join('') ?? ''
  if (!letters || letters !== letters.toLocaleUpperCase('pt-BR')) return text
  return text.toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s\-–—/([{])([\p{L}])/gu, (_part, before: string, initial: string) => before + initial.toLocaleUpperCase('pt-BR'))
    .replace(/\bCg(?=-\d+\b)/g, 'CG')
    .replace(/\b3d\b/gi, '3D')
}
