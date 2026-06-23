export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'PLATFORM_ADMIN')
  const { q, page = '1', limit = '20' } = getQuery(event)
  const skip = (Number(page) - 1) * Number(limit)
  const search = typeof q === 'string' ? q.trim() : ''

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
        ],
      }
    : {}

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { wallet: true, _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ])

  return { items, total, page: Number(page), limit: Number(limit) }
})
