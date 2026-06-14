export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'ATHLETE')

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: user.id },
    include: { sport: true },
  })

  const [enrollments, matches, bookings, badges] = await Promise.all([
    prisma.classEnrollment.count({ where: { userId: user.id } }),
    prisma.matchParticipant.count({ where: { userId: user.id } }),
    prisma.booking.count({ where: { userId: user.id } }),
    prisma.userBadge.findMany({ where: { userId: user.id }, orderBy: { earnedAt: 'desc' } }),
  ])

  const xp = profile?.xp ?? 0

  return {
    profile,
    badges,
    progress: xpProgress(xp),
    stats: { classEnrollments: enrollments, matchesJoined: matches, bookings },
  }
})
