import { db } from '@/lib/db'

/** Marcador criado somente no novo cadastro grátis; não reclassifica contas antigas. */
export const TRIAL_ORIGIN_PREFIX = 'trial-origin:'

export async function getTrialJourney(from: Date, to: Date) {
  const rows = await db.$queryRaw<{
    registered: bigint; downloaded: bigint; purchased: bigint; trackedSince: Date | null
  }[]>`
    WITH tracked AS (
      SELECT u.id, u."createdAt" FROM "User" u
      INNER JOIN "Setting" marker ON marker.key = 'trial-origin:' || u.id
      WHERE u.role = 'USER' AND u."isDemo" = false AND u."isPreview" = false
    ), cohort AS (
      SELECT id FROM tracked WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
    ), steps AS (
      SELECT c.id,
        EXISTS(SELECT 1 FROM "Download" d WHERE d."userId" = c.id) AS downloaded,
        (EXISTS(SELECT 1 FROM "Payment" p WHERE p."userId" = c.id AND p.status = 'APPROVED' AND p.provider <> 'DEMO' AND p."amountCents" > 0
          AND NOT EXISTS(SELECT 1 FROM "PendingPurchase" r WHERE r.provider = p.provider AND r."externalId" = p."externalId" AND r.status = 'REVOKED'))
         OR EXISTS(SELECT 1 FROM "PendingPurchase" p WHERE p."claimedUserId" = c.id AND p.status = 'APPROVED')) AS purchased
      FROM cohort c
    )
    SELECT COUNT(*) AS registered,
      COUNT(*) FILTER (WHERE downloaded) AS downloaded,
      COUNT(*) FILTER (WHERE purchased) AS purchased,
      (SELECT MIN("createdAt") FROM tracked) AS "trackedSince"
    FROM steps
  `
  const row = rows[0]
  const registered = Number(row?.registered ?? 0), purchased = Number(row?.purchased ?? 0)
  return {
    registered,
    downloaded: Number(row?.downloaded ?? 0),
    purchased,
    conversionRate: registered ? Math.round(purchased / registered * 1000) / 10 : 0,
    trackedSince: row?.trackedSince?.toISOString() ?? null,
  }
}
