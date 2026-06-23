import { requireClubOwner } from '../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const { clubId } = getQuery(event)
  if (!clubId) return []

  await requireClubOwner(user.id, String(clubId))

  return prisma.courtAddon.findMany({
    where: { clubId: String(clubId) },
    include: { court: { include: { sport: true } } },
    orderBy: { nameFa: 'asc' },
  })
})
