export default defineEventHandler(async (event) => {
  const { status, sport, clubId } = getQuery(event)

  return prisma.tournament.findMany({
    where: {
      ...(status ? { status: String(status) as 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED' } : {}),
      ...(sport ? { sport: { slug: String(sport) } } : {}),
      ...(clubId ? { clubId: String(clubId) } : {}),
    },
    include: { sport: true, club: true, _count: { select: { registrations: true } } },
    orderBy: { date: 'asc' },
  })
})
