import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId } = getQuery(event)

  if (!clubId) throw createError({ statusCode: 400, statusMessage: 'clubId required' })
  await requireClubOwner(user.id, String(clubId))

  return prisma.review.findMany({
    where: { clubId: String(clubId) },
    include: {
      user: { select: { id: true, name: true, nameEn: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
})
