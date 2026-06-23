const sessionInclude = {
  coach: { include: { sport: true } },
  club: true,
  athlete: { select: { id: true, name: true, nameEn: true, email: true } },
  equipment: true,
} as const

export default defineEventHandler(async (event) => {
  const { coachId, status, from, to } = getQuery(event)
  const session = await getUserSession(event)
  const user = session?.user

  // Public: busy slots only (no athlete PII)
  if (!user && coachId) {
    const rows = await prisma.coachSession.findMany({
      where: {
        coachId: String(coachId),
        status: { not: 'CANCELLED' },
        ...(typeof from === 'string' && typeof to === 'string' ? { date: { gte: from, lte: to } } : {}),
      },
      select: { date: true, startTime: true, endTime: true, status: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    return rows
  }

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const statusFilter = typeof status === 'string' && status !== 'all'
    ? { status: status as 'PENDING' | 'CONFIRMED' | 'CANCELLED' }
    : {}

  const dateFilter = typeof from === 'string' && typeof to === 'string'
    ? { date: { gte: from, lte: to } }
    : {}

  if (dbUser.role === 'COACH') {
    const coach = await prisma.coach.findUnique({ where: { userId: dbUser.id } })
    if (!coach) return []

    return prisma.coachSession.findMany({
      where: {
        coachId: coach.id,
        ...statusFilter,
        ...dateFilter,
      },
      include: sessionInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
  }

  if (dbUser.role === 'ATHLETE') {
    return prisma.coachSession.findMany({
      where: {
        athleteId: dbUser.id,
        ...statusFilter,
        ...dateFilter,
      },
      include: sessionInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
  }

  throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
})
