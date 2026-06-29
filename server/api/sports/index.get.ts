import { visibleSportWhere } from '../../utils/visibleSports'

export default defineEventHandler(async () => {
  const sports = await prisma.sport.findMany({
    where: visibleSportWhere(),
    orderBy: { nameEn: 'asc' },
    include: { _count: { select: { courts: true } } },
  })
  return sports.map(({ _count, ...sport }) => ({
    ...sport,
    courtCount: _count.courts,
  }))
})
