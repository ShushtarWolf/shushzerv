import { isVisibleSportSlug } from '../../utils/visibleSports'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const coach = await prisma.coach.findUnique({
    where: { id },
    include: { sport: true, equipment: { orderBy: { nameFa: 'asc' } } },
  })
  if (!coach || !isVisibleSportSlug(coach.sport.slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Coach not found' })
  }
  return coach
})
