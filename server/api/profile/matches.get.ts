import { FIND_PLAYERS_ENABLED } from '#shared/features'

export default defineEventHandler(async (event) => {
  if (!FIND_PLAYERS_ENABLED) return []

  const user = await requireRole(event, 'ATHLETE')

  const participations = await prisma.matchParticipant.findMany({
    where: { userId: user.id },
    include: {
      match: { include: { sport: true, club: true, creator: { select: { id: true, name: true } } } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return participations.map((p) => ({
    id: p.id,
    joinedAt: p.joinedAt,
    match: p.match,
  }))
})
