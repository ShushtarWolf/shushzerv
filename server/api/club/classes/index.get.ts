import { requireClubOwner } from '../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId } = getQuery(event)

  if (!clubId) throw createError({ statusCode: 400, statusMessage: 'clubId required' })
  await requireClubOwner(user.id, String(clubId))

  return prisma.classSession.findMany({
    where: { clubId: String(clubId) },
    include: {
      sport: true,
      coach: true,
      enrollments: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: [{ date: 'desc' }, { startTime: 'asc' }],
  })
})
