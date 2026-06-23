export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  const { status, page = '1', limit = '50' } = getQuery(event)
  const skip = (Number(page) - 1) * Number(limit)

  const where = status ? { status: String(status) as 'PENDING' | 'CONFIRMED' | 'CANCELLED' } : {}

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        slot: { include: { court: { include: { club: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.booking.count({ where }),
  ])

  return { items, total }
})
