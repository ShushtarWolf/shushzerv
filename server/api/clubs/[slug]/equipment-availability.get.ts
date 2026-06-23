import { clubAddonAvailability } from '../../../utils/equipment'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const { date, courtId } = getQuery(event)
  if (!date || !courtId) return []

  const club = await prisma.club.findUnique({ where: { slug } })
  if (!club) throw createError({ statusCode: 404, statusMessage: 'Club not found' })

  return clubAddonAvailability(club.id, String(courtId), String(date))
})
