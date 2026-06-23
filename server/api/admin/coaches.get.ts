export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const { q, page = '1', limit = '20' } = getQuery(event)
  const skip = (Number(page) - 1) * Number(limit)
  const search = typeof q === 'string' ? q.trim() : ''

  const where = search
    ? {
        OR: [
          { nameFa: { contains: search } },
          { nameEn: { contains: search } },
          { city: { contains: search } },
          { user: { email: { contains: search } } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.coach.findMany({
      where,
      include: {
        sport: true,
        user: { select: { id: true, email: true, name: true, suspendedAt: true } },
        _count: { select: { coachSessions: true, trainingPlans: true, reviews: true } },
      },
      orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
      skip,
      take: Number(limit),
    }),
    prisma.coach.count({ where }),
  ])

  return { items, total, page: Number(page), limit: Number(limit) }
})
