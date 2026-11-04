import { db } from '@/lib/db'

/** Usa a configuração Setting existente: sem alterar schema nem executar migrações. */
export const ANNOUNCEMENT_SETTING_KEY = 'portal_announcement_v1'
export const ANNOUNCEMENT_KINDS = ['NOVIDADE', 'AVISO', 'INFORMACAO'] as const
export type AnnouncementKind = typeof ANNOUNCEMENT_KINDS[number]
export type AnnouncementContent = {
  kind: AnnouncementKind
  title: string
  message: string
}
export type PortalAnnouncement = AnnouncementContent & {
  enabled: boolean
  revision: string
  layout?: 'single' | 'double'
  secondary?: AnnouncementContent
}

export const ANNOUNCEMENT_DEFAULT: PortalAnnouncement = {
  enabled: false,
  kind: 'NOVIDADE',
  title: '',
  message: '',
  revision: '',
  layout: 'single',
  secondary: { kind: 'NOVIDADE', title: '', message: '' },
}

const safeKind = (kind: unknown): AnnouncementKind =>
  ANNOUNCEMENT_KINDS.includes(kind as AnnouncementKind) ? kind as AnnouncementKind : 'NOVIDADE'

export async function readAnnouncement(): Promise<PortalAnnouncement> {
  const row = await db.setting.findUnique({ where: { key: ANNOUNCEMENT_SETTING_KEY } })
  if (!row?.value) return { ...ANNOUNCEMENT_DEFAULT }
  try {
    const raw: unknown = JSON.parse(row.value)
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ...ANNOUNCEMENT_DEFAULT }
    const data = raw as Partial<PortalAnnouncement>
    const secondary = data.secondary && typeof data.secondary === 'object' && !Array.isArray(data.secondary)
      ? data.secondary as Partial<AnnouncementContent> : {}
    return {
      enabled: data.enabled === true,
      kind: safeKind(data.kind),
      title: String(data.title ?? '').slice(0, 90),
      message: String(data.message ?? '').slice(0, 650),
      revision: String(data.revision ?? '').slice(0, 80),
      layout: data.layout === 'double' ? 'double' : 'single',
      secondary: {
        kind: safeKind(secondary.kind),
        title: String(secondary.title ?? '').slice(0, 90),
        message: String(secondary.message ?? '').slice(0, 650),
      },
    }
  } catch { return { ...ANNOUNCEMENT_DEFAULT } }
}

export async function writeAnnouncement(value: PortalAnnouncement) {
  await db.setting.upsert({
    where: { key: ANNOUNCEMENT_SETTING_KEY },
    create: { key: ANNOUNCEMENT_SETTING_KEY, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  })
}
