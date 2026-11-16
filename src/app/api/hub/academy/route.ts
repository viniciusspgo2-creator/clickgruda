import { getSessionUser } from '@/lib/auth'
import { ACADEMY_TRACKS, ACADEMY_LESSONS, ACADEMY_DIAGNOSES, ACADEMY_CHECKLIST, ACADEMY_CALIBRATION, ACADEMY_MILESTONES } from '@/lib/academy-content'

export const dynamic = 'force-dynamic'

/** Aula e diagnóstico completos só saem do servidor após autorização. O conteúdo público
 * permite explorar o programa sem expor aulas exclusivas ao modo visitante ou teste. */
export async function GET() {
 const user = await getSessionUser()
 const canAccess = Boolean(user && !user.isDemo && !user.isPreview && (user.role === 'ADMIN' || (user.hasAccess && !user.isTrial)))
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
