import { entitySportWhere } from '../../utils/visibleSports'

export default defineEventHandler(async (event) => {
  const { status, sport, clubId } = getQuery(event)
  const sportFilter = entitySportWhere(sport)
  if (sportFilter === null) return []

  return prisma.tournament.findMany({
    where: {
      ...(status ? { status: String(status) as 'OPEN' | 'FULL' | 'COMPLETED' | 'CANCELLED' } : {}),
      ...sportFilter,
      ...(clubId ? { clubId: String(clubId) } : {}),
    },
    include: { sport: true, club: true, _count: { select: { registrations: true } } },
    orderBy: { date: 'asc' },
  })
})
