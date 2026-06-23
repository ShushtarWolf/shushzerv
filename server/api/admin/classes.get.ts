export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const { status, page = '1', limit = '50' } = getQuery(event)
  const skip = (Number(page) - 1) * Number(limit)

  const where = status ? { status: String(status) as 'OPEN' | 'FULL' | 'CANCELLED' } : {}

  const [items, total] = await Promise.all([
    prisma.classSession.findMany({
      where,
      include: { club: true, sport: true, coach: true, _count: { select: { enrollments: true } } },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.classSession.count({ where }),
  ])

  return { items, total }
})
