import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ titleFa?: string; titleEn?: string; descFa?: string; descEn?: string; date?: string; startTime?: string }>(event)

  const activity = await prisma.clubActivity.findUnique({ where: { id } })
  if (!activity) throw createError({ statusCode: 404, statusMessage: 'Activity not found' })
  await requireClubOwner(user.id, activity.clubId)

  return prisma.clubActivity.update({ where: { id }, data: body })
})
