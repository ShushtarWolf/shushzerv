import { requireClubOwner } from '../../../../utils/clubAuth'

export default defineEventHandler(async (event) => {
  const user = await requireRole(event, 'CLUB_ADMIN')
  const id = getRouterParam(event, 'id')!

  const tournament = await prisma.tournament.findUnique({ where: { id } })
  if (!tournament?.clubId) throw createError({ statusCode: 404, statusMessage: 'Tournament not found' })
  await requireClubOwner(user.id, tournament.clubId)

  return prisma.tournamentRegistration.findMany({
    where: { tournamentId: id },
    include: {
      user: { select: { id: true, name: true, nameEn: true, email: true } },
    },
    orderBy: { registeredAt: 'asc' },
  })
})
