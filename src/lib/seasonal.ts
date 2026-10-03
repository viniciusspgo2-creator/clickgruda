/** Returns the next occurrence (yearly) of a month/day date, inclusive of today. */
export function nextOccurrence(month: number, day: number, from: Date = new Date()): Date {
  const y = from.getFullYear()
  const thisYear = new Date(y, month - 1, day, 23, 59, 59)
  if (thisYear.getTime() >= from.getTime()) return thisYear
  return new Date(y + 1, month - 1, day, 23, 59, 59)
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / 86400000))
}

export function formatBRDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
