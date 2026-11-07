import { financialLedger } from '@/lib/payments/financial-ledger'
import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

export async function GET() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)

  const [users, usersWithAccess, arts, categories, tags, events, downloads, ledger, suggestionsTotal, suggestionsNew, recentUsers, recentSuggestions, pendingManualCount, pendingManualUsers, searchMissesNew, waitlistTotal, alertsOpen, enhanceNew] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { hasAccess: true } }),
      db.art.count(),
      db.category.count(),
      db.tag.count(),
      db.seasonalEvent.count(),
      db.download.count(),
      financialLedger(),
      db.themeSuggestion.count(),
      db.themeSuggestion.count({ where: { status: 'NEW' } }),
      db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, name: true, email: true, hasAccess: true, createdAt: true } }),
      db.themeSuggestion.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }),
      db.user.count({ where: { status: 'PENDING_MANUAL', hasAccess: false } }),
      db.user.findMany({
        where: { status: 'PENDING_MANUAL', hasAccess: false },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, status: true, updatedAt: true },
      }),
      db.searchMiss.count({ where: { status: 'NEW' } }),
      db.catalogoWaitlist.count({ where: { notifiedAt: null } }),
      db.accountAlert.count({ where: { resolved: false } }),
      db.artEnhanceRequest.count({ where: { status: 'NEW' } }),
    ])

  return Response.json({
    stats: {
      users,
      usersWithAccess,
      arts,
      categories,
      tags,
      events,
      downloads,
      revenueCents: ledger.stats.revenueCents,
      approvedPayments: ledger.stats.approvedPayments,
      pendingPayments: ledger.stats.pendingPayments,
      testPaymentsCount: ledger.stats.testPaymentsCount,
      missingCaktoAmounts: ledger.stats.missingCaktoAmounts,
      suggestionsTotal,
      suggestionsNew,
      pendingManualCount,
      searchMissesNew,
      waitlistTotal,
      alertsOpen,
      enhanceNew,
    },
    recentPayments: ledger.payments.filter(p => !p.isTest).slice(0, 6),
    recentUsers: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    pendingManualUsers: pendingManualUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      updatedAt: u.updatedAt.toISOString(),
    })),
    recentSuggestions: recentSuggestions.map((s) => ({
      id: s.id,
      message: s.message,
      name: s.name,
      contact: s.contact,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
    })),
  })
}
