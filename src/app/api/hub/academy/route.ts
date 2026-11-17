import { getSessionUser } from '@/lib/auth'
import { ACADEMY_TRACKS, ACADEMY_LESSONS, ACADEMY_DIAGNOSES, ACADEMY_CHECKLIST, ACADEMY_CALIBRATION, ACADEMY_MILESTONES } from '@/lib/academy-content'

export const dynamic = 'force-dynamic'

/** Conhecimento Técnico é livre para qualquer conta real (grátis, teste ou assinante),
 * mesmo depois dos 20 downloads e do fim dos 3 dias de Studio. Só o modo visitante
 * e o preview ficam com a prévia, sem o conteúdo completo. */
export async function GET() {
 const user = await getSessionUser()
 const canAccess = Boolean(user && !user.isDemo && !user.isPreview && !user.isStudioOnly)
 return Response.json({
  canAccess,
  tracks: ACADEMY_TRACKS,
  lessons: canAccess ? ACADEMY_LESSONS : ACADEMY_LESSONS.map(({id,track,title,minutes,abstract}) => ({id,track,title,minutes,abstract})),
  diagnoses: canAccess ? ACADEMY_DIAGNOSES : ACADEMY_DIAGNOSES.map(({id,symptom,severity}) => ({id,symptom,severity})),
  checklist: canAccess ? ACADEMY_CHECKLIST : [],
  calibration: canAccess ? ACADEMY_CALIBRATION : [],
  milestones: canAccess ? ACADEMY_MILESTONES : [],
 }, { headers: { 'Cache-Control':'private, no-store', 'X-Content-Type-Options':'nosniff' } })
}
