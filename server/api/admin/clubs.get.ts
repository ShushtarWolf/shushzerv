export default defineEventHandler(async (event) => {
  await requireRole(event, 'PLATFORM_ADMIN')
  return prisma.club.findMany({
    include: {
      owner: { select: { name: true, email: true } },
      wallet: { select: { balance: true } },
      _count: { select: { courts: true, classSessions: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
})
