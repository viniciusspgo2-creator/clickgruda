import { db } from '@/lib/db'

export const SETTING_KEYS = [
  'payment_provider',
  'price_cents',
  'mercadopago_access_token',
  'asaas_api_key',
  'asaas_sandbox',
  'pix_key',
  'pix_holder',
  'pix_manual_enabled',
  'r2_enabled',
  'r2_endpoint',
  'r2_access_key_id',
  'r2_secret_access_key',
  'r2_bucket',
  'r2_originals_bucket',
  'r2_public_url',
  'max_devices',
  'dl_daily_limit',
] as const

export type SettingsMap = Partial<Record<(typeof SETTING_KEYS)[number], string>>

export async function getSettings(keys?: readonly string[]): Promise<Record<string, string>> {
  const rows = await db.setting.findMany(keys ? { where: { key: { in: [...keys] } } } : undefined)
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}

export async function setSettings(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) {
    if (!key) continue
    await db.setting.upsert({
      where: { key },
      update: { value: value ?? '' },
      create: { key, value: value ?? '' },
    })
  }
}

/** Gateways reais suportados. */
export type GatewayProvider = 'MERCADOPAGO' | 'ASAAS'

/**
 * Gateway ativo baseado nas credenciais salvas no Admin Master.
 * Respeita a preferência (payment_provider) quando ela tem credenciais;
 * caso contrário detecta automaticamente qualquer gateway configurado.
 * Retorna null quando NENHUM gateway está ativo (o checkout cai no PIX manual).
 */
export function resolveProvider(settings: Record<string, string>): GatewayProvider | null {
  const preferred = settings.payment_provider || ''
  if (preferred === 'MERCADOPAGO' && (settings.mercadopago_access_token || '').trim()) return 'MERCADOPAGO'
  if (preferred === 'ASAAS' && (settings.asaas_api_key || '').trim()) return 'ASAAS'
  if ((settings.mercadopago_access_token || '').trim()) return 'MERCADOPAGO'
  if ((settings.asaas_api_key || '').trim()) return 'ASAAS'
  return null
}
