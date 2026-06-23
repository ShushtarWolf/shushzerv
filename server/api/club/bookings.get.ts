export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId } = getQuery(event)

  return prisma.booking.findMany({
    where: {
      slot: {
        court: {
          club: {
            ownerId: user.id,
            ...(clubId ? { id: String(clubId) } : {}),
          },
        },
      },
    },
    include: {
      user: { select: { name: true, email: true } },
      slot: { include: { court: { include: { club: true, sport: true } } } },
      equipment: true,
    },
    orderBy: { createdAt: 'desc' },
  })
})
