export type ArtItem = {
  id: string
  title: string
  imageUrl: string
  isLaunch: boolean
  downloadsCount: number
  createdAt: string
  category: { id: string; name: string; emoji: string } | null
  seasonalEvent: { id: string; name: string; emoji: string } | null
  tags: { id: string; name: string }[]
  favorited: boolean
}

export type CatalogEvent = {
  id: string
  name: string
  emoji: string
  month: number
  day: number
  nextDate: string
  daysLeft: number
  artCount: number
}

export type CatalogData = {
  session: {
    id: string
    name: string
    email: string
    role: string
    hasAccess: boolean
    status?: string
  } | null
  categories: { id: string; name: string; emoji: string; icon: string; artCount: number }[]
  tags: { id: string; name: string; artCount: number }[]
  events: CatalogEvent[]
  nextEvent: CatalogEvent | null
  counts: { arts: number; lancamentos: number; favoritas: number; minhasDownloads: number }
  priceCents: number
  provider: 'MERCADOPAGO' | 'ASAAS' | null
  providers: { mercadopago: boolean; asaas: boolean }
  manualPix?: { enabled: boolean; key: string; holder: string }
}

export type PaymentData = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'FAILED'
  provider: 'MERCADOPAGO' | 'ASAAS'
  amountCents: number
  approvedAt?: string | null
  hasAccess?: boolean
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
