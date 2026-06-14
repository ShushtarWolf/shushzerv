export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  if (user.role === 'PLATFORM_ADMIN') {
    return { role: 'PLATFORM_ADMIN' as const, ...(await getPlatformStats()) }
  }

  if (user.role === 'CLUB_ADMIN') {
    const clubId = getQuery(event).clubId as string | undefined
    const finance = await getClubFinanceStats(user.id, clubId)
    const clubs = await prisma.club.count({ where: { ownerId: user.id } })
    const courts = await prisma.court.count({ where: { club: { ownerId: user.id } } })
    return { role: 'CLUB_ADMIN' as const, clubs, courts, ...finance }
  }

  if (user.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: user.id } })
    const wallet = await getUserWalletSummary(user.id)
    const plans = await prisma.trainingPlan.count({ where: { coachId: coach?.id } })
    const students = coach
      ? await prisma.planAssignment.count({ where: { plan: { coachId: coach.id } } })
      : 0
    const earnings = await prisma.walletTransaction.aggregate({
      where: { userId: user.id, type: 'COACH_EARNING' },
      _sum: { amount: true },
    })
    const classes = coach
      ? await prisma.classSession.count({ where: { coachId: coach.id } })
      : 0
    return {
      role: 'COACH' as const,
      sessions: coach?.sessions ?? 0,
      rating: coach?.rating ?? 0,
      plans,
      students,
      classes,
      totalEarnings: earnings._sum.amount ?? 0,
      walletBalance: wallet.balance,
    }
  }

  const wallet = await getUserWalletSummary(user.id)
  const bookings = await prisma.booking.count({ where: { userId: user.id, status: { not: 'CANCELLED' } } })
  const classes = await prisma.classEnrollment.count({ where: { userId: user.id } })
  const matches = await prisma.matchParticipant.count({ where: { userId: user.id } })
  const spent = await prisma.walletTransaction.aggregate({
    where: { userId: user.id, type: { in: ['BOOKING', 'CLASS'] } },
    _sum: { amount: true },
  })

  return {
    role: 'ATHLETE' as const,
    bookings,
    classes,
    matches,
    walletBalance: wallet.balance,
    totalSpent: Math.abs(spent._sum.amount ?? 0),
  }
})
