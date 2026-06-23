export default defineEventHandler(async (event) => {
  const sessionUser = await requireRole(event, 'ATHLETE')

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } })

  const profile = await prisma.athleteProfile.findUnique({
    where: { userId: sessionUser.id },
    include: { sport: true },
  })

  const [enrollments, matches, bookings, badges] = await Promise.all([
    prisma.classEnrollment.count({ where: { userId: sessionUser.id } }),
    prisma.matchParticipant.count({ where: { userId: sessionUser.id } }),
    prisma.booking.count({ where: { userId: sessionUser.id } }),
    prisma.userBadge.findMany({ where: { userId: sessionUser.id }, orderBy: { earnedAt: 'desc' } }),
  ])

  const xp = profile?.xp ?? 0

  return {
    profile,
    user: { phone: dbUser.phone, favoriteSports: dbUser.favoriteSports, locale: dbUser.locale, name: dbUser.name },
    badges,
    progress: xpProgress(xp),
    stats: { classEnrollments: enrollments, matchesJoined: matches, bookings },
  }
})
