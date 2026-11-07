import { db } from '@/lib/db'
import { getMemberProfile } from '@/lib/member-profile'

export const QUOTA_ENDED_MESSAGE = 'Seu limite de downloads ou prazo de teste terminou. Garanta seu acesso completo à Click & Gruda para desbloquear todas as artes e baixar sem limites.'

export class DownloadQuotaExceededError extends Error {
  constructor() { super(QUOTA_ENDED_MESSAGE); this.name = 'DownloadQuotaExceededError' }
}

/** Conta cada solicitação de download bem-sucedida, inclusive repetição e arquivo enviado por ZIP.
 * Contas com cota nula não possuem qualquer restrição. */
export async function getDownloadQuota(user: { id: string; role: string; isDemo: boolean }) {
  if (user.role === 'ADMIN' || user.isDemo) return null
  const profile = await getMemberProfile(user.id)
  const limit = profile.downloadLimit
  if (limit == null && !profile.downloadExpiresAt) return null
  const expiresAt = profile.downloadExpiresAt
  const expired = Boolean(expiresAt && (!Number.isFinite(Date.parse(expiresAt)) || Date.now() >= Date.parse(expiresAt)))
  const used = await db.download.count({ where: { userId: user.id } })
  const effectiveLimit = limit ?? 20
  return { used, limit: effectiveLimit, remaining: expired ? 0 : Math.max(0, effectiveLimit - used), exhausted: expired || used >= effectiveLimit, ...(expiresAt ? {expiresAt, expired} : {}) }
}

/** Transação por usuário: impede ultrapassar a cota com requisições simultâneas.
 * Só executamos após o original estar disponível (URL assinada ou bytes carregados).
 * O SELECT FOR UPDATE serializa as concorrentes, inclusive as de um ZIP. */
export async function recordSuccessfulDownload(user: { id: string; role: string; isDemo: boolean }, artId: string, viaZip: boolean) {
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id} FOR UPDATE`
    if (user.role !== 'ADMIN' && !user.isDemo) {
      const { downloadLimit, downloadExpiresAt } = await getMemberProfile(user.id, tx)
      if (downloadExpiresAt && (!Number.isFinite(Date.parse(downloadExpiresAt)) || Date.now() >= Date.parse(downloadExpiresAt))) throw new DownloadQuotaExceededError()
      if (downloadLimit != null) {
        const used = await tx.download.count({ where: { userId: user.id } })
        if (used >= downloadLimit) throw new DownloadQuotaExceededError()
      }
    }
    await tx.download.create({ data: { userId: user.id, artId, viaZip } })
    await tx.art.update({ where: { id: artId }, data: { downloadsCount: { increment: 1 } } })
  }, { maxWait: 10000, timeout: 15000 })
}
