export type PaymentEventKind = 'PAGO' | 'REEMBOLSADO' | 'CHARGEBACK' | 'IGNORADO'
export type NormalizedPaymentEvent = {
  kind: PaymentEventKind
  type: string
  externalId: string
  reference: string
  email: string
}
export interface PaymentProvider {
  readonly name: string
  checkoutUrl(email: string): string | null
  verify(raw: string, headers: Headers): unknown
  normalize(payload: unknown): NormalizedPaymentEvent[]
}
