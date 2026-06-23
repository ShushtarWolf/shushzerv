export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const { status, page = '1', limit = '50' } = getQuery(event)
  const skip = (Number(page) - 1) * Number(limit)

  const where = status ? { status: String(status) as 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED' } : {}

  const [items, total] = await Promise.all([
    prisma.openMatch.findMany({
      where,
      include: { sport: true, club: true, creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.openMatch.count({ where }),
  ])

  return { items, total }
})
