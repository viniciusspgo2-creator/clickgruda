import { db } from '@/lib/db'

/** Armazenamento no model Setting existente: sem alteração de schema ou migração. */
export const ANNOUNCEMENT_SETTING_KEY = 'portal_announcement_v1'
export const ANNOUNCEMENT_KINDS = ['NOVIDADE', 'AVISO', 'INFORMACAO'] as const
export type AnnouncementKind = typeof ANNOUNCEMENT_KINDS[number]
export type PortalAnnouncement = {
  enabled: boolean
  kind: AnnouncementKind
  title: string
  message: string
  revision: string
}

export const ANNOUNCEMENT_DEFAULT: PortalAnnouncement = {
  enabled: false,
  kind: 'NOVIDADE',
  title: '',
  message: '',
  revision: '',
}

export async function readAnnouncement(): Promise<PortalAnnouncement> {
  const row = await db.setting.findUnique({ where: { key: ANNOUNCEMENT_SETTING_KEY } })
  if (!row?.value) return { ...ANNOUNCEMENT_DEFAULT }
  try {
    const raw: unknown = JSON.parse(row.value)
    if (!raw || typeof raw !== 'object') return { ...ANNOUNCEMENT_DEFAULT }
    const data = raw as Partial<PortalAnnouncement>
    return {
      enabled: data.enabled === true,
      kind: ANNOUNCEMENT_KINDS.includes(data.kind as AnnouncementKind) ? data.kind as AnnouncementKind : 'NOVIDADE',
      title: String(data.title ?? '').slice(0, 90),
      message: String(data.message ?? '').slice(0, 650),
      revision: String(data.revision ?? '').slice(0, 80),
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
