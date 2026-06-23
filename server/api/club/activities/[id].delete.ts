import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!

  const activity = await prisma.clubActivity.findUnique({ where: { id } })
  if (!activity) throw createError({ statusCode: 404, statusMessage: 'Activity not found' })
  await requireClubOwner(user.id, activity.clubId)

  await prisma.clubActivity.delete({ where: { id } })
  return { ok: true }
})
