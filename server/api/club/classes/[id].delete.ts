import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!

  const cls = await prisma.classSession.findUnique({ where: { id } })
  if (!cls) throw createError({ statusCode: 404, statusMessage: 'Class not found' })
  await requireClubOwner(user.id, cls.clubId)

  await prisma.classSession.update({ where: { id }, data: { status: 'CANCELLED' } })
  return { ok: true }
})
