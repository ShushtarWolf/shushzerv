export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')

  return prisma.club.findMany({
    where: { ownerId: user.id },
    include: {
      courts: { include: { sport: true } },
    },
    orderBy: { nameEn: 'asc' },
  })
})
