import { coachEquipmentAvailability } from '../../../utils/equipment'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const { date } = getQuery(event)
  if (!date) return []

  const coach = await prisma.coach.findUnique({ where: { id } })
  if (!coach) throw createError({ statusCode: 404, statusMessage: 'Coach not found' })

  return coachEquipmentAvailability(coach.id, String(date))
})
