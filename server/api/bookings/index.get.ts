export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  return prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      slot: { include: { court: { include: { club: true, sport: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
})
