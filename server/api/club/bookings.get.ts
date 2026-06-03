export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')

  return prisma.booking.findMany({
    where: { slot: { court: { club: { ownerId: user.id } } } },
    include: {
      user: { select: { name: true, email: true } },
      slot: { include: { court: { include: { club: true, sport: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })
})
