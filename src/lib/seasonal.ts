export type SeasonalRule = 'MOTHERS_DAY' | 'FATHERS_DAY' | 'EASTER' | 'CARNIVAL' | 'BLACK_FRIDAY'

/** N-ésimo domingo (1-based) de um mês, em um ano. */
function nthSunday(year: number, month: number, n: number): Date {
  const first = new Date(year, month - 1, 1)
  const offset = (7 - first.getDay()) % 7
  return new Date(year, month - 1, 1 + offset + (n - 1) * 7, 23, 59, 59)
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day, 23, 59, 59)
}

/** Data de uma regra móvel em um ano específico. */
export function ruleDate(rule: string, year: number): Date | null {
  switch (rule) {
    case 'MOTHERS_DAY':
      return nthSunday(year, 5, 2) // 2º domingo de maio
    case 'FATHERS_DAY':
      return nthSunday(year, 8, 2) // 2º domingo de agosto
    case 'EASTER':
      return easterSunday(year)
    case 'CARNIVAL': {
      const d = easterSunday(year)
      d.setDate(d.getDate() - 47) // terça-feira de Carnaval
      return d
    }
    case 'BLACK_FRIDAY': {
      const thanksgiving = new Date(year, 10, 1, 23, 59, 59)
      const offset = (4 - thanksgiving.getDay() + 7) % 7 // 1ª quinta de novembro
      thanksgiving.setDate(1 + offset + 21) // 4ª quinta
      thanksgiving.setDate(thanksgiving.getDate() + 1) // sexta seguinte
      return thanksgiving
    }
    default:
      return null
  }
}

/** Returns the next occurrence (yearly) of a month/day date, inclusive of today. */
export function nextOccurrence(month: number, day: number, from: Date = new Date()): Date {
  const y = from.getFullYear()
  const thisYear = new Date(y, month - 1, day, 23, 59, 59)
  if (thisYear.getTime() >= from.getTime()) return thisYear
  return new Date(y + 1, month - 1, day, 23, 59, 59)
}

/** Próxima ocorrência de um evento — respeita datas móveis (Dia das Mães, Páscoa, Carnaval...). */
export function nextEventDate(
  e: { month: number; day: number; rule?: string | null },
  from: Date = new Date()
): Date {
  if (e.rule) {
    const y = from.getFullYear()
    const thisYear = ruleDate(e.rule, y)
    if (thisYear && thisYear.getTime() >= from.getTime()) return thisYear
    const nextYear = ruleDate(e.rule, y + 1)
    if (nextYear) return nextYear
  }
  return nextOccurrence(e.month, e.day, from)
}

export function daysUntil(target: Date, from: Date = new Date()): number {
  return Math.max(0, Math.ceil((target.getTime() - from.getTime()) / 86400000))
}

export function formatBRDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * Principais datas comemorativas do Brasil para quem vende canecas personalizadas.
 * (Datas irrelevantes ficaram de fora de propósito.)
 * month/day são o "reserva" — quando há `rule`, a data real é calculada todo ano.
 */
export const DEFAULT_SEASONAL_EVENTS: {
  name: string
  emoji: string
  month: number
  day: number
  rule?: SeasonalRule
}[] = [
  { name: 'Ano Novo', emoji: '🎆', month: 1, day: 1 },
  { name: 'Carnaval', emoji: '🎭', month: 2, day: 17, rule: 'CARNIVAL' },
  { name: 'Dia da Mulher', emoji: '👩', month: 3, day: 8 },
  { name: 'Páscoa', emoji: '🐣', month: 4, day: 5, rule: 'EASTER' },
  { name: 'Dia do Trabalhador', emoji: '🛠️', month: 5, day: 1 },
  { name: 'Dia das Mães', emoji: '💐', month: 5, day: 10, rule: 'MOTHERS_DAY' },
  { name: 'Dia dos Namorados', emoji: '💘', month: 6, day: 12 },
  { name: 'Festa Junina', emoji: '🌽', month: 6, day: 24 },
  { name: 'Dia do Amigo', emoji: '🤝', month: 7, day: 20 },
  { name: 'Dia dos Avós', emoji: '👵', month: 7, day: 26 },
  { name: 'Dia dos Pais', emoji: '👨\u200d👧\u200d👦', month: 8, day: 9, rule: 'FATHERS_DAY' },
  { name: 'Outubro Rosa', emoji: '🎀', month: 10, day: 1 },
  { name: 'Dia das Crianças', emoji: '🧸', month: 10, day: 12 },
  { name: 'Dia do Professor', emoji: '👩\u200d🏫', month: 10, day: 15 },
  { name: 'Halloween', emoji: '🎃', month: 10, day: 31 },
  { name: 'Novembro Azul', emoji: '💙', month: 11, day: 1 },
  { name: 'Black Friday', emoji: '🛒', month: 11, day: 27, rule: 'BLACK_FRIDAY' },
  { name: 'Natal', emoji: '🎄', month: 12, day: 25 },
]
