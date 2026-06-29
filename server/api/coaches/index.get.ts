import { entitySportWhere } from '../../utils/visibleSports'

export default defineEventHandler(async (event) => {
  const { sport } = getQuery(event)
  const sportFilter = entitySportWhere(sport)
  if (sportFilter === null) return []

  return prisma.coach.findMany({
    where: sportFilter,
    include: { sport: true, equipment: true },
    orderBy: [{ featured: 'desc' }, { rating: 'desc' }],
  })
})
