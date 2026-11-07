import { db } from '@/lib/db'
import { jsonError } from '@/lib/auth'
import {
  STUDIO_PREFIX,
  deliverStudioBonus,
  studioBonusEnabled,
  validBonusCron,
} from '@/lib/studio-bonus'
export const runtime = 'nodejs'
export const maxDuration = 60
export async function POST(req: Request) {
  if (!validBonusCron(req)) return jsonError('Não autorizado', 401)
  if (!studioBonusEnabled()) return jsonError('Integração desativada', 404)
  // Busca pendências por conteúdo; não depende de percorrer apenas os primeiros clientes já entregues.
  const rows = await db.$queryRaw<
    { key: string }[]
  >`SELECT key FROM "Setting" WHERE CASE WHEN key LIKE 'studio-bonus:%' THEN (value::jsonb->>'deliveredVersion')::integer < (value::jsonb->'event'->>'version')::integer AND (value::jsonb->>'nextAttemptAt')::timestamptz <= NOW() ELSE FALSE END ORDER BY (value::jsonb->>'nextAttemptAt')::timestamptz LIMIT 5`
  for (const row of rows)
    await deliverStudioBonus(row.key.slice(STUDIO_PREFIX.length))
  return Response.json({ attempted: rows.length })
}
