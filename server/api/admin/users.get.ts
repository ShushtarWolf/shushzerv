export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      wallet: { select: { balance: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
})
