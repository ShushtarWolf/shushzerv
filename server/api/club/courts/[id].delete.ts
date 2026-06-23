import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!

  const court = await prisma.court.findUnique({ where: { id }, include: { club: true } })
  if (!court) throw createError({ statusCode: 404, statusMessage: 'Court not found' })
  await requireClubOwner(user.id, court.clubId)

  await prisma.court.delete({ where: { id } })
  return { ok: true }
})
