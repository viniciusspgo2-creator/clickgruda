import { db } from '@/lib/db'
import { getSessionUser, jsonError } from '@/lib/auth'

export async function GET() {
  const session = await getSessionUser()
  if (!session || session.role !== 'ADMIN') return jsonError('Não autorizado', 401)

  const [users, usersWithAccess, arts, categories, tags, events, downloads, revenue, pending, suggestionsTotal, suggestionsNew, recentPayments, recentUsers, recentSuggestions, pendingManualCount, pendingManualUsers, searchMissesNew, waitlistTotal, alertsOpen] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { hasAccess: true } }),
      db.art.count(),
      db.category.count(),
      db.tag.count(),
      db.seasonalEvent.count(),
      db.download.count(),
      db.payment.aggregate({ where: { status: 'APPROVED' }, _sum: { amountCents: true }, _count: true }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.themeSuggestion.count(),
      db.themeSuggestion.count({ where: { status: 'NEW' } }),
      db.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { user: { select: { name: true, email: true } } },
      }),
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
      revenueCents: revenue._sum.amountCents || 0,
      approvedPayments: revenue._count,
      pendingPayments: pending,
      suggestionsTotal,
      suggestionsNew,
      pendingManualCount,
      searchMissesNew,
      waitlistTotal,
      alertsOpen,
    },
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      userName: p.user.name,
      userEmail: p.user.email,
      provider: p.provider,
      amountCents: p.amountCents,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    })),
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
