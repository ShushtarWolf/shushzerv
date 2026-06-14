export default defineEventHandler(async (event) => {
  const { sport, city, clubId } = getQuery(event)
  const session = await getUserSession(event)
  const userId = session?.user?.id

  const classes = await prisma.classSession.findMany({
    where: {
      status: { not: 'CANCELLED' },
      ...(sport ? { sport: { slug: String(sport) } } : {}),
      ...(city ? { club: { city: String(city) } } : {}),
      ...(clubId ? { clubId: String(clubId) } : {}),
    },
    include: { club: true, sport: true, coach: true },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  if (!userId) return classes

  const enrollments = await prisma.classEnrollment.findMany({
    where: { userId, classSessionId: { in: classes.map((c) => c.id) } },
    select: { classSessionId: true },
  })
  const enrolledIds = new Set(enrollments.map((e) => e.classSessionId))

  return classes.map((c) => ({ ...c, enrolled: enrolledIds.has(c.id) }))
})
