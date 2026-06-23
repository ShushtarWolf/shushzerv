export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'PLATFORM_ADMIN')
  const { q, page = '1', limit = '20' } = getQuery(event)
  const skip = (Number(page) - 1) * Number(limit)
  const search = typeof q === 'string' ? q.trim() : ''

  const where = search
    ? {
        OR: [
          { nameFa: { contains: search } },
          { nameEn: { contains: search } },
          { city: { contains: search } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.club.findMany({
      where,
      include: {
        owner: { select: { name: true, email: true } },
        wallet: true,
        _count: { select: { courts: true, classSessions: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.club.count({ where }),
  ])

  return { items, total, page: Number(page), limit: Number(limit) }
})
